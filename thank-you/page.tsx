import Link from "next/link";

export default function ThankYouPage({ searchParams }: { searchParams: { order?: string } }) {
  const orderId = searchParams?.order ?? "";

  return (
    <div className="space-y-6">
      <section className="lux-card shine overflow-hidden p-8 md:p-12 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="lux-chip mx-auto w-fit border-gold/20 text-gold">Luxora • Thank You</div>
          <h1 className="mt-4 text-3xl font-semibold md:text-5xl">تم استلام طلبك بنجاح</h1>
          <p className="mt-4 text-white/65 md:text-lg">
            شكراً لاختيارك Luxora. سنقوم بتأكيد الطلب والتواصل معك قريباً لإتمام الإجراءات.
          </p>

          {orderId && (
            <div className="mt-6">
              <div className="text-sm text-white/60">رقم الطلب</div>
              <div className="mt-2 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-gold">
                #{orderId}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="lux-btn-gold">متابعة التسوق</Link>
            <Link href="/contact" className="lux-btn-ghost">تواصل معنا</Link>
          </div>
        </div>
      </section>

      <section className="lux-card p-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="text-gold font-semibold">تأكيد سريع</div>
            <div className="mt-2 text-sm text-white/60">نراجع الطلب ونتواصل معك لتأكيد التفاصيل.</div>
          </div>
          <div>
            <div className="text-gold font-semibold">تجهيز أنيق</div>
            <div className="mt-2 text-sm text-white/60">التغليف الفاخر جزء من تجربتنا.</div>
          </div>
          <div>
            <div className="text-gold font-semibold">دعم العملاء</div>
            <div className="mt-2 text-sm text-white/60">أي سؤال؟ سنساعدك فوراً.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
