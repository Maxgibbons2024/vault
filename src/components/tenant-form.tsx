import { Button, Card } from "@/components/ui";
import { SPORTS, type Tenant } from "@/lib/types";

const input =
  "w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-ink placeholder:text-faint outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

// Shared create/edit form. `tenant` undefined = create mode.
export function TenantForm({
  action,
  tenant,
}: {
  action: (formData: FormData) => void;
  tenant?: Tenant;
}) {
  const s = tenant?.strategy;
  const b = tenant?.brand;
  return (
    <Card className="p-6">
      <form action={action} className="space-y-6">
        {tenant && <input type="hidden" name="id" value={tenant.id} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipster / brand name">
            <input name="name" required defaultValue={tenant?.name} placeholder="SharpTips" className={input} />
          </Field>
          {tenant ? (
            <Field label="Slug (fixed)">
              <input value={tenant.slug} disabled className={`${input} opacity-60`} />
            </Field>
          ) : (
            <Field label="Slug (URL: /t/slug)">
              <input name="slug" required placeholder="sharptips" className={input} />
            </Field>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Branding</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Logo text">
              <input name="logoText" defaultValue={b?.logoText} placeholder="SharpTips" className={input} />
            </Field>
            <Field label="Brand colour">
              <input name="brand" type="color" defaultValue={b?.brand ?? "#0ea5e9"} className={`${input} h-11 p-1`} />
            </Field>
            <Field label="Accent colour">
              <input name="accent" type="color" defaultValue={b?.accent ?? "#10b981"} className={`${input} h-11 p-1`} />
            </Field>
            <Field label="Tagline (optional)">
              <input name="tagline" defaultValue={b?.tagline} placeholder="Sharp football value" className={input} />
            </Field>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Strategy</p>
          <div className="space-y-3">
            <div>
              <span className="mb-1.5 block text-sm text-muted">Sports</span>
              <div className="flex flex-wrap gap-3">
                {SPORTS.map((sp) => (
                  <label key={sp.id} className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft/40 px-3 py-1.5 text-sm text-muted">
                    <input type="checkbox" name="sports" value={sp.id} defaultChecked={s ? s.sports.includes(sp.id) : sp.id !== "horse-racing"} className="accent-[#0ea5e9]" />
                    {sp.icon} {sp.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-sm text-muted">Markets</span>
              <div className="flex flex-wrap gap-3">
                {(["h2h", "totals"] as const).map((m) => (
                  <label key={m} className="flex items-center gap-2 rounded-lg border border-border bg-bg-soft/40 px-3 py-1.5 text-sm text-muted">
                    <input type="checkbox" name="markets" value={m} defaultChecked={s ? s.markets.includes(m) : true} className="accent-[#0ea5e9]" />
                    {m === "h2h" ? "Match winner (h2h)" : "Totals (O/U 2.5)"}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="Min edge %">
                <input name="minEdge" type="number" step="1" defaultValue={s?.minEdge ?? 5} className={input} />
              </Field>
              <Field label="Min probability">
                <input name="minProb" type="number" step="0.05" defaultValue={s?.minProb ?? 0.1} className={input} />
              </Field>
              <Field label="Max probability">
                <input name="maxProb" type="number" step="0.05" defaultValue={s?.maxProb ?? 0.9} className={input} />
              </Field>
              <Field label="Max picks / run">
                <input name="maxPicks" type="number" step="1" defaultValue={s?.maxPicks ?? 15} className={input} />
              </Field>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Telegram channel (optional)</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bot token">
              <input name="telegramBotToken" defaultValue={tenant?.telegramBotToken ?? ""} placeholder="123456:ABC…" className={input} />
            </Field>
            <Field label="Channel ID">
              <input name="telegramChannelId" defaultValue={tenant?.telegramChannelId ?? ""} placeholder="-100…" className={input} />
            </Field>
          </div>
        </div>

        {tenant && (
          <Field label="Status">
            <select name="status" defaultValue={tenant.status} className={input}>
              <option value="active" className="bg-card">Active</option>
              <option value="paused" className="bg-card">Paused</option>
            </select>
          </Field>
        )}

        <Button type="submit" size="lg">{tenant ? "Save tenant" : "Create tenant"}</Button>
      </form>
    </Card>
  );
}
