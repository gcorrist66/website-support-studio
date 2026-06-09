# Customer #2 Pilot Runbook

This is the step-by-step handoff for Gary to onboard the next customer without pulling DOGE back into the process.

## Goal

Capture enough evidence to prove that the Stripe checkout, WSS provisioning, login claim, onboarding, and request flows are all working for the next customer.

## What email to use

- Use the customer buyer email only.
- Do **not** use an operator/admin email for customer onboarding.
- Use the same email for checkout and first login.

## Step-by-step

### 1) Before checkout

- Confirm the customer name, company name, and website URL.
- Confirm the plan the customer is buying.
- Confirm the buyer email.
- Confirm that the buyer email is not an operator/admin email.
- Create a dated notes file for the pilot.

### 2) During checkout

- Start Stripe Checkout with the buyer email.
- Save the checkout success URL or redirect URL.
- Save the Stripe customer ID.
- Save the Stripe subscription ID.
- Save a screenshot of the successful checkout result.

### 3) After checkout, before login

- Verify the WSS database state.
- Confirm that the Stripe subscription ID exists in `public.subscriptions`.
- Confirm `owner_claimed = false`.
- Confirm the org exists.
- Confirm the onboarding status is still pending or onboarding required.
- If Stripe and WSS do not match, stop here and report the exact IDs.

### 4) First login

- Log in using the same buyer email used for checkout.
- Confirm that the account resolves to the correct customer workspace.
- Confirm that the pending org is claimed.
- Confirm `owner_claimed = true` after login.
- Confirm that an active `org_owner` row exists in `org_members`.

### 5) Onboarding

- Enter the company name if prompted.
- Enter the website URL if prompted.
- Complete the onboarding form.
- Confirm that a site row is created.
- Confirm that the site belongs to the same org as the subscription.
- Confirm that onboarding status becomes complete when done.

### 6) Customer workspace check

- Confirm the customer can see their email.
- Confirm the customer can see the role.
- Confirm the customer can see the plan.
- Confirm the customer can see Capacity Units.
- Confirm the customer can submit a website support request.
- Confirm the customer can submit product feedback.
- Confirm the customer can log out.

### 7) Evidence to capture

Save these items in the pilot folder:

- Checkout success screenshot.
- Stripe customer ID.
- Stripe subscription ID.
- WSS subscription row screenshot or SQL output.
- `owner_claimed` before and after login.
- `org_members` row showing the owner membership.
- `sites` row showing the onboarded site.
- Customer workspace screenshot.
- Support request submission screenshot.
- Product feedback submission screenshot.

### 8) What values to send back

Send Gary these exact values:

- buyer email
- Stripe customer ID
- Stripe subscription ID
- WSS org ID
- WSS subscription status
- `owner_claimed` before login
- `owner_claimed` after login
- org member row status
- site row ID and name
- any mismatch or failure message

### 9) Where to stop if something fails

Stop immediately if any of these happen:

- The buyer email is wrong.
- The login email does not match the checkout email.
- The Stripe subscription ID cannot be found in WSS.
- `owner_claimed` does not change to true.
- No org owner membership is created.
- No site is created when a valid website URL was provided.
- Stripe says one status and WSS says another for the same subscription ID.

## Manual SQL quick check

If the operator needs a fast manual check, run:

```sql
select
  s.id,
  s.org_id,
  s.plan,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.buyer_email,
  s.owner_claimed
from public.subscriptions s
where s.stripe_subscription_id = '<stripe_subscription_id>';

select *
from public.org_members
where org_id = '<org_id>'
order by created_at asc;

select *
from public.sites
where client_id = '<org_id>'
order by created_at asc;
```

