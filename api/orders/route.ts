import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readOrders, writeOrders, Order } from "@/lib/orders";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = readOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Omit<Order, "id" | "createdAt" | "status">;

  if (
    !body.items?.length ||
    !body.shipping?.fullName ||
    !body.shipping?.phone ||
    !body.shipping?.country ||
    !body.shipping?.city ||
    !body.shipping?.address1
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const orders = readOrders();
  const id = `o_${Math.random().toString(16).slice(2, 10)}`;
  const createdAt = new Date().toISOString();

  const order: Order = {
    id,
    createdAt,
    status: "new",
    items: body.items,
    total: Number(body.total ?? 0),
    currency: body.currency ?? "USD",
    shipping: body.shipping as any,
    payment: body.payment as any,
  };

  orders.unshift(order);
  writeOrders(orders);
  return NextResponse.json({ order });
}
