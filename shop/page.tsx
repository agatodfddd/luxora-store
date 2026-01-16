"use client";

import { useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

type Cat = { id: string; nameAr: string; nameEn: string };

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [sort, setSort] = useState<"featured" | "price_asc" | "price_desc">("featured");

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => setProducts(d.products as Product[]));
    fetch("/api/categories").then((r) => r.json()).then((d) => setCats(d.categories as Cat[]));
  }, []);

  const filtered = useMemo(() => {
    let list = [...products];
    if (cat !== "all") list = list.filter((p) => (p.category || "").toLowerCase() === cat);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter((p) => (p.name + " " + p.description).toLowerCase().includes(s));
    }
    if (sort === "featured") list.sort((a, b) => (Number(b.featured) - Number(a.featured)));
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, q, cat, sort]);

  return (
    <div className="space-y-6">
      <div className="lux-card p-5 md:p-6">
        <h1 className="text-2xl font-semibold">المتجر / Shop</h1>
        <p className="mt-2 text-sm text-[color:var(--lux-mutedtext)]">ابحث، فلتر، واكتشف منتجات فاخرة.</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div>
            <label className="lux-label">بحث / Search</label>
            <input className="lux-input" placeholder="ابحث عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>

          <div>
            <label className="lux-label">الفئة / Category</label>
            <select className="lux-input" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All / الكل</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.nameEn} / {c.nameAr}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="lux-label">الترتيب / Sort</label>
            <select className="lux-input" value={sort} onChange={(e) => setSort(e.target.value as any)}>
              <option value="featured">Featured</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد نتائج.</div>
      )}
    </div>
  );
}
