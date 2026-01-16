import { NextResponse } from "next/server";
import { readProducts, writeProducts } from "@/lib/fsdb";
import { Product } from "@/lib/types";
import { cookies } from "next/headers";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<Product>;
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === params.id);
  if (idx < 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated: Product = {
    ...products[idx],
    ...body,
    price: body.price !== undefined ? Number(body.price) : products[idx].price,
  };

  products[idx] = updated;
  writeProducts(products);
  return NextResponse.json({ product: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = readProducts().filter((p) => p.id !== params.id);
  writeProducts(products);
  return NextResponse.json({ ok: true });
}
