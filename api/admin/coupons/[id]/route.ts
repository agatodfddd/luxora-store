import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readCoupons, writeCoupons, Coupon } from "@/lib/coupons";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<Coupon>;
  const items = readCoupons();
  const idx = items.findIndex((c) => c.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  items[idx] = { ...items[idx], ...body, amount: body.amount !== undefined ? Number(body.amount) : items[idx].amount };
  writeCoupons(items);
  return NextResponse.json({ coupon: items[idx] });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = readCoupons().filter((c) => c.id !== params.id);
  writeCoupons(items);
  return NextResponse.json({ ok: true });
}
