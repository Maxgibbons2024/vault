import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/brand";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div>
        <p className="text-6xl font-bold text-ink">404</p>
        <p className="mt-2 text-muted">This page could not be found.</p>
      </div>
      <ButtonLink href="/dashboard">Back to dashboard</ButtonLink>
    </div>
  );
}
