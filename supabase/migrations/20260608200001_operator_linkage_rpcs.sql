-- Phase (operator linkage) — RPCs: bootstrap / invite / accept / revoke / unlink.
--
-- Implements AUTH_OPERATOR_LINKAGE_PLAN.md §5 RPCs. All are SECURITY DEFINER with a pinned
-- search_path. Invariants enforced everywhere:
--   * auth_user_id ONLY — never authorize by email (email is addressing/metadata only).
--   * one auth user <-> one operator (partial-unique index + explicit checks).
--   * no role escalation, no agency escalation (accept never changes role/agency).
--   * unlink preserves the operator record (clears auth_user_id only).
-- Does NOT enable RLS, customer access, production OAuth, flags; does NOT touch the onboarding
-- RPC or customer identity model. These run pre-RLS today and continue to under RLS (definer).

-- ============================================================================
-- bootstrap_first_operator — service-role only, idempotent. Creates + links the first operator
-- under the canonical WSS agency to an EXPLICIT auth.uid() (obtained out-of-band after the
-- founder's first OAuth login). Never matches by email.
-- ============================================================================
create or replace function public.bootstrap_first_operator(
  p_auth_user_id uuid,
  p_role text default 'agency_admin',
  p_display_name text default 'WSS Operator',
  p_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_agency_slug constant text := 'website-support-studio';
  v_caller_role text := auth.role();
  v_agency_id uuid;
  v_operator_id uuid;
  v_email text;
begin
  -- Service-role only: block end-user (authenticated/anon) callers. Direct DB/SQL-editor
  -- admin (no JWT role) is allowed for dashboard bootstrap.
  if v_caller_role is not null and v_caller_role <> 'service_role' then
    raise exception 'bootstrap_requires_service_role' using errcode = '42501';
  end if;

  if not public.is_valid_uuid_text(p_auth_user_id::text) then
    raise exception 'invalid_auth_user_id' using errcode = '22023';
  end if;
  if p_role not in ('agency_admin', 'cs_agent', 'gary_approver') then
    raise exception 'invalid_operator_role' using errcode = '22023';
  end if;
  if btrim(coalesce(p_display_name, '')) = '' then
    raise exception 'display_name_required' using errcode = '22023';
  end if;

  -- Idempotent: if this auth user is already linked to an operator, return it unchanged.
  select o.id, o.agency_id into v_operator_id, v_agency_id
  from public.operators o where o.auth_user_id = p_auth_user_id limit 1;
  if v_operator_id is not null then
    return jsonb_build_object('operator_id', v_operator_id, 'agency_id', v_agency_id,
                              'status', 'active', 'reused', true);
  end if;

  -- Resolve the canonical agency; FAIL CLOSED (never the dev seed, never an orphan).
  select a.id into v_agency_id from public.agencies a where a.slug = c_agency_slug;
  if v_agency_id is null then
    raise exception 'canonical_agency_missing' using errcode = 'P0001';
  end if;

  v_email := lower(btrim(coalesce(p_email, p_auth_user_id::text || '@operator.local')));

  -- Create + link fresh (no email matching). A pre-existing (agency,email) row is a config
  -- conflict the admin must resolve explicitly rather than silently adopt by email.
  begin
    insert into public.operators (auth_user_id, agency_id, email, display_name, role, status)
    values (p_auth_user_id, v_agency_id, v_email, btrim(p_display_name), p_role::public.operator_role, 'active')
    returning id into v_operator_id;
  exception
    when unique_violation then
      raise exception 'operator_conflict_resolve_manually' using errcode = '23505';
  end;

  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (v_agency_id, v_operator_id, 'bootstrapped', p_auth_user_id,
          jsonb_build_object('role', p_role));

  return jsonb_build_object('operator_id', v_operator_id, 'agency_id', v_agency_id,
                            'status', 'active', 'reused', false);
end;
$$;

-- Small pure UUID-text validator (mirrors src/auth isValidAuthUserId).
create or replace function public.is_valid_uuid_text(p_value text)
returns boolean
language sql
immutable
as $$
  select p_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
$$;

-- ============================================================================
-- invite_operator — an active agency_admin (authorized by auth.uid()) provisions an invited
-- operator row + a token invitation. Reuses an existing unlinked row for (agency,email).
-- The raw token is generated + emailed by the app; only its hash is stored here.
-- ============================================================================
create or replace function public.invite_operator(
  p_agency_id uuid,
  p_email text,
  p_role text,
  p_display_name text,
  p_token_hash text,
  p_expires_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_operator_id uuid;
  v_invitation_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  -- Caller must be an ACTIVE agency_admin of the target agency (authorized by auth.uid()).
  if not exists (
    select 1 from public.operators o
    where o.auth_user_id = v_uid and o.agency_id = p_agency_id
      and o.role = 'agency_admin' and o.status = 'active'
  ) then
    raise exception 'not_authorized_agency_admin' using errcode = '42501';
  end if;
  if p_role not in ('agency_admin', 'cs_agent', 'gary_approver') then
    raise exception 'invalid_operator_role' using errcode = '22023';
  end if;
  if v_email = '' then
    raise exception 'email_required' using errcode = '22023';
  end if;
  if btrim(coalesce(p_token_hash, '')) = '' or p_expires_at is null then
    raise exception 'token_and_expiry_required' using errcode = '22023';
  end if;

  -- Reuse an existing unlinked operator row for (agency,email), else create one.
  select o.id into v_operator_id from public.operators o
  where o.agency_id = p_agency_id and o.email = v_email;

  if v_operator_id is not null then
    -- Refuse to re-invite an already-linked / active operator.
    if exists (
      select 1 from public.operators o
      where o.id = v_operator_id and (o.auth_user_id is not null or o.status = 'active')
    ) then
      raise exception 'operator_already_active_or_linked' using errcode = '23505';
    end if;
    update public.operators
    set role = p_role::public.operator_role, display_name = btrim(p_display_name),
        status = 'invited'
    where id = v_operator_id;
  else
    insert into public.operators (agency_id, email, display_name, role, status)
    values (p_agency_id, v_email, btrim(p_display_name), p_role::public.operator_role, 'invited')
    returning id into v_operator_id;
  end if;

  insert into public.operator_invitations (
    agency_id, operator_id, email, role, token_hash, status, invited_by_auth_user_id, expires_at
  )
  values (p_agency_id, v_operator_id, v_email, p_role::public.operator_role, p_token_hash,
          'pending', v_uid, p_expires_at)
  returning id into v_invitation_id;

  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (p_agency_id, v_operator_id, 'invited', v_uid, jsonb_build_object('role', p_role));

  return jsonb_build_object('invitation_id', v_invitation_id, 'operator_id', v_operator_id);
end;
$$;

-- ============================================================================
-- accept_operator_invitation — the invitee (authorized by auth.uid()) presents the token hash.
-- Binds auth_user_id + activates atomically. Never changes role/agency. Enforces one user<->one
-- operator. Idempotent for the same user re-accepting.
-- ============================================================================
create or replace function public.accept_operator_invitation(p_token_hash text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.operator_invitations%rowtype;
  v_other uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_inv from public.operator_invitations where token_hash = p_token_hash;
  if v_inv.id is null then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;

  -- Idempotency: same user already accepted this invite and is linked to its operator.
  if v_inv.status = 'accepted' then
    if exists (
      select 1 from public.operators o
      where o.id = v_inv.operator_id and o.auth_user_id = v_uid and o.status = 'active'
    ) then
      return jsonb_build_object('operator_id', v_inv.operator_id, 'status', 'active', 'reused', true);
    end if;
    raise exception 'invitation_already_accepted' using errcode = 'P0001';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'invitation_not_pending' using errcode = 'P0001';
  end if;
  if v_inv.expires_at <= now() then
    update public.operator_invitations set status = 'expired' where id = v_inv.id;
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  -- One auth user <-> one operator: reject if this uid is linked to a different operator.
  select o.id into v_other from public.operators o
  where o.auth_user_id = v_uid and o.id <> v_inv.operator_id limit 1;
  if v_other is not null then
    raise exception 'auth_user_already_linked' using errcode = '23505';
  end if;

  -- Bind + activate. Role/agency are NOT touched (no escalation).
  update public.operators
  set auth_user_id = v_uid, status = 'active'
  where id = v_inv.operator_id and (auth_user_id is null or auth_user_id = v_uid);

  if not found then
    raise exception 'operator_link_conflict' using errcode = '23505';
  end if;

  update public.operator_invitations
  set status = 'accepted', accepted_by_auth_user_id = v_uid, accepted_at = now()
  where id = v_inv.id;

  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (v_inv.agency_id, v_inv.operator_id, 'accepted', v_uid, '{}'::jsonb);
  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (v_inv.agency_id, v_inv.operator_id, 'linked', v_uid, '{}'::jsonb);

  return jsonb_build_object('operator_id', v_inv.operator_id, 'status', 'active', 'reused', false);
end;
$$;

-- ============================================================================
-- revoke_operator_invitation — agency_admin (authorized by auth.uid()) revokes a pending invite
-- and archives the unlinked operator row so it can be cleanly re-invited later.
-- ============================================================================
create or replace function public.revoke_operator_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inv public.operator_invitations%rowtype;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_inv from public.operator_invitations where id = p_invitation_id;
  if v_inv.id is null then
    raise exception 'invitation_invalid' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.operators o
    where o.auth_user_id = v_uid and o.agency_id = v_inv.agency_id
      and o.role = 'agency_admin' and o.status = 'active'
  ) then
    raise exception 'not_authorized_agency_admin' using errcode = '42501';
  end if;
  if v_inv.status = 'accepted' then
    raise exception 'invitation_already_accepted' using errcode = 'P0001';
  end if;

  update public.operator_invitations set status = 'revoked' where id = v_inv.id;
  -- Archive the still-unlinked invited operator row (preserve history; frees re-invite path).
  update public.operators set status = 'archived'
  where id = v_inv.operator_id and auth_user_id is null and status = 'invited';

  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (v_inv.agency_id, v_inv.operator_id, 'revoked', v_uid, '{}'::jsonb);

  return jsonb_build_object('invitation_id', v_inv.id, 'status', 'revoked');
end;
$$;

-- ============================================================================
-- unlink_operator — agency_admin (authorized by auth.uid()) or service role clears the link.
-- Preserves the operator record (only auth_user_id is cleared).
-- ============================================================================
create or replace function public.unlink_operator(p_operator_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_caller_role text := auth.role();
  v_agency_id uuid;
begin
  select o.agency_id into v_agency_id from public.operators o where o.id = p_operator_id;
  if v_agency_id is null then
    raise exception 'operator_not_found' using errcode = 'P0001';
  end if;

  if v_caller_role is distinct from 'service_role' then
    if v_uid is null then
      raise exception 'not_authenticated' using errcode = '28000';
    end if;
    if not exists (
      select 1 from public.operators o
      where o.auth_user_id = v_uid and o.agency_id = v_agency_id
        and o.role = 'agency_admin' and o.status = 'active'
    ) then
      raise exception 'not_authorized_agency_admin' using errcode = '42501';
    end if;
  end if;

  update public.operators set auth_user_id = null where id = p_operator_id;

  insert into public.operator_audit_events (agency_id, operator_id, event_type, actor_auth_user_id, metadata)
  values (v_agency_id, p_operator_id, 'unlinked', v_uid, '{}'::jsonb);

  return jsonb_build_object('operator_id', p_operator_id, 'unlinked', true);
end;
$$;

-- ============================================================================
-- Grants: end-user-callable RPCs to authenticated; bootstrap to service_role only.
-- ============================================================================
revoke all on function public.bootstrap_first_operator(uuid, text, text, text) from public;
revoke all on function public.invite_operator(uuid, text, text, text, text, timestamptz) from public;
revoke all on function public.accept_operator_invitation(text) from public;
revoke all on function public.revoke_operator_invitation(uuid) from public;
revoke all on function public.unlink_operator(uuid) from public;

grant execute on function public.bootstrap_first_operator(uuid, text, text, text) to service_role;
grant execute on function public.invite_operator(uuid, text, text, text, text, timestamptz) to authenticated;
grant execute on function public.accept_operator_invitation(text) to authenticated;
grant execute on function public.revoke_operator_invitation(uuid) to authenticated;
grant execute on function public.unlink_operator(uuid) to authenticated, service_role;
