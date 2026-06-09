-- Fix — app_operator_ticket_ctx OUT params (agency_id/client_id/site_id) collided with the
-- operators table columns in the lookup WHERE clause, so PL/pgSQL's default variable_conflict=error
-- raised 'column reference "agency_id" is ambiguous', breaking every operator workflow RPC.
-- Fix: pin #variable_conflict use_variable (table columns stay qualified as o.*/t.*).
create or replace function public.app_operator_ticket_ctx(
  p_ticket_id text,
  out operator_id uuid, out operator_email text, out operator_role text,
  out agency_id uuid, out client_id uuid, out site_id uuid, out ticket_status text
)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_variable
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  select t.agency_id, t.client_id, t.site_id, t.status::text
    into agency_id, client_id, site_id, ticket_status
  from public.tickets t where t.id = p_ticket_id;
  if agency_id is null then raise exception 'ticket_not_found' using errcode = 'P0001'; end if;
  select o.id, o.email, o.role::text into operator_id, operator_email, operator_role
  from public.operators o where o.auth_user_id = v_uid and o.agency_id = agency_id and o.status = 'active';
  if operator_id is null then raise exception 'not_authorized_operator' using errcode = '42501'; end if;
end;
$$;
