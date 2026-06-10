import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthProvider";
import { MonoLabel } from "../brand/MonoLabel";
import { LogoLockup } from "../brand/LogoLockup";
import { loadCustomerAccount, type CustomerAccount } from "../../data/customerAccount";
import {
  loadCustomerWorkspaceSummary,
  type CustomerWorkspaceSummary,
} from "../../data/customerWorkspace";

type LaunchAccountPreviewProps = {
  orgId: string;
  customerLabel: string;
  siteLabel?: string | null;
};

function formatMoney(monthlyUsd: number | null): string {
  if (monthlyUsd === null) {
    return "custom pricing";
  }
  return `$${monthlyUsd.toLocaleString("en-US")} / month`;
}

function formatCount(value: number | null): string {
  return value === null ? "not available" : `${value}`;
}

function formatCapacity(value: number | null): string {
  return value === null ? "not tracked yet" : `${value}`;
}

function formatPlanNote(account: Pick<CustomerAccount, "subscriptionStatus" | "currentPeriodEnd">): string {
  if (!account.subscriptionStatus) {
    return "plan details are still loading.";
  }
  if (account.subscriptionStatus === "trialing") {
    return account.currentPeriodEnd ? `trial ends on ${new Date(account.currentPeriodEnd).toLocaleDateString("en-US")}.` : "trialing right now.";
  }
  if (account.subscriptionStatus === "active") {
    return account.currentPeriodEnd ? `renews on ${new Date(account.currentPeriodEnd).toLocaleDateString("en-US")}.` : "active subscription.";
  }
  if (account.subscriptionStatus === "past_due") {
    return "payment is past due. contact Corriston Consulting.";
  }
  if (account.subscriptionStatus === "canceled") {
    return "subscription is canceled.";
  }
  return `status: ${account.subscriptionStatus.replaceAll("_", " ")}.`;
}

function formatEffortExamples(label: string, examples: string[]): string {
  return `${label.toLowerCase()}: ${examples.join(", ")}`;
}

