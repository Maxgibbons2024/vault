import { cookies } from "next/headers";
import { getUserById } from "./store";
import type { User } from "./types";

export const SESSION_COOKIE = "vb_session";

// Demo session: the cookie simply stores the user id (httpOnly). In production
// this would be a signed/encrypted JWT or an opaque session id backed by a store.
export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return (await getUserById(userId)) ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}
