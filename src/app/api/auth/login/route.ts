import { NextResponse } from "next/server";
import { getUserByEmail } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required." }, { status: 400 });
  }
  const user = await getUserByEmail(email);
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }
  const res = NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, role: user.role },
    redirect:
      user.role === "platform_admin"
        ? "/platform"
        : user.role === "tenant_admin"
          ? "/admin"
          : "/dashboard",
  });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
