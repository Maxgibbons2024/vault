import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/store";
import { planLabel, planPrice } from "@/lib/plans";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const sub = await getSubscriptionForUser(user.id);
  const plan = sub?.plan ?? "free";
  const isPaid = plan !== "free";

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Settings"
        title="My Account"
        subtitle="Manage your profile and subscription."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold text-ink">Profile</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Name" value={user.name} />
            <Row label="Email" value={user.email} />
            <Row label="Role" value={<span className="capitalize">{user.role}</span>} />
            <Row label="Member since" value={formatDate(user.createdAt, false)} />
          </dl>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Subscription</h3>
            <Badge tone={isPaid ? "accent" : "neutral"} className="capitalize">
              {sub?.status ?? "active"}
            </Badge>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink">{planLabel[plan]}</span>
            <span className="text-muted">
              {isPaid ? `· £${planPrice[plan]}/mo` : "· Free plan"}
            </span>
          </div>
          {sub && (
            <p className="mt-2 text-sm text-muted">
              {isPaid ? "Renews" : "Trial ends"} {formatDate(sub.currentPeriodEnd, false)}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {isPaid ? (
              <ButtonLink href="/upgrade" variant="outline" size="sm">
                Change plan
              </ButtonLink>
            ) : (
              <ButtonLink href="/upgrade" size="sm">
                Upgrade plan
              </ButtonLink>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold text-ink">Notifications</h3>
        <p className="mt-1 text-sm text-muted">
          Email and Telegram alerts for new value opportunities are coming soon.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Badge tone="neutral">📧 Email alerts — coming soon</Badge>
          <Badge tone="neutral">✈️ Telegram alerts — coming soon</Badge>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-3 last:border-0 last:pb-0">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </div>
  );
}
