import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user)
    redirect(
      user.role === "platform_admin"
        ? "/platform"
        : user.role === "tenant_admin"
          ? "/admin"
          : "/dashboard",
    );

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to access your analysis terminal."
      demo
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
