import { NextResponse } from "next/server";
import { readReturns, writeReturns, ReturnRequest } from "@/lib/returns";

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<ReturnRequest>;
  if (!body.name || !body.phone || !body.email || !body.reason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const items = readReturns();
  const rr: ReturnRequest = {
    id: `r_${Math.random().toString(16).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    status: "requested",
    name: body.name,
    phone: body.phone,
    email: body.email,
    orderId: body.orderId ?? "",
    reason: body.reason as any,
    details: body.details ?? "",
  };
  items.unshift(rr);
  writeReturns(items);
  return NextResponse.json({ ok: true, request: rr });
}
