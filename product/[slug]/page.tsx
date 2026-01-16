import Link from "next/link";
import { readProducts } from "@/lib/fsdb";
import { formatMoney } from "@/lib/money";
import { AddToCartButton } from "@/components/add-to-cart";

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = readProducts().find((x) => x.slug === params.slug);
  if (!p) return <div className="lux-card p-8">المنتج غير موجود.</div>;

  return (
    <div className="space-y-6">
      <div className="lux-card overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-2 md:p-8">
          <div className="space-y-3">
            <div className="lux-chip border-gold/20 text-gold">{p.category}</div>
            <h1 className="text-3xl font-semibold">{p.name}</h1>
            <div className="text-2xl font-semibold text-gold">{formatMoney(p.price, p.currency)}</div>
            <p className="text-white/65">{p.description}</p>

            <div className="mt-4 flex gap-3">
              <AddToCartButton product={p} />
              <Link className="lux-btn-ghost" href="/shop">رجوع للمتجر</Link>
            </div>

            <div className="mt-6 lux-divider" />

            <div className="grid gap-3 text-sm text-white/60">
              <div>المخزون: <span className="text-white/80">{p.stock ?? 0}</span></div>
              <div>التوصيل: <span className="text-white/80">24–72 ساعة (تقديري)</span></div>
              <div>الإرجاع: <Link className="text-gold hover:underline" href="/policies/returns">سياسة الإرجاع</Link></div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-gold/15 via-transparent to-white/10 blur-2xl" />
            <div className="lux-card relative overflow-hidden p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="aspect-square w-full rounded-2xl object-cover" src={p.images?.[0]} alt={p.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
