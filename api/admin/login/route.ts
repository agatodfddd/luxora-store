import { NextResponse } from "next/server";
import { ADMIN_PASSWORD } from "@/lib/admin";

export async function POST(req: Request) {
  const body = (await req.json()) as { username?: string; password?: string };
  if (!body?.password || body.password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // Simple cookie for demo. In production use a signed JWT/session store.
  res.cookies.set("luxora_admin", "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true on HTTPS
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  if (body.username) {
    res.cookies.set("luxora_admin_user", body.username.slice(0, 64), {
      httpOnly: false,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}
