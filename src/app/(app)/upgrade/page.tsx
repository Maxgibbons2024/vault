import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/store";
import { stripeEnabled } from "@/lib/stripe";
import { PLANS, planLabel } from "@/lib/plans";
import { SubscribeButton } from "@/components/subscribe-button";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { cn } from "@/lib/format";

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string; demo?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const sub = user ? await getSubscriptionForUser(user.id) : undefined;
  const currentPlan = sub?.plan ?? "free";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Subscription"
        title="Choose your plan"
        subtitle="Unlock premium AI analysis and unlimited value opportunities. Cancel anytime."
      />

      {sp.success && (
        <Card className="border-accent/40 bg-accent/10 p-4">
          <p className="text-sm text-accent-soft">
            🎉 You're now on the{" "}
            <span className="font-semibold capitalize">{sp.plan ?? "new"}</span>{" "}
            plan. Premium analysis is unlocked.
            {sp.demo && " (Demo mode — no payment was taken.)"}
          </p>
        </Card>
      )}
      {sp.canceled && (
        <Card className="border-warn/30 bg-warn/5 p-4">
          <p className="text-sm text-warn">Checkout canceled. No changes were made.</p>
        </Card>
      )}

      {!stripeEnabled && (
        <Card className="border-border bg-bg-soft/50 p-4">
          <p className="text-xs text-muted">
            <span className="font-semibold text-ink">Demo mode:</span> Stripe is not
            configured, so subscribing activates the plan instantly without a real
            charge. Set <code className="text-brand-soft">STRIPE_SECRET_KEY</code> and price IDs to enable live Checkout.
          </p>
        </Card>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col p-6",
                plan.highlighted && "border-brand/50 shadow-xl shadow-brand/10",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6">
                  <Badge tone="brand">Most popular</Badge>
                </span>
              )}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                {isCurrent && <Badge tone="accent">Active</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-ink">£{plan.price}</span>
                <span className="text-muted">/month</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
                    <span className="mt-0.5 text-accent-soft">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <SubscribeButton
                plan={plan.id}
                current={isCurrent}
                highlighted={plan.highlighted}
              />
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted">
        You're currently on the{" "}
        <span className="font-semibold text-ink">{planLabel[currentPlan]}</span>{" "}
        plan.
      </p>
    </div>
  );
}
