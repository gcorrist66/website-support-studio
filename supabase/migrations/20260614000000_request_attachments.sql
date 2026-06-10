-- Request attachments — customer-uploaded files for support requests.
--
-- Additive only: creates a dedicated attachment table, a public storage bucket for uploaded files,
-- and a request-submit RPC that can persist attachment metadata alongside the ticket. Existing
-- submit_customer_request remains available for older callers.

do $$ begin
  create table if not exists public.ticket_attachments (
    id uuid primary key default gen_random_uuid(),
    agency_id uuid not null,
    client_id uuid not null,
    site_id uuid not null,
    ticket_id uuid not null references public.tickets (id) on delete cascade,
    storage_path text not null,
    file_name text not null,
    mime_type text not null,
    file_size_bytes bigint not null default 0,
    created_by text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
  );
exception when duplicate_table then null; end $$;

create index if not exists ticket_attachments_ticket_id_idx on public.ticket_attachments (ticket_id);
create index if not exists ticket_attachments_client_id_idx on public.ticket_attachments (client_id);
create index if not exists ticket_attachments_agency_id_idx on public.ticket_attachments (agency_id);

create or replace function public.app_block_ticket_attachment_tenant_key_change()
returns trigger language plpgsql as $$
begin
  if auth.role() is not null and auth.role() <> 'service_role' then
    if (new.agency_id is distinct from old.agency_id)
       or (new.client_id is distinct from old.client_id)
       or (new.site_id is distinct from old.site_id)
       or (new.ticket_id is distinct from old.ticket_id) then
      raise exception 'tenant_key_change_forbidden' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists ticket_attachments_block_tenant_key_change on public.ticket_attachments;
create trigger ticket_attachments_block_tenant_key_change
  before update on public.ticket_attachments
  for each row execute function public.app_block_ticket_attachment_tenant_key_change();

do $$
begin
  execute 'revoke all on public.ticket_attachments from anon;';
  execute 'grant select, insert, update, delete on public.ticket_attachments to authenticated;';
  execute 'alter table public.ticket_attachments enable row level security;';
  execute 'alter table public.ticket_attachments force row level security;';
exception when undefined_table then
  null;
end $$;

drop policy if exists ticket_attachments_customer_select on public.ticket_attachments;
create policy ticket_attachments_customer_select on public.ticket_attachments
  for select to authenticated using (app_is_org_member(client_id));

drop policy if exists ticket_attachments_operator_select on public.ticket_attachments;
create policy ticket_attachments_operator_select on public.ticket_attachments
  for select to authenticated using (app_operator_in_agency(agency_id));

insert into storage.buckets (id, name, public)
values ('request_attachments', 'request_attachments', true)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists request_attachments_owner_select on storage.objects;
create policy request_attachments_owner_select on storage.objects
  for select to authenticated
  using (bucket_id = 'request_attachments' and auth.uid() = owner);

drop policy if exists request_attachments_owner_insert on storage.objects;
create policy request_attachments_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'request_attachments' and auth.uid() = owner);

drop policy if exists request_attachments_owner_delete on storage.objects;
create policy request_attachments_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'request_attachments' and auth.uid() = owner);

create or replace function public.submit_customer_request_with_attachments(
  p_site_id uuid,
  p_title text,
  p_description text default null,
  p_priority text default 'normal',
  p_attachments jsonb default '[]'::jsonb
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
  v_attachment jsonb;
  v_file_name text;
  v_storage_path text;
  v_mime_type text;
  v_file_size bigint;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select m.org_id into v_org
  from public.org_members m
  where m.auth_user_id = v_uid and m.status = 'active'
    and m.role in ('org_owner', 'org_admin', 'org_member')
  limit 1;
  if v_org is null then raise exception 'not_authorized_customer' using errcode = '42501'; end if;

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
    (id, agency_id, client_id, site_id, ticket_number, title, description, status, priority, identity_confidence, submitter_email, request_kind)
  values
    (v_ticket_id, v_agency, v_org, p_site_id, v_num, btrim(p_title),
     nullif(btrim(coalesce(p_description, '')), ''), 'received', v_pri, 'claimed', v_email, 'support');

  insert into public.ticket_messages
    (agency_id, client_id, site_id, ticket_id, author_id, author_role, message_body, message_direction)
  values
    (v_agency, v_org, p_site_id, v_ticket_id, v_uid::text, 'site_user',
     coalesce(nullif(btrim(coalesce(p_description, '')), ''), btrim(p_title)), 'inbound');

  insert into public.ticket_audit_events
    (agency_id, client_id, site_id, ticket_id, actor_id, actor_role, event_type, summary)
  values
    (v_agency, v_org, p_site_id, v_ticket_id, v_uid::text, 'site_user', 'request_received', 'Customer submitted request');

  if p_attachments is not null and jsonb_typeof(p_attachments) = 'array' then
    for v_attachment in select * from jsonb_array_elements(p_attachments)
    loop
      v_file_name := nullif(btrim(coalesce(v_attachment->>'file_name', '')), '');
      v_storage_path := nullif(btrim(coalesce(v_attachment->>'storage_path', '')), '');
      v_mime_type := nullif(btrim(coalesce(v_attachment->>'mime_type', '')), '');
      begin
        v_file_size := coalesce((v_attachment->>'file_size_bytes')::bigint, 0);
      exception when others then
        v_file_size := 0;
      end;

      if v_file_name is not null and v_storage_path is not null and v_mime_type is not null then
        insert into public.ticket_attachments
          (agency_id, client_id, site_id, ticket_id, storage_path, file_name, mime_type, file_size_bytes, created_by)
        values
          (v_agency, v_org, p_site_id, v_ticket_id, v_storage_path, v_file_name, v_mime_type, v_file_size, v_uid::text);
      end if;
    end loop;
  end if;

  return jsonb_build_object('ticket_id', v_ticket_id, 'ticket_number', v_num, 'status', 'received');
end;
$$;

revoke all on function public.submit_customer_request_with_attachments(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.submit_customer_request_with_attachments(uuid, text, text, text, jsonb) to authenticated;
