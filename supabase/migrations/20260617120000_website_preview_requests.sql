-- Free website preview requests from the public marketing landing page.
-- These rows are the durable, structured source of truth for operators and AI agents.

do $$
begin
  create type public.website_preview_request_status as enum (
    'new_preview_request',
    'reviewed',
    'preview_in_progress',
    'preview_sent',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.website_preview_requests (
  id uuid primary key default gen_random_uuid(),
  status public.website_preview_request_status not null default 'new_preview_request',
  submitted_at timestamptz not null default timezone('utc', now()),
  page_source text not null default 'free_website_preview_landing_page',
  source_url text,
  referrer text,
  user_agent text,
  name text not null,
  email text not null,
  phone text,
  business_name text not null,
  current_website_url text,
  normalized_domain text,
  industry text,
  business_description text not null,
  pages_needed text[] not null default '{}',
  preferred_style text,
  inspiration_websites text,
  primary_goal text not null,
  services_to_highlight text,
  target_customers text,
  logo_brand_colors_available boolean,
  additional_notes text,
  submission jsonb not null,
  notification_status text not null default 'pending',
  notification_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint website_preview_requests_email_has_at check (position('@' in email) > 1),
  constraint website_preview_requests_submission_object check (jsonb_typeof(submission) = 'object')
);

alter table public.website_preview_requests
  add column if not exists normalized_domain text;

create index if not exists website_preview_requests_status_submitted_at_idx
  on public.website_preview_requests (status, submitted_at desc);

create unique index if not exists website_preview_requests_active_domain_unique_idx
  on public.website_preview_requests (normalized_domain)
  where normalized_domain is not null and status <> 'closed';

create index if not exists website_preview_requests_normalized_domain_idx
  on public.website_preview_requests (normalized_domain)
  where normalized_domain is not null;

create index if not exists website_preview_requests_submission_gin_idx
  on public.website_preview_requests using gin (submission);

drop trigger if exists website_preview_requests_timestamps_before_update on public.website_preview_requests;
create trigger website_preview_requests_timestamps_before_update
before update on public.website_preview_requests
for each row
execute function public.touch_updated_at();

alter table public.website_preview_requests enable row level security;

revoke all on public.website_preview_requests from anon, authenticated;

comment on table public.website_preview_requests is
  'Structured free website preview requests from /free-website-preview. AI agents should read this table using the server-side Supabase service role or an approved operator workflow.';

comment on column public.website_preview_requests.submission is
  'Full normalized request payload, including timestamp, page source, contact fields, goals, style preferences, and status.';

comment on column public.website_preview_requests.normalized_domain is
  'Lowercase hostname from the submitted current website URL with leading www removed. Used to prevent duplicate active preview requests for the same website/domain.';
