import Link from "next/link";
import { listEventsWithMeta } from "@/lib/store";
import { SPORTS } from "@/lib/types";
import { Badge, Button, Card, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  createEventAction,
  deleteEventAction,
  togglePublishAction,
} from "../actions";

export default async function AdminEventsPage() {
  const rows = await listEventsWithMeta();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Content"
        title="Events & Analysis"
        subtitle="Create new events, publish analysis and manage existing content."
      />

      {/* Create event */}
      <Card className="p-6">
        <h3 className="font-semibold text-ink">Create event</h3>
        <form action={createEventAction} className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Sport">
            <select name="sport" className={inputCls} defaultValue="football">
              {SPORTS.map((s) => (
                <option key={s.id} value={s.id} className="bg-card">
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Competition">
            <input name="competition" required placeholder="Premier League" className={inputCls} />
          </Field>
          <Field label="Home / Player A">
            <input name="homeName" required placeholder="Arsenal" className={inputCls} />
          </Field>
          <Field label="Away / Player B">
            <input name="awayName" required placeholder="Chelsea" className={inputCls} />
          </Field>
          <Field label="Starts at">
            <input name="startsAt" type="datetime-local" required className={inputCls} />
          </Field>
          <Field label="Venue (optional)">
            <input name="venue" placeholder="Emirates Stadium" className={inputCls} />
          </Field>
          <Field label="Market confidence (0–100)">
            <input name="marketConfidence" type="number" min={0} max={100} defaultValue={60} className={inputCls} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Create event + draft analysis</Button>
          </div>
        </form>
      </Card>

      {/* Existing events */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Sport</th>
                <th className="px-4 py-3 font-medium">Starts</th>
                <th className="px-4 py-3 text-center font-medium">Opps</th>
                <th className="px-4 py-3 text-center font-medium">Analysis</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ event: e, opportunities: opps, analysis }) => {
                const sport = SPORTS.find((s) => s.id === e.sport);
                return (
                  <tr key={e.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/admin/events/${e.id}`} className="font-medium text-ink hover:text-brand-soft">
                        {e.homeName} vs {e.awayName}
                      </Link>
                      <p className="text-xs text-faint">{e.competition}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{sport?.icon} {sport?.label}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(e.startsAt)}</td>
                    <td className="px-4 py-3 text-center text-muted">{opps}</td>
                    <td className="px-4 py-3 text-center">
                      {analysis ? (
                        <Badge tone={analysis.published ? "accent" : "warn"}>
                          {analysis.published ? "Published" : "Draft"}
                        </Badge>
                      ) : (
                        <Badge tone="neutral">None</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {analysis && (
                          <form action={togglePublishAction}>
                            <input type="hidden" name="eventId" value={e.id} />
                            <button className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:border-brand/50 hover:text-ink">
                              {analysis.published ? "Unpublish" : "Publish"}
                            </button>
                          </form>
                        )}
                        <Link
                          href={`/admin/events/${e.id}`}
                          className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:border-brand/50 hover:text-ink"
                        >
                          Edit
                        </Link>
                        <form action={deleteEventAction}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <button className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:border-danger/50 hover:text-danger">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-ink placeholder:text-faint outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
