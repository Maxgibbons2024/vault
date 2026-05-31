import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "user" ? "/dashboard" : "/admin");

  return (
    <AuthShell
      title="Start your free trial"
      subtitle="Create an account to explore VaultBets AI analysis."
    >
      <AuthForm mode="signup" />
    </AuthShell>
  );
}
