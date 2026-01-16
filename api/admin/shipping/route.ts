import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readShipping, writeShipping, ShippingSettings } from "@/lib/shipping";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ shipping: readShipping() });
}

export async function PUT(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as ShippingSettings;
  writeShipping(body);
  return NextResponse.json({ shipping: body });
}
