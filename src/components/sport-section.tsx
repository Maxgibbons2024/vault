import { SectionHeading, Card } from "@/components/ui";
import { MatchCard } from "@/components/match-card";
import { listEventsWithMeta } from "@/lib/store";
import { SPORTS, type Sport } from "@/lib/types";

export async function SportSection({ sport }: { sport: Sport }) {
  const meta = SPORTS.find((s) => s.id === sport)!;
  const rows = await listEventsWithMeta(sport);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Upcoming"
        title={`${meta.icon}  ${meta.label}`}
        subtitle={`Upcoming ${meta.label.toLowerCase()} events with AI analysis and value opportunities.`}
      />

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No upcoming {meta.label.toLowerCase()} events scheduled. Check back soon.
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
