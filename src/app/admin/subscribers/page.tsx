import {
  listSubscriptions,
  listUsers,
  revenueStats,
} from "@/lib/store";
import { planLabel, planPrice } from "@/lib/plans";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { setPlanAction } from "../actions";
import type { PlanId } from "@/lib/types";

const PLAN_OPTIONS: PlanId[] = ["free", "starter", "pro"];

export default async function AdminSubscribersPage() {
  const [users, rev, subs] = await Promise.all([
    listUsers(),
    revenueStats(),
    listSubscriptions(),
  ]);
  const subByUser = new Map(subs.map((s) => [s.userId, s]));

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Customers"
        title="Subscribers"
        subtitle="Manage user plans and view revenue contribution."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="MRR" value={`£${rev.mrr.toLocaleString()}`} tone="accent" />
        <StatCard label="Paying" value={rev.paying} tone="brand" />
        <StatCard label="Total Users" value={rev.totalUsers} tone="neutral" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 text-right font-medium">MRR</th>
                <th className="px-4 py-3 text-right font-medium">Change plan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const sub = subByUser.get(u.id);
                const plan = sub?.plan ?? "free";
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{u.name}</p>
                      <p className="text-xs text-faint">{u.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(u.createdAt, false)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={plan === "free" ? "neutral" : "accent"}>{planLabel[plan]}</Badge>
                      {u.role === "admin" && <Badge tone="brand" className="ml-2">Admin</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">£{planPrice[plan]}</td>
                    <td className="px-4 py-3">
                      <form action={setPlanAction} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="userId" value={u.id} />
                        <select
                          name="plan"
                          defaultValue={plan}
                          className="rounded-lg border border-border bg-bg-soft px-2 py-1 text-xs text-ink outline-none focus:border-brand/60"
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p} value={p} className="bg-card">
                              {planLabel[p]}
                            </option>
                          ))}
                        </select>
                        <button className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition hover:border-brand/50 hover:text-ink">
                          Apply
                        </button>
                      </form>
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
