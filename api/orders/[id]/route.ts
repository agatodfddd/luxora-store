import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readOrders, writeOrders, OrderStatus } from "@/lib/orders";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { status?: OrderStatus };
  if (!body.status) return NextResponse.json({ error: "Missing status" }, { status: 400 });

  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  orders[idx] = { ...orders[idx], status: body.status };
  writeOrders(orders);
  return NextResponse.json({ order: orders[idx] });
}
