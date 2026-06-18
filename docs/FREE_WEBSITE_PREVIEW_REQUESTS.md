# Free Website Preview Requests

The public landing page at `/free-website-preview` submits questionnaire answers to the Supabase Edge Function `website-preview-request`.

## Storage

Durable records live in:

```sql
public.website_preview_requests
```

Each row includes:

- `id`
- `status`
- `submitted_at`
- `page_source`
- `source_url`
- `referrer`
- `user_agent`
- `normalized_domain`
- contact fields
- business fields
- `pages_needed`
- `primary_goal`
- `notification_status`
- `notification_error`
- `submission` as a labeled JSON object

Status values:

- `new_preview_request`
- `reviewed`
- `preview_in_progress`
- `preview_sent`
- `closed`

Duplicate prevention:

- `normalized_domain` is derived from `current_website_url`.
- Leading `www.` is removed.
- Only one non-closed request can exist for a `normalized_domain`.
- `closed` requests are excluded from the active duplicate rule.

## Agent Read Path

AI agents should read requests through an approved operator workflow or with the server-side Supabase service role. Browser clients do not insert directly into the table, and public anonymous access is not granted.

Useful query:

```sql
select
  id,
  status,
  submitted_at,
  normalized_domain,
  business_name,
  email,
  primary_goal,
  submission
from public.website_preview_requests
where status = 'new_preview_request'
order by submitted_at asc;
```

## Email Notification

The Edge Function sends Gary an internal notification using the `wss-internal-free-preview-request` email alias. The database insert happens before the email attempt, so the request remains available even if email delivery fails.

## Required Environment Variables

Marketing site:

```text
PUBLIC_WSS_WEBSITE_PREVIEW_REQUEST_URL=https://<project-ref>.supabase.co/functions/v1/website-preview-request
```

Supabase Edge Function:

```text
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server-side-service-role-key>
RESEND_API_KEY=<resend-api-key>
WSS_INTERNAL_NOTIFICATION_TO=corristonconsulting@gmail.com
WSS_EMAIL_FROM=Website Support Studio <notifications@websitesupportstudio.com>
WSS_EMAIL_REPLY_TO=corristonconsulting@gmail.com
ALLOWED_ORIGINS=https://websitesupportstudio.com,https://www.websitesupportstudio.com,http://localhost:4321
```
