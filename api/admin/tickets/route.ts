import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readTickets } from "@/lib/tickets";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ tickets: readTickets() });
}
