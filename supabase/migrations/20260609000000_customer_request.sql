-- Customer request submission — the missing MMVP path (Customer → Submit → Ticket).
--
-- submit_customer_request: SECURITY DEFINER. The ONLY customer ticket-creation path. It verifies
-- auth.uid(), resolves the caller's active contributor org membership (owner/admin/member; viewers
-- cannot submit), verifies the chosen site belongs to that org (no tenant hopping — agency_id and
-- client_id are derived server-side, never from the client), creates the ticket (status 'received')
-- + the first inbound customer message + a 'request_received' audit event, and returns the ticket id.
-- The browser never inserts tickets directly; RLS is not bypassed from client code.
-- Additive; verify on dev first.

create or replace function public.submit_customer_request(
  p_site_id uuid,
  p_title text,
  p_description text default null,
  p_priority text default 'normal'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_org uuid;
  v_agency uuid;
  v_ticket_id text;
  v_num text;
  v_pri public.ticket_priority;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  -- Active contributor membership (viewers cannot submit).
  select m.org_id into v_org
  from public.org_members m
  where m.auth_user_id = v_uid and m.status = 'active'
    and m.role in ('org_owner', 'org_admin', 'org_member')
  limit 1;
  if v_org is null then raise exception 'not_authorized_customer' using errcode = '42501'; end if;

  -- The chosen site MUST belong to the caller's org. agency_id is derived here (no tenant hopping).
  select s.agency_id into v_agency from public.sites s where s.id = p_site_id and s.client_id = v_org;
  if v_agency is null then raise exception 'site_not_in_org' using errcode = '42501'; end if;

  if btrim(coalesce(p_title, '')) = '' then raise exception 'title_required' using errcode = '22023'; end if;

  begin
    v_pri := p_priority::public.ticket_priority;
  exception when others then
    v_pri := 'normal';
  end;

  v_ticket_id := gen_random_uuid()::text;
  v_num := 'REQ-' || upper(substr(replace(v_ticket_id, '-', ''), 1, 8));
  select email into v_email from auth.users where id = v_uid;

  insert into public.tickets
    (id, agency_id, client_id, site_id, ticket_number, title, description, status, priority, identity_confidence, submitter_email)
  values
    (v_ticket_id, v_agency, v_org, p_site_id, v_num, btrim(p_title),
     nullif(btrim(coalesce(p_description, '')), ''), 'received', v_pri, 'claimed', v_email);

  insert into public.ticket_messages
    (agency_id, client_id, site_id, ticket_id, author_id, author_role, message_body, message_direction)
  values
    (v_agency, v_org, p_site_id, v_ticket_id, v_uid::text, 'site_user',
     coalesce(nullif(btrim(coalesce(p_description, '')), ''), btrim(p_title)), 'inbound');

  insert into public.ticket_audit_events
    (agency_id, client_id, site_id, ticket_id, actor_id, actor_role, event_type, summary)
  values
    (v_agency, v_org, p_site_id, v_ticket_id, v_uid::text, 'site_user', 'request_received', 'Customer submitted request');

  return jsonb_build_object('ticket_id', v_ticket_id, 'ticket_number', v_num, 'status', 'received');
end;
$$;

revoke all on function public.submit_customer_request(uuid, text, text, text) from public, anon;
grant execute on function public.submit_customer_request(uuid, text, text, text) to authenticated;
