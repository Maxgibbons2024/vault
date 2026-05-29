import Stripe from "stripe";
import type { PlanId } from "./types";

// Stripe is optional in this build. If STRIPE_SECRET_KEY is not configured the
// app runs in "demo mode": the upgrade flow activates the plan locally without
// a real charge. Set the env vars below to switch to a live Stripe Checkout.
export const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;

export const stripe = stripeEnabled
  ? new Stripe(process.env.STRIPE_SECRET_KEY!)
  : null;

// Map our plans to Stripe Price IDs (set these when going live).
export const stripePriceIds: Record<Exclude<PlanId, "free">, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
};
