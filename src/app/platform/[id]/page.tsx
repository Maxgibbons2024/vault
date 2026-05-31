import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/store";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { TenantForm } from "@/components/tenant-form";
import { updateTenantAction } from "../actions";

export default async function EditTenantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <Link href="/platform" className="text-sm text-muted hover:text-ink">← Back to tipsters</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionHeading eyebrow="Edit tipster" title={tenant.name} subtitle={`/t/${tenant.slug}`} />
        <ButtonLink href={`/t/${tenant.slug}/dashboard`} variant="outline" size="sm">
          View site ↗
        </ButtonLink>
      </div>
      <TenantForm action={updateTenantAction} tenant={tenant} />
    </div>
  );
}
