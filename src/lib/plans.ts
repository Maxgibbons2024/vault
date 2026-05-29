import type { PlanId } from "./types";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // GBP / month
  blurb: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    blurb: "Daily analysis across two core sports.",
    features: [
      "Football & Tennis analysis",
      "Up to 5 value opportunities / day",
      "Full AI match reports",
      "Performance analytics dashboard",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 49,
    blurb: "Everything, every sport, no limits.",
    highlighted: true,
    features: [
      "All sports — Football, Tennis, UFC, Racing",
      "Unlimited value opportunities",
      "Full AI match reports + risk modelling",
      "Historical performance & ROI tracking",
      "Priority access to new markets",
      "Email & Telegram alerts (coming soon)",
    ],
  },
];

export const planLabel: Record<PlanId, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export const planPrice: Record<PlanId, number> = {
  free: 0,
  starter: 19,
  pro: 49,
};
