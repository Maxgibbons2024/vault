import Link from "next/link";
import { listTenants } from "@/lib/store";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { TenantForm } from "@/components/tenant-form";
import { createTenantAction } from "./actions";

export default async function PlatformPage() {
  const tenants = await listTenants();

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Platform admin"
        title="Tipsters"
        subtitle="Each tenant is a white-label tipster with their own strategy, branding and Telegram channel."
      />

      <Card className="overflow-hidden p-0">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
              <th className="px-4 py-3 font-medium">Tipster</th>
              <th className="px-4 py-3 font-medium">Site</th>
              <th className="px-4 py-3 font-medium">Sports</th>
              <th className="px-4 py-3 font-medium">Min edge</th>
              <th className="px-4 py-3 text-center font-medium">Telegram</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/platform/${t.id}`} className="font-medium text-ink hover:text-brand-soft">
                    {t.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">/t/{t.slug}</td>
                <td className="px-4 py-3 text-muted">{t.strategy.sports.join(", ")}</td>
                <td className="px-4 py-3 text-muted">{t.strategy.minEdge}%</td>
                <td className="px-4 py-3 text-center">
                  {t.telegramBotToken && t.telegramChannelId ? (
                    <Badge tone="accent">On</Badge>
                  ) : (
                    <Badge tone="neutral">Off</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge tone={t.status === "active" ? "accent" : "warn"} className="capitalize">{t.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <section>
        <SectionHeading title="Add a tipster" />
        <div className="mt-4">
          <TenantForm action={createTenantAction} />
        </div>
      </section>
    </div>
  );
}
