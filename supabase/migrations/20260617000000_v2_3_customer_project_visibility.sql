-- V2.3 — Customer-facing project visibility (read path).  *** DRAFT — NOT APPLIED ***
--
-- Builds on V2.0 (projects) + V2.2 (milestones/deliverables, tickets.project_id/request_kind), both
-- still unapplied on v2-foundation. Apply order: V2.0 → V2.2 → V2.3, on DEV ONLY, in a coordinated
-- window. The Supabase CLI is linked to PRODUCTION — do NOT `supabase db push`.
--
-- DESIGN DECISION (supersedes the V2.2 commented "direct customer SELECT" sketch):
--   The customer read path is a single column-whitelisting SECURITY DEFINER RPC, NOT direct RLS table
--   policies. Why: RLS filters ROWS, not COLUMNS, and customers + operators share the `authenticated`
--   role, so column GRANTs can't give operators every column while hiding intake_notes / stripe ids
--   from customers. A direct `projects` customer SELECT policy would therefore leak `intake_notes`,
--   `stripe_checkout_session_id`, `stripe_payment_intent_id`. The RPC returns ONLY safe columns, from
--   one audited path — the read-side mirror of submit_customer_request on the write side.
--   => `projects`, `project_milestones`, `project_deliverables` stay OPERATOR-ONLY at the table level.
--      Customer reads flow exclusively through get_my_projects(). No new customer table policy is added.
--
-- Exposes (safe): project identity, status, payment_status, target date, price; website_url, platform,
-- access_status + a derived needs_from_you (MVP); milestones (+progress, +next); READY deliverables only
-- (delivered/accepted — never operator WIP); linked request summaries.
-- Never exposes: intake_notes, stripe ids, project_audit_events, draft replies/approvals, other tenants.

create or replace function public.get_my_projects()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_result jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;

  select coalesce(jsonb_agg(sub.proj order by sub.proj_created desc), '[]'::jsonb)
  into v_result
  from (
    select
      p.created_at as proj_created,
      jsonb_build_object(
        'id', p.id,
        'project_number', p.project_number,
        'title', p.title,
        'summary', p.summary,
        'project_type', p.project_type,
        'status', p.status,                      -- raw enum; UI maps to customer-safe label (see plan §III)
        'payment_status', p.payment_status,      -- the customer's own money state (safe)
        'price_cents', p.price_cents,            -- what they bought (their own price)
        'currency', p.currency,
        'website_url', p.website_url,            -- MVP: their site (safe — they own it)
        'platform', p.platform,                  -- MVP: 'wordpress' | 'shopify' | 'wix' | 'other'
        'access_status', p.access_status,        -- MVP: guided website-access lifecycle state
        'target_delivery_date', p.target_delivery_date,
        'delivered_at', p.delivered_at,
        'closed_at', p.closed_at,
        'created_at', p.created_at,
        'action_needed', (p.status = 'waiting_on_customer'),
        'needs_from_you', (   -- MVP: derived, customer-safe asks (access + assets + waiting prompt)
          select coalesce(jsonb_agg(x.msg order by x.ord), '[]'::jsonb)
          from (
            select 1 as ord, case p.access_status
                when 'access_needed' then 'Grant website access so we can begin'
                when 'access_requested' then 'Grant website access (we''ve sent instructions)'
                when 'blocked' then 'Website access is blocked — please re-check the invite'
              end as msg
            where p.access_status in ('access_needed', 'access_requested', 'blocked')
            union all
            select 2, 'Send your content & assets'
            where exists (
              select 1 from public.project_milestones m
              where m.project_id = p.id and m.status not in ('done', 'skipped')
                and (m.title ilike '%content%' or m.title ilike '%assets%')
            )
            union all
            select 3, 'Respond to our latest question'
            where p.status = 'waiting_on_customer'
          ) x
          where x.msg is not null
        ),
        'next_milestone', (
          select jsonb_build_object('id', m.id, 'title', m.title, 'status', m.status, 'due_at', m.due_at)
          from public.project_milestones m
          where m.project_id = p.id and m.status not in ('done', 'skipped')
          order by m.sort_order, m.created_at
          limit 1
        ),
        'milestone_progress', (
          select jsonb_build_object(
            'done', count(*) filter (where m.status = 'done'),
            'total', count(*) filter (where m.status <> 'skipped')
          )
          from public.project_milestones m where m.project_id = p.id
        ),
        'milestones', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', m.id, 'title', m.title, 'description', m.description,
            'status', m.status, 'sort_order', m.sort_order,
            'due_at', m.due_at, 'completed_at', m.completed_at
          ) order by m.sort_order, m.created_at), '[]'::jsonb)
          from public.project_milestones m where m.project_id = p.id
        ),
        'deliverables', (   -- READY only: customers never see pending/WIP deliverables
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', d.id, 'title', d.title, 'kind', d.kind, 'url', d.url,
            'status', d.status, 'delivered_at', d.delivered_at, 'accepted_at', d.accepted_at
          ) order by d.delivered_at, d.created_at), '[]'::jsonb)
          from public.project_deliverables d
          where d.project_id = p.id and d.status in ('delivered', 'accepted')
        ),
        'requests', (   -- the customer's own linked tickets (summary fields only)
          select coalesce(jsonb_agg(jsonb_build_object(
            'ticket_number', t.ticket_number, 'title', t.title,
            'status', t.status, 'request_kind', t.request_kind, 'created_at', t.created_at
          ) order by t.created_at desc), '[]'::jsonb)
          from public.tickets t where t.project_id = p.id and t.client_id = p.client_id
        )
      ) as proj
    from public.projects p
    join public.org_members om on om.org_id = p.client_id
    where om.auth_user_id = v_uid and om.status = 'active'
  ) sub;

  return v_result;
end;
$$;

-- anon gets nothing; the function self-authorizes via org_members (active membership in the project's org).
revoke all on function public.get_my_projects() from public, anon;
grant execute on function public.get_my_projects() to authenticated;

-- ============================================================================
-- END V2.3 DRAFT. NOT APPLIED. Customer reads go ONLY through get_my_projects(); the project tables
-- remain operator-only. No customer table SELECT policy is added (column-safety, see header). Verify
-- on dev: a member sees only their org's projects with safe columns; a non-member / anon gets nothing;
-- intake_notes + stripe ids never appear in the payload.
-- ============================================================================
