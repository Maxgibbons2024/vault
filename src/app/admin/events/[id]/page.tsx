import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAnalysisForEvent,
  getEvent,
  listOpportunitiesForEvent,
} from "@/lib/store";
import { SPORTS } from "@/lib/types";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  deleteAnalysisAction,
  togglePublishAction,
  updateAnalysisAction,
} from "../../actions";

export default async function AdminEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const [analysis, opps] = await Promise.all([
    getAnalysisForEvent(id),
    listOpportunitiesForEvent(id),
  ]);
  const sport = SPORTS.find((s) => s.id === event.sport);

  return (
    <div className="space-y-8">
      <Link href="/admin/events" className="text-sm text-muted hover:text-ink">
        ← Back to events
      </Link>

      <SectionHeading
        eyebrow={`${sport?.icon} ${sport?.label}`}
        title={`${event.homeName} vs ${event.awayName}`}
        subtitle={`${event.competition} · ${formatDate(event.startsAt)}`}
      />

      {analysis ? (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-ink">Analysis</h3>
            <Badge tone={analysis.published ? "accent" : "warn"}>
              {analysis.published ? "Published" : "Draft"}
            </Badge>
          </div>

          <form action={updateAnalysisAction} className="mt-4 space-y-4">
            <input type="hidden" name="eventId" value={event.id} />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-muted">Summary</span>
              <textarea
                name="summary"
                rows={4}
                defaultValue={analysis.summary}
                className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-ink outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="premium" defaultChecked={analysis.premium} className="accent-[#0ea5e9]" />
              Premium (locked behind subscription)
            </label>
            <Button type="submit">Save analysis</Button>
          </form>

          <div className="mt-6">
            <p className="text-sm font-medium text-muted">Sections ({analysis.sections.length})</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {analysis.sections.map((s) => (
                <div key={s.heading} className="rounded-lg border border-border bg-bg-soft/40 px-3 py-2 text-xs">
                  <p className="font-semibold text-ink">{s.heading}</p>
                  <p className="mt-0.5 line-clamp-2 text-faint">{s.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
            <form action={togglePublishAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <Button variant="outline" size="sm">
                {analysis.published ? "Unpublish" : "Publish"}
              </Button>
            </form>
            <form action={deleteAnalysisAction}>
              <input type="hidden" name="analysisId" value={analysis.id} />
              <Button variant="outline" size="sm" className="hover:border-danger/50 hover:text-danger">
                Delete analysis
              </Button>
            </form>
            <Link
              href={`/analysis/${event.id}`}
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-brand-soft hover:underline"
            >
              Preview public page ↗
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-muted">No analysis attached to this event.</Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-ink">Value opportunities ({opps.length})</h3>
        {opps.length === 0 ? (
          <p className="mt-2 text-sm text-muted">None recorded for this event.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border/60">
            {opps.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <span className="text-ink">{o.market}</span>
                <span className="font-mono text-muted">
                  {o.bookmakerOdds.toFixed(2)} vs {o.fairOdds.toFixed(2)} · +{o.edgePct}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
