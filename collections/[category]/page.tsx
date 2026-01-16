import { notFound } from "next/navigation";
import { readProducts } from "@/lib/fsdb";
import { readCategories } from "@/lib/categoriesdb";
import { ProductCard } from "@/components/product-card";

export default function CollectionCategoryPage({ params }: { params: { category: string } }) {
  const key = params.category?.toLowerCase();
  const cats = readCategories();
  const cat = cats.find((c) => c.id === key);
  if (!cat) return notFound();

  const products = readProducts().filter((p) => {
    const inMap = (p.category || "").toLowerCase() === key;
    const inList = (cat.productIds || []).includes(p.id);
    // allow both: explicit list OR category field matches
    return inList || inMap;
  });

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        <h1 className="text-2xl font-semibold">{cat.nameAr} <span className="opacity-60">/ {cat.nameEn}</span></h1>
        <p className="mt-1 text-sm text-[color:var(--lux-mutedtext)]">تصفّح منتجات هذا القسم.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      {products.length === 0 && (
        <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد منتجات في هذا القسم حالياً.</div>
      )}
    </div>
  );
}
