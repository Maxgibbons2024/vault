import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { Sidebar } from "@/components/sidebar";
import { Disclaimer } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/store";
import { getTenant } from "@/lib/tenant";
import { planLabel } from "@/lib/plans";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, tenant] = await Promise.all([getCurrentUser(), getTenant()]);
  if (!user) redirect("/login");

  const sub = await getSubscriptionForUser(user.id);
  const plan = planLabel[sub?.plan ?? "free"];
  const brand = tenant?.brand;
  const brandName = brand?.logoText ?? "VaultBets";

  // Per-tenant theme: override the design tokens for this subtree.
  const themeVars = brand
    ? ({
        "--color-brand": brand.brand,
        "--color-brand-soft": brand.brandSoft,
        "--color-brand-dark": brand.brand,
        "--color-accent": brand.accent,
      } as CSSProperties)
    : undefined;

  return (
    <div className="flex min-h-screen flex-col md:flex-row" style={themeVars}>
      <Sidebar
        user={{ name: user.name }}
        plan={plan}
        isAdmin={user.role !== "user"}
        brandName={brandName}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-10">
          <Disclaimer className="mx-auto max-w-6xl" name={tenant?.name ?? "This service"} />
        </footer>
      </div>
    </div>
  );
}
