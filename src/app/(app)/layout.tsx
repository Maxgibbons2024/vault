import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Disclaimer } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionForUser } from "@/lib/store";
import { planLabel } from "@/lib/plans";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sub = await getSubscriptionForUser(user.id);
  const plan = planLabel[sub?.plan ?? "free"];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar
        user={{ name: user.name }}
        plan={plan}
        isAdmin={user.role === "admin"}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-6 sm:px-6 lg:px-10">
          <Disclaimer className="mx-auto max-w-6xl" />
        </footer>
      </div>
    </div>
  );
}
