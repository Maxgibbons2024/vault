import { SectionHeading, Card } from "@/components/ui";
import { MatchCard } from "@/components/match-card";
import { getTenant, tenantEventCards } from "@/lib/tenant";
import { SPORTS, type Sport } from "@/lib/types";

export async function SportSection({ sport }: { sport: Sport }) {
  const meta = SPORTS.find((s) => s.id === sport)!;
  const tenant = await getTenant();
  const rows = tenant ? await tenantEventCards(tenant, sport) : [];
  const inStrategy = tenant?.strategy.sports.includes(sport) ?? true;

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Upcoming"
        title={`${meta.icon}  ${meta.label}`}
        subtitle={`Upcoming ${meta.label.toLowerCase()} value picks for your strategy.`}
      />

      {!inStrategy ? (
        <Card className="p-10 text-center text-muted">
          {meta.label} isn&apos;t part of this channel&apos;s strategy.
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No qualifying {meta.label.toLowerCase()} picks right now. Check back soon.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ event, opportunities, premium }) => (
            <MatchCard
              key={event.id}
              event={event}
              opportunities={opportunities}
              premium={premium}
            />
          ))}
        </div>
      )}
    </div>
  );
}
