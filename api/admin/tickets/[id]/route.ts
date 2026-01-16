import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readTickets, writeTickets, TicketStatus } from "@/lib/tickets";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { status?: TicketStatus; notes?: string };
  const items = readTickets();
  const idx = items.findIndex((t) => t.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  items[idx] = { 
    ...items[idx], 
    status: body.status ?? items[idx].status,
    notes: body.notes !== undefined ? body.notes : items[idx].notes,
  };
  writeTickets(items);
  return NextResponse.json({ ticket: items[idx] });
}
