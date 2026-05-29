"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "./ui";
import type { PlanId } from "@/lib/types";

export function SubscribeButton({
  plan,
  current,
  highlighted,
}: {
  plan: PlanId;
  current: boolean;
  highlighted?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        if (data.url.startsWith("http")) {
          window.location.href = data.url; // live Stripe Checkout
        } else {
          router.push(data.url); // demo activation
          router.refresh();
        }
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  if (current) {
    return (
      <Button variant="outline" size="lg" className="mt-6 w-full" disabled>
        Current plan
      </Button>
    );
  }

  return (
    <Button
      onClick={subscribe}
      variant={highlighted ? "primary" : "outline"}
      size="lg"
      className="mt-6 w-full"
      disabled={loading}
    >
      {loading ? "Redirecting…" : `Subscribe to ${plan === "pro" ? "Pro" : "Starter"}`}
    </Button>
  );
}
