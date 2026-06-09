-- Fix — app_block_tenant_key_change referenced new.client_id / new.site_id directly. On tables
-- without those columns (e.g. public.clients) PL/pgSQL raises 'record "new" has no field
-- "client_id"' because SQL boolean expressions do not guarantee short-circuit field resolution.
-- This broke ANY authenticated UPDATE on clients (e.g. complete_paid_onboarding, and the
-- clients_customer_update RLS path).
--
-- Fix: read fields via to_jsonb(new/old) so absent keys are simply not present (jsonb `?`),
-- never a field-resolution error. Behavior is unchanged: block tenant-key changes (agency_id,
-- client_id, site_id) for end users; allow service_role / direct admin to re-parent.
create or replace function public.app_block_tenant_key_change()
returns trigger
language plpgsql
as $$
declare
  n jsonb := to_jsonb(new);
  o jsonb := to_jsonb(old);
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (n->>'agency_id') is distinct from (o->>'agency_id')
       or (n ? 'client_id' and (n->>'client_id') is distinct from (o->>'client_id'))
       or (n ? 'site_id' and (n->>'site_id') is distinct from (o->>'site_id')) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
