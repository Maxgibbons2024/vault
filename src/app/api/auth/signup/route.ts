import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/store";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password, name } = await request.json().catch(() => ({}));
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }
  const user = await createUser({ email, password, name });
  const res = NextResponse.json({ ok: true, redirect: "/dashboard" });
  res.cookies.set(SESSION_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
