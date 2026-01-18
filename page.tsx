import Link from "next/link";
import { readProducts } from "@/lib/fsdb";
import { ProductCard } from "@/components/product-card";
import { readSettings } from "@/lib/settings";

export default function HomePage() {
  const products = readProducts().filter((p) => p.featured).slice(0, 6);
  const { hero } = readSettings();
  const adminHighlights = [
    {
      title: "إدارة متكاملة",
      desc: "لوحة واحدة للتحكم بالمنتجات، الأقسام، الطلبات، والشحن.",
    },
    {
      title: "تجربة عميل فاخرة",
      desc: "تتبع الرسائل، الدعم، المرتجعات، وتقديم خدمة VIP بسرعة.",
    },
    {
      title: "تشغيل قابل للتوسع",
      desc: "إعدادات الدفع والكوبونات جاهزة للنمو دون تعقيد.",
    },
  ];

  return (
    <div className="space-y-10">
      <section className="lux-card shine overflow-hidden p-8 md:p-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <div className="lux-chip border-gold/20 text-gold">{hero.badge}</div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
              {hero.title.split("Luxora").map((part, idx, arr) => (
                <span key={idx}>
                  {part}
                  {idx < arr.length - 1 && <span className="text-gold">Luxora</span>}
                </span>
              ))}
            </h1>
            <p className="mt-4 text-white/65 md:text-lg">{hero.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={hero.primaryCta.href} className="lux-btn-gold">
                {hero.primaryCta.label}
              </Link>
              <Link href={hero.secondaryCta.href} className="lux-btn-ghost">
                {hero.secondaryCta.label}
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-gold/15 via-transparent to-white/10 blur-2xl" />
            <div className="lux-card relative overflow-hidden p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className="aspect-[4/3] w-full rounded-2xl object-cover opacity-95"
                src={hero.image}
                alt="Luxury hero"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/55 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { title: "واجهة فاخرة", value: "تصميم", desc: "ألوان داكنة مع لمسات ذهبية تعكس الفخامة." },
          { title: "جودة مختارة", value: "300+", desc: "منتجات يتم انتقاؤها بعناية عبر أقسام النخبة." },
          { title: "تجربة VIP", value: "24/7", desc: "دعم راقٍ وتواصل سريع مع العملاء." },
        ].map((item) => (
          <div key={item.title} className="lux-card p-6">
            <div className="text-sm text-[color:var(--lux-mutedtext)]">{item.value}</div>
            <div className="mt-2 text-lg font-semibold">{item.title}</div>
            <div className="mt-3 text-sm text-white/65">{item.desc}</div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">اختيارات النخبة</h2>
        <Link href="/shop" className="text-sm text-gold hover:underline">
          عرض الكل
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </section>

      <section className="lux-card p-6 md:p-10">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <div className="lux-chip border-gold/20 text-gold">لوحة الإدارة الشاملة</div>
            <h3 className="mt-4 text-2xl font-semibold">تحكم كامل بالمتجر من مكان واحد</h3>
            <p className="mt-3 text-sm text-white/65">
              تم تصميم لوحة Luxora لتمنحك رؤية شاملة عن الأداء، وإدارة سلسة للمنتجات والطلبات، مع أدوات
              خدمة العملاء والمرتجعات، وإعدادات الدفع والشحن.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/70">
              <span className="lux-chip">إدارة المنتجات</span>
              <span className="lux-chip">أقسام مخصصة</span>
              <span className="lux-chip">طلبات وشحن</span>
              <span className="lux-chip">دعم العملاء</span>
            </div>
          </div>
          <div className="grid gap-3">
            {adminHighlights.map((item) => (
              <div key={item.title} className="lux-card p-4">
                <div className="text-gold font-semibold">{item.title}</div>
                <div className="mt-2 text-sm text-white/60">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lux-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-gold font-semibold">تغليف فاخر</div>
            <div className="mt-2 text-sm text-white/60">كل طلب يصل بتغليف أنيق مناسب للهدايا.</div>
          </div>
          <div>
            <div className="text-gold font-semibold">شحن سريع</div>
            <div className="mt-2 text-sm text-white/60">إعداد الطلب خلال 24–48 ساعة في العادة.</div>
          </div>
          <div>
            <div className="text-gold font-semibold">دعم العملاء</div>
            <div className="mt-2 text-sm text-white/60">تواصل معنا عبر صفحة اتصل بنا — ونرد بسرعة.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
