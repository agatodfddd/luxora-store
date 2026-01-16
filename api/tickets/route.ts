import { NextResponse } from "next/server";
import { readTickets, writeTickets, SupportTicket } from "@/lib/tickets";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<SupportTicket>;
  if (!body.name || !body.email || !body.topic || !body.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const items = readTickets();
  const t: SupportTicket = {
    id: `t_${Math.random().toString(16).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    status: "open",
    name: body.name,
    email: body.email,
    phone: body.phone ?? "",
    topic: body.topic as any,
    orderId: body.orderId ?? "",
    message: body.message,
    notes: "",
  };
  items.unshift(t);
  writeTickets(items);
  return NextResponse.json({ ok: true, ticket: t });
}
