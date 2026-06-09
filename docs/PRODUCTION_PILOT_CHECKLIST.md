# Production Pilot Checklist

Use this checklist for every new WSS customer pilot until the onboarding flow is fully automated and proven.

## 1) Pre-checkout checklist

- [ ] Buyer email is a real customer email and is **not** an operator/admin email.
- [ ] The checkout email will be the same email used for first login.
- [ ] Customer name, company name, and site URL are confirmed.
- [ ] The intended plan is confirmed.
- [ ] The customer understands that plan and status are mirrored from Stripe into WSS after checkout.
- [ ] The customer understands support requests and product feedback are different.

## 2) Checkout checklist

- [ ] Checkout completed successfully.
- [ ] Stripe success page / redirect URL was captured.
- [ ] Stripe customer ID was captured.
- [ ] Stripe subscription ID was captured.
- [ ] Stripe receipt or checkout confirmation was saved.
- [ ] The exact buyer email used in checkout was recorded.

## 3) Stripe evidence checklist

- [ ] Stripe payment intent or checkout session shows `paid` / successful completion.
- [ ] Stripe customer record exists for the buyer email.
- [ ] Stripe subscription exists and is active or trialing as expected.
- [ ] Exact Stripe subscription ID is written into the pilot notes.
- [ ] Any plan, trial, or cancellation status is captured exactly as shown in Stripe.

## 4) WSS database verification checklist

Verify the WSS records before the buyer logs in.

- [ ] `subscriptions` row exists for the Stripe subscription ID.
- [ ] `subscriptions.stripe_customer_id` is present.
- [ ] `subscriptions.stripe_subscription_id` is present.
- [ ] `subscriptions.buyer_email` matches the checkout email.
- [ ] `subscriptions.status` matches the intended Stripe state.
- [ ] `subscriptions.owner_claimed = false` before first login.
- [ ] `org_profiles.onboarding_status = onboarding_required` before first login.
- [ ] The org exists in `clients`.
- [ ] The org subscription row maps to the same org ID.

Suggested SQL:

```sql
select
  s.id,
  s.org_id,
  s.plan,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.buyer_email,
  s.owner_claimed,
  s.current_period_start,
  s.current_period_end
from public.subscriptions s
where s.stripe_subscription_id = '<stripe_subscription_id>';

select *
from public.org_profiles
where org_id = '<org_id>';

select *
from public.clients
where id = '<org_id>';
```

## 5) Login / onboarding checklist

- [ ] Buyer logs in with the same email used at checkout.
- [ ] Buyer does not log in with an operator/admin email.
- [ ] `claim_my_paid_org()` resolves the pending org on first login.
- [ ] `owner_claimed` changes from `false` to `true` after login.
- [ ] `org_members` contains an active `org_owner` row for the buyer.
- [ ] `complete_paid_onboarding()` creates the first site when a valid URL exists.
- [ ] The created site belongs to the buyer org.
- [ ] `org_profiles.onboarding_status` becomes `complete` when onboarding is finished.

Suggested SQL:

```sql
select *
from public.org_members
where org_id = '<org_id>'
order by created_at asc;

select *
from public.sites
where client_id = '<org_id>'
order by created_at asc;
```

## 6) Request submission checklist

- [ ] Website support request submits successfully.
- [ ] Support request lands in the internal WSS queue.
- [ ] Request ID and status are captured.
- [ ] The request is associated with the correct site.

## 7) Product feedback checklist

- [ ] Product feedback form is visible to the customer.
- [ ] Customer can submit feedback, feature request, bug report, or other.
- [ ] Submission lands in the internal Corriston Consulting / WSS follow-up queue.
- [ ] Request ID and status are captured.
- [ ] The site association is correct.

## 8) Operator verification checklist

- [ ] Operator can inspect the buyer email, Stripe subscription ID, and WSS org ID quickly.
- [ ] Operator can confirm whether `owner_claimed` is still false or already true.
- [ ] Operator can confirm whether the org member row exists.
- [ ] Operator can confirm whether the site row exists.
- [ ] Operator can confirm whether Stripe and WSS status match for the exact subscription ID.
- [ ] Any mismatch is investigated before the customer is told onboarding is complete.

## 9) Tenant isolation checklist

- [ ] The buyer can only see their own org.
- [ ] The buyer can only see their own site rows.
- [ ] No operator/admin email was used to create the customer org.
- [ ] The site created during onboarding belongs to the same org as the subscription.
- [ ] Any shared/internal data is not exposed in the customer workspace.

## 10) Cleanup checklist

- [ ] Pilot evidence is saved in a dated folder.
- [ ] Stripe screenshots are archived.
- [ ] WSS SQL verification output is archived.
- [ ] Login/onboarding screenshots are archived.
- [ ] Request submission screenshots are archived.
- [ ] Any mismatch, cancellation, or failed claim is noted with exact IDs.
- [ ] The pilot notes include the exact stop point if anything failed.

## 11) Known pilot control points

- `subscriptions.stripe_customer_id`
- `subscriptions.stripe_subscription_id`
- `subscriptions.buyer_email`
- `subscriptions.owner_claimed`
- `org_members`
- `sites`
- `claim_my_paid_org()`
- `complete_paid_onboarding()`
- `provision_paid_customer()`
- `update_subscription_status()`

## 12) Stop conditions

Stop the pilot and investigate if any of these happen:

- The checkout email does not match the login email.
- An operator/admin email was used for customer onboarding.
- The Stripe subscription ID cannot be found in WSS.
- `owner_claimed` stays `false` after the first successful login.
- No `org_members` owner row exists after onboarding.
- No `sites` row exists after onboarding when a valid site URL was provided.
- Stripe says `active` but WSS says `canceled`, or the reverse, for the same subscription ID.

