import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readCategories, writeCategories, StoreCategory } from "@/lib/categoriesdb";

function requireAdmin() {
  return cookies().get("luxora_admin")?.value === "1";
}

export async function GET() {
  const categories = readCategories().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return NextResponse.json({ categories });
}

export async function POST(req: Request) {
  if (!requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json()) as { categories?: StoreCategory[] };
  if (!body.categories || !Array.isArray(body.categories)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  // basic sanitize
  const cleaned = body.categories.map((c, i) => ({
    id: String(c.id || "").trim().toLowerCase(),
    nameAr: String(c.nameAr || "").trim(),
    nameEn: String(c.nameEn || "").trim(),
    descriptionAr: c.descriptionAr ? String(c.descriptionAr) : "",
    descriptionEn: c.descriptionEn ? String(c.descriptionEn) : "",
    image: String(c.image || "").trim() || "/collections/clothing.svg",
    productIds: Array.isArray(c.productIds) ? c.productIds.map(String) : [],
    order: Number.isFinite(Number(c.order)) ? Number(c.order) : i + 1,
  })).filter(c => c.id && (c.nameAr || c.nameEn));

  writeCategories(cleaned);
  return NextResponse.json({ ok: true, categories: cleaned });
}
