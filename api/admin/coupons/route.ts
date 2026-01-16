import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readCoupons, writeCoupons, Coupon } from "@/lib/coupons";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ coupons: readCoupons() });
}

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<Coupon>;
  if (!body.code || !body.type || body.amount === undefined) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const items = readCoupons();
  const c: Coupon = {
    id: `c_${Math.random().toString(16).slice(2, 10)}`,
    code: body.code.toUpperCase(),
    type: body.type as any,
    amount: Number(body.amount),
    active: body.active !== false,
    minSubtotal: body.minSubtotal !== undefined ? Number(body.minSubtotal) : 0,
    maxUses: body.maxUses !== undefined ? Number(body.maxUses) : 0,
    usedCount: 0,
    expiresAt: body.expiresAt ?? "",
  };
  items.unshift(c);
  writeCoupons(items);
  return NextResponse.json({ coupon: c });
}
