-- Operator access — single identity resolver for post-login routing.
--
-- resolve_my_identity() classifies the authenticated caller so the app routes correctly:
--   operator  -> operator console            (checked FIRST: staff are never sent to customer onboarding)
--   customer  -> customer experience          (claims a pending paid org if present, idempotent)
--   none      -> setup / workspace-required
--
-- Operator + customer experiences stay separate: an active operator short-circuits before any
-- customer claim runs, so a staff login never creates an org or enters onboarding. A customer
-- (no operator row) is resolved via the existing claim. Identity is by auth.uid() only.
-- SECURITY DEFINER (operator row is readable under RLS, but a definer resolver avoids any
-- chicken-and-egg and keeps the contract simple). Additive; apply to dev first.

create or replace function public.resolve_my_identity()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_op_id uuid;
  v_op_role text;
  v_op_agency uuid;
  v_op_name text;
  v_claim jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- 1) Operator first — never route staff through customer onboarding.
  select id, role::text, agency_id, display_name
    into v_op_id, v_op_role, v_op_agency, v_op_name
  from public.operators
  where auth_user_id = v_uid and status = 'active'
  limit 1;

  if v_op_id is not null then
    return jsonb_build_object(
      'kind', 'operator',
      'operator_id', v_op_id,
      'role', v_op_role,
      'agency_id', v_op_agency,
      'display_name', v_op_name
    );
  end if;

  -- 2) Customer — claim a pending paid org if present (idempotent). Only runs for non-operators.
  v_claim := public.claim_my_paid_org();
  if coalesce((v_claim ->> 'has_org')::boolean, false) then
    return jsonb_build_object(
      'kind', 'customer',
      'org_id', v_claim ->> 'org_id',
      'onboarding_status', v_claim ->> 'onboarding_status'
    );
  end if;

  -- 3) Unknown — neither operator nor paid customer.
  return jsonb_build_object('kind', 'none');
end;
$$;

revoke all on function public.resolve_my_identity() from public, anon;
grant execute on function public.resolve_my_identity() to authenticated;
