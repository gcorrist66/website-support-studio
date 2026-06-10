import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthProvider";
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
  return `${label}: ${examples.join(", ")}`;
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
          <p className="customer-kicker">website_support_studio launch account preview</p>
          <h1>what did they buy?</h1>
          <p className="customer-copy">
            This is the first screen Gary needs after refresh: profile, plan, credits, replenishment,
            support, feedback, and account switching.
          </p>
          <ul className="customer-section-strip" aria-label="launch account sections">
            <li>PROFILE</li>
            <li>PLAN</li>
            <li>CREDITS</li>
            <li>CAPACITY EDUCATION</li>
            <li>REPLENISHMENT</li>
            <li>SUPPORT</li>
            <li>FEEDBACK</li>
            <li>LOGOUT</li>
          </ul>
          <p className="customer-smallprint">
            Previewing customer account for <strong>{customerLabel}</strong>
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
          <h2>Profile / account</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Checkout email</dt>
              <dd>{checkoutEmail}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{company}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{website}</dd>
            </div>
            <div>
              <dt>Current site</dt>
              <dd>{siteLabel ?? "not linked yet"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>customer</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            If this is not the checkout email, sign out and use the same email you used at checkout.
          </p>
        </section>

        <section className="customer-card">
          <h2>Billing / plan</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Current plan</dt>
              <dd>{planName}</dd>
            </div>
            <div>
              <dt>Monthly price</dt>
              <dd>{formatMoney(monthlyUsd)}</dd>
            </div>
            <div>
              <dt>Subscription status</dt>
              <dd>{subscriptionStatus ? subscriptionStatus.replaceAll("_", " ") : "not available"}</dd>
            </div>
            <div>
              <dt>Renewal / trial</dt>
              <dd>{formatPlanNote({ subscriptionStatus, currentPeriodEnd })}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            {account?.billingMessage ??
              "Pricing is confirmed during checkout or support if a custom plan is needed."}
          </p>
        </section>

        <section className="customer-card">
          <h2>Credits / Capacity Units</h2>
          <p className="customer-copy">
            Capacity Units are the monthly support allowance included with your plan.
          </p>
          <p className="customer-smallprint">
            {capacity?.trackingNote ?? "Usage is being tracked manually during the pilot."}
          </p>
          <dl className="customer-definition-list">
            <div>
              <dt>Included this month</dt>
              <dd>{formatCapacity(capacity?.includedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>Used this month</dt>
              <dd>{formatCapacity(capacity?.usedThisMonth ?? null)}</dd>
            </div>
            <div>
              <dt>Remaining this month</dt>
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
            Usage is estimated/manual during the pilot. Low effort means fewer units, medium effort
            means more, and high effort means the most.
          </p>
        </section>

        <section className="customer-card">
          <h2>Replenishment</h2>
          <p className="customer-copy">
            {account?.replenishment.refresh ?? "Your Capacity Units refresh at the start of each billing period."}
          </p>
          <p className="customer-smallprint">
            Need more Capacity Units? Additional Capacity Units can be added at any time. Contact
            Corriston Consulting.
          </p>
          <p className="customer-smallprint">
            {account?.replenishment.note ??
              "Pricing is confirmed during checkout or support if the plan needs to be adjusted."}
          </p>
        </section>

        <section className="customer-card">
          <h2>Support request</h2>
          <p className="customer-copy">This means work on the customer website.</p>
          <ul className="customer-bullet-list">
            <li>
              <strong>Low effort:</strong> content updates and image swaps.
            </li>
            <li>
              <strong>Medium effort:</strong> plugin updates and landing page changes.
            </li>
            <li>
              <strong>High effort:</strong> bug fixes and more complex site work.
            </li>
          </ul>
          <p className="customer-smallprint">
            Support requests go to the customer work queue so the website gets updated.
          </p>
        </section>

        <section className="customer-card">
          <h2>Feedback / bug / feature request</h2>
          <p className="customer-copy">This means improving website_support_studio itself.</p>
          <ul className="customer-bullet-list">
            <li>
              <strong>Feedback:</strong> something that is confusing, helpful, or worth improving.
            </li>
            <li>
              <strong>Bug report:</strong> something broken or unexpected in the app.
            </li>
            <li>
              <strong>Feature request:</strong> a new capability or workflow for the product.
            </li>
          </ul>
          <p className="customer-smallprint">
            Use this for product ideas. Use support requests for website work.
          </p>
        </section>

        <section className="customer-card">
          <h2>Activity summary</h2>
          <dl className="customer-definition-list">
            <div>
              <dt>Support requests</dt>
              <dd>{formatCount(account?.supportRequestCount ?? null)}</dd>
            </div>
            <div>
              <dt>Product feedback</dt>
              <dd>{formatCount(account?.productFeedbackCount ?? null)}</dd>
            </div>
          </dl>
          <p className="customer-smallprint">
            Support requests are work on your website. Product feedback is about improving
            website_support_studio itself.
          </p>
        </section>

        <section className="customer-card">
          <h2>Logout / account switching</h2>
          <p className="customer-copy">
            If this is the wrong email, log out and sign back in with the checkout email. That
            switches you to the correct account.
          </p>
          <button className="auth-btn auth-btn-ghost" type="button" onClick={() => void signOut()}>
            sign out and switch accounts
          </button>
        </section>
      </div>
    </div>
  );
}
