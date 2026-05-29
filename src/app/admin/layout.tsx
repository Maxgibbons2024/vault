import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Logo, Disclaimer } from "@/components/brand";
import { Badge } from "@/components/ui";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");

  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/events", label: "Events & Analysis" },
    { href: "/admin/subscribers", label: "Subscribers" },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <Badge tone="accent">Admin</Badge>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-lg px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
              >
                {n.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-1.5 text-muted transition hover:bg-white/5 hover:text-ink"
            >
              Exit ↗
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-border px-4 py-6 sm:px-6">
        <Disclaimer className="mx-auto max-w-6xl" />
      </footer>
    </div>
  );
}
