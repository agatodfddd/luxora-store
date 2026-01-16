"use client";

import Link from "next/link";
import { useCart, setQty, removeFromCart, clearCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { Minus, Plus, Trash2 } from "lucide-react";

export default function CartPage() {
  const { items, total } = useCart();

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">السلة</h1>
            <p className="mt-1 text-sm text-white/60">راجع مشترياتك قبل المتابعة.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="lux-btn-ghost" onClick={() => clearCart()} disabled={items.length === 0}>
              تفريغ السلة
            </button>
            <Link className="lux-btn-gold shine" href="/shop">
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="lux-card p-10 text-center">
          <div className="text-white/70">سلتك فارغة.</div>
          <div className="mt-4">
            <Link className="lux-btn-gold shine" href="/shop">
              اذهب للمتجر
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lux-card p-5 lg:col-span-2">
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={it.image} alt={it.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-white/55">{formatMoney(it.price, it.currency)}</div>
                      <Link className="text-xs text-gold hover:underline" href={`/product/${it.slug}`}>
                        عرض المنتج
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-1">
                      <button
                        className="lux-btn-ghost px-2 py-2"
                        onClick={() => setQty(it.id, it.qty - 1)}
                        type="button"
                        aria-label="decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="w-8 text-center text-sm">{it.qty}</div>
                      <button
                        className="lux-btn-ghost px-2 py-2"
                        onClick={() => setQty(it.id, it.qty + 1)}
                        type="button"
                        aria-label="increase"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <button className="lux-btn-ghost" onClick={() => removeFromCart(it.id)} type="button" aria-label="remove">
                      <Trash2 className="h-4 w-4 text-red-300" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lux-card p-5">
            <div className="text-lg font-semibold">الملخّص</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between">
                <span>المجموع</span>
                <span className="text-white/90">{formatMoney(total, items[0]?.currency ?? "USD")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>الشحن</span>
                <span className="text-white/90">يُحسب لاحقًا</span>
              </div>
              <div className="lux-divider my-3" />
              <div className="flex items-center justify-between text-base">
                <span className="text-white/80">الإجمالي</span>
                <span className="font-semibold text-gold">{formatMoney(total, items[0]?.currency ?? "USD")}</span>
              </div>
            </div>

            <button className="lux-btn-gold shine mt-5 w-full" type="button" onClick={() => (window.location.href = "/checkout")}>
              الانتقال للدفع
            </button>

            <p className="mt-3 text-xs text-white/45">
              قريباً: صفحة Checkout حقيقية + طرق دفع + عنوان الشحن.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
