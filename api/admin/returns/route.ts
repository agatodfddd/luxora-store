import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readReturns } from "@/lib/returns";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ returns: readReturns() });
}
