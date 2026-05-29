import { NextResponse } from "next/server";
import { setPlanForUser } from "@/lib/store";
import { stripe, stripeEnabled } from "@/lib/stripe";
import type { PlanId } from "@/lib/types";

// Stripe webhook to fulfil subscriptions after a successful Checkout. Only active
// when Stripe is configured; in demo mode the plan is activated synchronously by
// the checkout route instead.
export async function POST(request: Request) {
  if (!stripeEnabled || !stripe) {
    return NextResponse.json({ error: "Stripe not configured." }, { status: 501 });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event =
      secret && signature
        ? stripe.webhooks.constructEvent(body, signature, secret)
        : JSON.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      metadata?: { userId?: string; plan?: PlanId };
      client_reference_id?: string;
    };
    const userId = session.metadata?.userId ?? session.client_reference_id;
    const plan = session.metadata?.plan;
    if (userId && (plan === "starter" || plan === "pro")) {
      await setPlanForUser(userId, plan);
    }
  }

  return NextResponse.json({ received: true });
}
