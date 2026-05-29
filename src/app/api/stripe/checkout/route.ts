import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setPlanForUser } from "@/lib/store";
import { stripe, stripeEnabled, stripePriceIds } from "@/lib/stripe";
import type { PlanId } from "@/lib/types";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: PlanId };
  if (plan !== "starter" && plan !== "pro") {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";

  // Live Stripe Checkout when configured.
  if (stripeEnabled && stripe && stripePriceIds[plan]) {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePriceIds[plan]!, quantity: 1 }],
      success_url: `${origin}/upgrade?success=1&plan=${plan}`,
      cancel_url: `${origin}/upgrade?canceled=1`,
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, plan },
    });
    return NextResponse.json({ url: session.url });
  }

  // Demo mode: activate the plan immediately, no charge.
  await setPlanForUser(user.id, plan);
  return NextResponse.json({ url: `/upgrade?success=1&plan=${plan}&demo=1` });
}
