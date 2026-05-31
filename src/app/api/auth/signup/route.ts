import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser, getTenantBySlug, getUserByEmail } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password, name } = await request.json().catch(() => ({}));
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  // Attach the new subscriber to the tenant they signed up under (proxy cookie).
  const slug = (await cookies()).get("vb_tenant")?.value || "vaultbets";
  const tenant = await getTenantBySlug(slug);
  const user = await createUser({ email, password, name, tenantId: tenant?.id ?? null });
  const res = NextResponse.json({ ok: true, redirect: "/dashboard" });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
