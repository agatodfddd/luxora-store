import Link from "next/link";
import Image from "next/image";
import { readCategories } from "@/lib/categoriesdb";

export default function CollectionsPage() {
  const cats = readCategories().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        <h1 className="text-2xl font-semibold">الأقسام / Collections</h1>
        <p className="mt-1 text-sm text-[color:var(--lux-mutedtext)]">اختر القسم الذي تريد تصفحه.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {cats.map((c) => (
          <Link key={c.id} href={`/collections/${c.id}`} className="lux-card group overflow-hidden p-6 transition hover:translate-y-[-1px]">
            <div className="flex items-stretch justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="text-gold font-semibold">{c.nameAr} <span className="opacity-60">/ {c.nameEn}</span></div>
                <div className="mt-2 text-sm text-[color:var(--lux-mutedtext)]">{c.descriptionAr || c.descriptionEn || ""}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-[color:var(--lux-mutedtext)] group-hover:text-[color:var(--lux-fg)]">
                  عرض المنتجات <span className="text-gold">←</span>
                </div>
              </div>

              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)]">
                <Image
                  src={c.image}
                  alt={c.nameEn}
                  fill
                  sizes="96px"
                  className="object-cover transition duration-300 group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-transparent" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {cats.length === 0 && <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد أقسام بعد.</div>}
    </div>
  );
}
