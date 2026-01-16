import { NextResponse } from "next/server";
import { readProducts, writeProducts } from "@/lib/fsdb";
import { slugify } from "@/lib/slug";
import { Product } from "@/lib/types";
import { cookies } from "next/headers";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  const products = readProducts();
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Partial<Product>;
  if (!body.name || body.price === undefined || !body.category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const products = readProducts();
  const id = `p${Math.random().toString(16).slice(2, 10)}`;
  const slug = body.slug?.trim() ? body.slug : slugify(body.name);

  const p: Product = {
    id,
    name: body.name,
    slug,
    category: body.category as any,
    price: Number(body.price),
    currency: body.currency ?? "USD",
    description: body.description ?? "",
    images: body.images?.length ? body.images : [],
    featured: Boolean(body.featured),
    stock: body.stock ?? 0,
  };

  products.unshift(p);
  writeProducts(products);
  return NextResponse.json({ product: p });
}
