"use server";

import { revalidatePath } from "next/cache";
import { isPlatformAdmin } from "@/lib/auth";
import { createTenant, updateTenant } from "@/lib/store";
import type { Brand, MarketKind, Sport, Strategy } from "@/lib/types";

async function assertPlatform() {
  if (!(await isPlatformAdmin())) throw new Error("Unauthorized");
}

function parseStrategy(f: FormData): Strategy {
  const sports = f.getAll("sports").map(String) as Sport[];
  const markets = f.getAll("markets").map(String) as MarketKind[];
  return {
    sports: sports.length ? sports : ["football"],
    markets: markets.length ? markets : ["h2h"],
    minEdge: Number(f.get("minEdge") || 5),
    minProb: Number(f.get("minProb") || 0.1),
    maxProb: Number(f.get("maxProb") || 0.9),
    maxPicks: Number(f.get("maxPicks") || 15),
  };
}

function parseBrand(f: FormData): Brand {
  const brand = String(f.get("brand") || "#0ea5e9");
  return {
    brand,
    brandSoft: String(f.get("brandSoft") || brand),
    accent: String(f.get("accent") || "#10b981"),
    logoText: String(f.get("logoText") || "Tipster"),
    tagline: String(f.get("tagline") || "") || undefined,
  };
}

export async function createTenantAction(formData: FormData) {
  await assertPlatform();
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) return;
  await createTenant({
    slug,
    name,
    status: "active",
    brand: parseBrand(formData),
    strategy: parseStrategy(formData),
    telegramBotToken: String(formData.get("telegramBotToken") || "") || null,
    telegramChannelId: String(formData.get("telegramChannelId") || "") || null,
    customDomain: null,
  });
  revalidatePath("/platform");
}

export async function updateTenantAction(formData: FormData) {
  await assertPlatform();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await updateTenant(id, {
    name: String(formData.get("name") || "").trim(),
    status: (String(formData.get("status") || "active") as "active" | "paused"),
    brand: parseBrand(formData),
    strategy: parseStrategy(formData),
    telegramBotToken: String(formData.get("telegramBotToken") || "") || null,
    telegramChannelId: String(formData.get("telegramChannelId") || "") || null,
  });
  revalidatePath("/platform");
  revalidatePath(`/platform/${id}`);
}
