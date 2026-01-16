import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readPayments, writePayments, PaymentSettings } from "@/lib/payments";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ payments: readPayments() });
}

export async function PUT(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as Partial<PaymentSettings>;
  const cur = readPayments();
  const merged: PaymentSettings = {
    paypal: { ...cur.paypal, ...(body.paypal ?? {}) },
    stripe: { ...cur.stripe, ...(body.stripe ?? {}) },
    cod: { ...cur.cod, ...(body.cod ?? {}) },
    bank: { ...cur.bank, ...(body.bank ?? {}) },
  };
  writePayments(merged);
  return NextResponse.json({ payments: merged });
}
