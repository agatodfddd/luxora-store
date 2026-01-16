import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("luxora_admin", "", { path: "/", maxAge: 0 });
  res.cookies.set("luxora_admin_user", "", { path: "/", maxAge: 0 });
  return res;
}
