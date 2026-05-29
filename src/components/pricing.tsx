import { Badge, ButtonLink, Card } from "./ui";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/format";

export function PricingCards({
  ctaHref = "/signup",
  ctaLabel = "Start Free Trial",
}: {
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {PLANS.map((plan) => (
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
          <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
          <p className="mt-1 text-sm text-muted">{plan.blurb}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-ink">
              £{plan.price}
            </span>
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
          <ButtonLink
            href={ctaHref === "/signup" ? ctaHref : `${ctaHref}?plan=${plan.id}`}
            variant={plan.highlighted ? "primary" : "outline"}
            size="lg"
            className="mt-6 w-full"
          >
            {ctaLabel}
          </ButtonLink>
        </Card>
      ))}
    </div>
  );
}
