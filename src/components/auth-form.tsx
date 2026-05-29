"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "./ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <Field name="name" label="Full name" type="text" placeholder="Alex Morgan" autoComplete="name" />
      )}
      <Field name="email" label="Email" type="email" placeholder="you@example.com" autoComplete="email" />
      <Field
        name="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
      />

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading
          ? "Please wait…"
          : mode === "login"
            ? "Log in"
            : "Create account & start trial"}
      </Button>

      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>
            New to VaultBets?{" "}
            <Link href="/signup" className="font-medium text-brand-soft hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-soft hover:underline">
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type,
  placeholder,
  autoComplete,
}: {
  name: string;
  label: string;
  type: string;
  placeholder: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted">{label}</span>
      <input
        name={name}
        type={type}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-border bg-bg-soft px-3.5 py-2.5 text-ink placeholder:text-faint outline-none transition focus:border-brand/60 focus:ring-2 focus:ring-brand/20"
      />
    </label>
  );
}
