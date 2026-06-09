-- Operator delivery — write path for the support workflow (triage → draft → approval → send → close).
--
-- These SECURITY DEFINER RPCs are how an authenticated operator DELIVERS service on live tickets.
-- They enforce, server-side:
--   * Operator authorization: caller must be an active operator in the ticket's agency.
--   * Deterministic transitions: each action only runs from the valid prior status.
--   * Mandatory approval gate: approve/reject require role = gary_approver.
-- Every action writes the status transition + the relevant child row + an audit event, scoped to the
-- ticket's tenant. Reads are already RLS-scoped (operators view their agency). Additive; dev first.

-- helper: resolve operator + ticket context, or raise. Returns nothing; sets OUT params.
create or replace function public.app_operator_ticket_ctx(
  p_ticket_id text,
  out operator_id uuid, out operator_email text, out operator_role text,
  out agency_id uuid, out client_id uuid, out site_id uuid, out ticket_status text
)
language plpgsql
security definer
set search_path = public
as $$
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

create or replace function public.app_audit(
  p_agency uuid, p_client uuid, p_site uuid, p_ticket text,
  p_actor_id uuid, p_actor_role text, p_event public.audit_event_type, p_summary text
) returns void language sql security definer set search_path = public as $$
  insert into public.ticket_audit_events (agency_id, client_id, site_id, ticket_id, actor_id, actor_role, event_type, summary)
  values (p_agency, p_client, p_site, p_ticket, p_actor_id::text, p_actor_role::public.actor_role, p_event, p_summary);
$$;

-- 1) Triage: received → triaged
create or replace function public.operator_triage_ticket(p_ticket_id text, p_summary text default 'Triaged')
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.ticket_status <> 'received' then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  update public.tickets set status = 'triaged' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'ticket_triaged', coalesce(p_summary,'Triaged'));
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'triaged');
end; $$;

-- 2) Draft reply: triaged|reply_drafted → reply_drafted (supersedes prior drafts)
create or replace function public.operator_draft_reply(p_ticket_id text, p_body text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_draft uuid;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.ticket_status not in ('triaged','reply_drafted') then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  if btrim(coalesce(p_body,'')) = '' then raise exception 'draft_body_required' using errcode='22023'; end if;
  update public.ticket_draft_replies set status = 'superseded' where ticket_id = p_ticket_id and status <> 'sent';
  insert into public.ticket_draft_replies (agency_id, client_id, site_id, ticket_id, drafted_by, draft_body, status)
  values (ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_email, btrim(p_body), 'ready_for_approval')
  returning id into v_draft;
  update public.tickets set status = 'reply_drafted' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'reply_drafted', 'Draft reply prepared');
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'reply_drafted', 'draft_id', v_draft);
end; $$;

-- 3) Request approval: reply_drafted → awaiting_gary_approval
create or replace function public.operator_request_approval(p_ticket_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_draft uuid; v_appr uuid;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.ticket_status <> 'reply_drafted' then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  select id into v_draft from public.ticket_draft_replies where ticket_id = p_ticket_id and status = 'ready_for_approval' order by created_at desc limit 1;
  if v_draft is null then raise exception 'no_ready_draft' using errcode='P0001'; end if;
  insert into public.ticket_approvals (agency_id, client_id, site_id, ticket_id, draft_reply_id, requested_by, approver_role, status, requested_at)
  values (ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, v_draft, ctx.operator_email, 'gary_approver', 'pending', now())
  returning id into v_appr;
  update public.tickets set status = 'awaiting_gary_approval' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'approval_requested', 'Approval requested');
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'awaiting_gary_approval', 'approval_id', v_appr);
end; $$;

-- 4) Approve: awaiting_gary_approval → approved_to_send  (GARY GATE)
create or replace function public.operator_approve_reply(p_ticket_id text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.operator_role <> 'gary_approver' then raise exception 'approval_requires_gary_approver' using errcode='42501'; end if;
  if ctx.ticket_status <> 'awaiting_gary_approval' then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  update public.ticket_approvals set status='approved', approver_id=ctx.operator_email, decided_at=now(), decision_note=p_note
    where ticket_id = p_ticket_id and status='pending';
  update public.tickets set status = 'approved_to_send' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'approval_granted', 'Approved to send');
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'approved_to_send');
end; $$;

