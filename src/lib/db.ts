import { PrismaClient } from "@prisma/client";

// Live persistence is enabled when DATABASE_URL is set (Supabase Postgres).
// Without it, the app falls back to the in-memory store so it always runs.
export const dbEnabled = !!process.env.DATABASE_URL;

const g = globalThis as unknown as { __vaultbetsPrisma?: PrismaClient };

export const prisma: PrismaClient | null = dbEnabled
  ? (g.__vaultbetsPrisma ??= new PrismaClient())
  : null;
