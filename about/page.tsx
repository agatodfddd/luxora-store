export default function AboutPage() {
  return (
    <div className="lux-card p-6 md:p-8 space-y-4">
      <h1 className="text-2xl font-semibold">من نحن</h1>
      <div className="lux-divider" />
      <p className="text-white/70">
        Luxora علامة تجارية فاخرة تقدّم ملابس وعطور وساعات وإكسسوارات مختارة بعناية.
        نؤمن أن التفاصيل الصغيرة تصنع فرقًا كبيرًا—من جودة المنتج، إلى التغليف، إلى تجربة التصفح.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="lux-card p-4">
          <div className="text-gold font-semibold">الجودة</div>
          <div className="mt-2 text-sm text-white/60">منتجات بمواد ممتازة وتشطيب راقٍ.</div>
        </div>
        <div className="lux-card p-4">
          <div className="text-gold font-semibold">الأناقة</div>
          <div className="mt-2 text-sm text-white/60">تصاميم عصرية بروح فاخرة.</div>
        </div>
        <div className="lux-card p-4">
          <div className="text-gold font-semibold">الثقة</div>
          <div className="mt-2 text-sm text-white/60">دعم واضح وسياسات شفافة.</div>
        </div>
      </div>
    </div>
  );
}