-- 5) Reject: awaiting_gary_approval → reply_drafted  (GARY GATE)
create or replace function public.operator_reject_reply(p_ticket_id text, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.operator_role <> 'gary_approver' then raise exception 'approval_requires_gary_approver' using errcode='42501'; end if;
  if ctx.ticket_status <> 'awaiting_gary_approval' then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  update public.ticket_approvals set status='rejected', approver_id=ctx.operator_email, decided_at=now(), decision_note=p_note
    where ticket_id = p_ticket_id and status='pending';
  update public.tickets set status = 'reply_drafted' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'approval_rejected', coalesce(p_note,'Rejected'));
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'reply_drafted');
end; $$;

-- 6) Send: approved_to_send → sent_to_customer
create or replace function public.operator_send_reply(p_ticket_id text, p_recipient_email text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record; v_draft record; v_appr uuid; v_to text;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.ticket_status <> 'approved_to_send' then raise exception 'invalid_transition_from_%', ctx.ticket_status using errcode='P0001'; end if;
  select id, draft_body into v_draft from public.ticket_draft_replies where ticket_id = p_ticket_id and status = 'ready_for_approval' order by created_at desc limit 1;
  if v_draft.id is null then raise exception 'no_ready_draft' using errcode='P0001'; end if;
  select id into v_appr from public.ticket_approvals where ticket_id = p_ticket_id and status='approved' order by decided_at desc limit 1;
  select coalesce(p_recipient_email, submitter_email) into v_to from public.tickets where id = p_ticket_id;
  if btrim(coalesce(v_to,'')) = '' then raise exception 'recipient_email_required' using errcode='22023'; end if;
  insert into public.ticket_communications (agency_id, client_id, site_id, ticket_id, draft_reply_id, approval_id, recipient_email, body, delivery_status, sent_at)
  values (ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, v_draft.id, v_appr, v_to, v_draft.draft_body, 'sent', now());
  update public.ticket_draft_replies set status='sent' where id = v_draft.id;
  update public.tickets set status = 'sent_to_customer' where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'response_sent', 'Response sent to customer');
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'sent_to_customer');
end; $$;

-- 7) Close: any non-closed → closed
create or replace function public.operator_close_ticket(p_ticket_id text, p_closure_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ctx record;
begin
  ctx := public.app_operator_ticket_ctx(p_ticket_id);
  if ctx.ticket_status = 'closed' then raise exception 'already_closed' using errcode='P0001'; end if;
  update public.tickets set status='closed', closure_note=coalesce(p_closure_note, closure_note), closed_at=now() where id = p_ticket_id;
  perform public.app_audit(ctx.agency_id, ctx.client_id, ctx.site_id, p_ticket_id, ctx.operator_id, ctx.operator_role, 'ticket_closed', coalesce(p_closure_note,'Closed'));
  return jsonb_build_object('ticket_id', p_ticket_id, 'status', 'closed');
end; $$;

-- Grants: end-user-callable by authenticated operators (RPCs self-authorize). Helpers stay internal.
revoke all on function public.app_operator_ticket_ctx(text) from public, anon, authenticated;
revoke all on function public.app_audit(uuid,uuid,uuid,text,uuid,text,public.audit_event_type,text) from public, anon, authenticated;
do $$ declare f text; begin
  foreach f in array array[
    'operator_triage_ticket(text,text)','operator_draft_reply(text,text)','operator_request_approval(text)',
    'operator_approve_reply(text,text)','operator_reject_reply(text,text)','operator_send_reply(text,text)','operator_close_ticket(text,text)'
  ] loop
    execute format('revoke all on function public.%s from public, anon;', f);
    execute format('grant execute on function public.%s to authenticated;', f);
  end loop;
end $$;
