import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readSettings, writeSettings } from "@/lib/settings";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  const settings = readSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const current = readSettings();

  const next = {
    ...current,
    ...(body.hero ? { hero: body.hero } : {}),
    ...(body.theme ? { theme: body.theme } : {}),
  };

  writeSettings(next as any);
  return NextResponse.json({ ok: true, settings: next });
}
