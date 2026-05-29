import { Badge, ButtonLink, Card, ConfidenceMeter } from "./ui";
import { formatDate, relativeDay } from "@/lib/format";
import type { Event } from "@/lib/types";

export function MatchCard({
  event,
  opportunities = 0,
  premium = false,
}: {
  event: Event;
  opportunities?: number;
  premium?: boolean;
}) {
  return (
    <Card className="group flex flex-col gap-4 p-5 transition hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-brand-soft">
            {event.competition}
          </p>
          <p className="mt-0.5 text-xs text-faint">
            {relativeDay(event.startsAt)} · {formatDate(event.startsAt)}
          </p>
        </div>
        {premium ? (
          <Badge tone="accent">Premium</Badge>
        ) : (
          <Badge tone="neutral">Free</Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 text-right">
          <p className="font-semibold text-ink">{event.homeName}</p>
        </div>
        <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-faint">
          vs
        </span>
        <div className="flex-1">
          <p className="font-semibold text-ink">{event.awayName}</p>
        </div>
      </div>

      <ConfidenceMeter value={event.marketConfidence} />

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="text-xs text-muted">
          {opportunities > 0 ? (
            <span className="text-accent-soft">
              {opportunities} value{" "}
              {opportunities === 1 ? "opportunity" : "opportunities"}
            </span>
          ) : (
            "Analysis available"
          )}
        </span>
        <ButtonLink href={`/analysis/${event.id}`} variant="outline" size="sm">
          View Analysis
        </ButtonLink>
      </div>
    </Card>
  );
}