export function LaunchAccountPreview({ orgId, customerLabel, siteLabel }: LaunchAccountPreviewProps) {
  const { signOut } = useAuth();
  const [workspace, setWorkspace] = useState<CustomerWorkspaceSummary | null>(null);
  const [account, setAccount] = useState<CustomerAccount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    async function load() {
      const [workspaceSummary, customerAccount] = await Promise.all([
        loadCustomerWorkspaceSummary(orgId),
        loadCustomerAccount(orgId),
      ]);
      if (!active) {
        return;
      }
      setWorkspace(workspaceSummary);
      setAccount(customerAccount);
      setLoading(false);
    }

    load().catch(() => {
      if (!active) {
        return;
      }
      setWorkspace(null);
      setAccount(null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [orgId]);

  const checkoutEmail = workspace?.primaryContactEmail ?? account?.customerEmail ?? "not available";
  const company = workspace?.orgName ?? account?.company ?? customerLabel;
  const website = account?.website ?? siteLabel ?? "not linked yet";
  const planName = account?.planName ?? workspace?.planName ?? "Plan not found";
  const monthlyUsd = account?.monthlyUsd ?? workspace?.monthlyUsd ?? null;
  const subscriptionStatus = account?.subscriptionStatus ?? workspace?.subscriptionStatus ?? null;
  const currentPeriodEnd = account?.currentPeriodEnd ?? workspace?.currentPeriodEnd ?? null;
  const capacity = account?.capacity ?? null;
  const effortLevels = useMemo(() => account?.effortLevels ?? [], [account]);

  return (
    <div className="customer-shell">
      <section className="customer-hero">
        <div>
          <LogoLockup size={30} />
          <p className="customer-kicker">
            <MonoLabel text="website support studio launch account preview" />
          </p>
          <h1>
            <MonoLabel text="launch account preview" />
          </h1>
          <p className="customer-copy">
            this is the first screen gary needs after refresh: profile, plan, credits, replenishment,
            support, feedback, and account switching.
          </p>
          <ul className="customer-section-strip" aria-label="launch account sections">
            <li>profile_account</li>
            <li>billing_plan</li>
            <li>credits_capacity</li>
            <li>capacity_education</li>
            <li>replenishment</li>
            <li>support_request</li>
            <li>feedback_bug_feature_request</li>
            <li>logout</li>
          </ul>
          <p className="customer-smallprint">
            previewing customer account for <strong>{customerLabel}</strong>
            {siteLabel ? ` · site: ${siteLabel}` : ""}
          </p>
          {loading ? (
            <p className="customer-smallprint" role="status">
              loading account details…
            </p>
          ) : null}
        </div>
        <button
          className="auth-btn auth-btn-ghost customer-logout"
          type="button"
          onClick={() => {
            void signOut();
          }}
        >
          log out / switch account
        </button>
      </section>

      <div className="customer-grid">
        <section className="customer-card">
          <h2>
            <MonoLabel text="profile account" />
          </h2>
          <dl className="customer-definition-list">
            <div>
              <dt>checkout_email</dt>
              <dd>{checkoutEmail}</dd>
            </div>
            <div>
              <dt>company</dt>
              <dd>{company}</dd>
            </div>
            <div>
              <dt>website</dt>
              <dd>{website}</dd>
            </div>
            <div>
              <dt>current_site</dt>
              <dd>{siteLabel ?? "not linked yet"}</dd>
            </div>
            <div>
              <dt>role</dt>
              <dd>customer</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            if this is not the checkout email, sign out and use the same email you used at checkout.
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="billing plan" />
          </h2>
          <dl className="customer-definition-list">
            <div>
              <dt>current_plan</dt>
              <dd>{planName}</dd>
            </div>
            <div>
              <dt>monthly_price</dt>
              <dd>{formatMoney(monthlyUsd)}</dd>
            </div>
            <div>
              <dt>subscription_status</dt>
              <dd>{subscriptionStatus ? subscriptionStatus.replaceAll("_", " ") : "not available"}</dd>
            </div>
            <div>
              <dt>renewal_trial</dt>
              <dd>{formatPlanNote({ subscriptionStatus, currentPeriodEnd })}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            {account?.billingMessage ??
              "Pricing is confirmed during checkout or support if a custom plan is needed."}
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="credits capacity" />
          </h2>
          <p className="customer-copy">
            capacity_units are the monthly support allowance included with your plan. monthly
            capacity_units refresh each month and do not roll over.
          </p>
          <p className="customer-smallprint">
            {capacity?.trackingNote ?? "usage is being tracked manually during the pilot."}
          </p>
          <dl className="customer-definition-list">
            <div>
              <dt>included_this_month</dt>
              <dd>{formatCapacity(capacity?.includedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>used_this_month</dt>
              <dd>{formatCapacity(capacity?.usedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>remaining_this_month</dt>
              <dd>{formatCapacity(capacity?.remainingThisMonth ?? null)}</dd>
            </div>
          </dl>
          <ul className="customer-bullet-list">
            {effortLevels.map((level) => (
              <li key={level.key}>
                <strong>{level.name}:</strong> {level.summary}{" "}
                {formatEffortExamples("Examples", level.examples)}
              </li>
            ))}
          </ul>
          <p className="customer-smallprint">
            usage is estimated/manual during the pilot. low effort means fewer units, medium effort
            means more, and high effort means the most.
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="replenishment" />
          </h2>
          <p className="customer-copy">
            {account?.replenishment.refresh ??
              "monthly capacity_units refresh at the start of each billing period and do not roll over."}
          </p>
          <p className="customer-smallprint">
            need more capacity_units? purchased top-ups stay on the account until used, roll over,
            and are used after monthly capacity_units run out.
          </p>
          <p className="customer-smallprint">
            {account?.replenishment.note ??
              "Pricing is confirmed during checkout or support if the plan needs to be adjusted."}
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="support request" />
          </h2>
          <p className="customer-copy">this means work on the customer website.</p>
          <ul className="customer-bullet-list">
            <li>
              <strong>low effort:</strong> content updates and image swaps.
            </li>
            <li>
              <strong>medium effort:</strong> plugin updates and landing page changes.
            </li>
            <li>
              <strong>high effort:</strong> bug fixes and more complex site work.
            </li>
          </ul>
          <p className="customer-smallprint">
            support requests go to the customer work queue so the website gets updated.
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="feedback bug feature request" />
          </h2>
          <p className="customer-copy">this means improving website_support_studio itself.</p>
          <ul className="customer-bullet-list">
            <li>
              <strong>feedback:</strong> something that is confusing, helpful, or worth improving.
            </li>
            <li>
              <strong>bug report:</strong> something broken or unexpected in the app.
            </li>
            <li>
              <strong>feature request:</strong> a new capability or workflow for the product.
            </li>
          </ul>
          <p className="customer-smallprint">
            use this for product ideas. use support requests for website work.
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="activity summary" />
          </h2>
          <dl className="customer-definition-list">
            <div>
              <dt>support_requests</dt>
              <dd>{formatCount(account?.supportRequestCount ?? null)}</dd>
            </div>
            <div>
              <dt>product_feedback</dt>
              <dd>{formatCount(account?.productFeedbackCount ?? null)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            support requests are work on your website. product feedback is about improving
            website_support_studio itself.
          </p>
        </section>

        <section className="customer-card">
          <h2>
            <MonoLabel text="logout account switching" />
          </h2>
          <p className="customer-copy">
            if this is the wrong email, log out and sign back in with the checkout email. that
            switches you to the correct account.
          </p>
          <button className="auth-btn auth-btn-ghost" type="button" onClick={() => void signOut()}>
            sign_out_switch_accounts
          </button>
        </section>
      </div>
    </div>
  );
}
