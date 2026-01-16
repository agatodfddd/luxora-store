import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readMessages, writeMessages } from "@/lib/messages";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { status?: "new" | "read" | "archived" };
  if (!body.status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  const items = readMessages();
  const idx = items.findIndex((m) => m.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  items[idx] = { ...items[idx], status: body.status };
  writeMessages(items);
  return NextResponse.json({ message: items[idx] });
}
