"use client";

import Link from "next/link";
import { useCart, clearCart } from "@/lib/cart";
import { formatMoney } from "@/lib/money";
import { useEffect, useMemo, useState } from "react";
import { Country, State, City } from "country-state-city";

type PaymentMethod = "paypal" | "cod" | "bank" | "card";

export default function CheckoutPage() {
  const { items, total } = useCart();

  // shipping
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");

  // geo
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [countryIso, setCountryIso] = useState("MA"); // Morocco default
  const states = useMemo(() => State.getStatesOfCountry(countryIso), [countryIso]);
  const [stateIso, setStateIso] = useState<string>("");

  const cities = useMemo(() => {
    // city-state-city expects state isoCode for cities
    if (!stateIso) return [];
    return City.getCitiesOfState(countryIso, stateIso);
  }, [countryIso, stateIso]);

  const [cityName, setCityName] = useState("");

  useEffect(() => {
    // initialize state/city when country changes
    const s = State.getStatesOfCountry(countryIso);
    const first = s?.[0]?.isoCode ?? "";
    setStateIso(first);
  }, [countryIso]);

  useEffect(() => {
    const c = stateIso ? City.getCitiesOfState(countryIso, stateIso) : [];
    setCityName(c?.[0]?.name ?? "");
  }, [countryIso, stateIso]);

  // payment
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (items.length === 0) return;
    setBusy(true);
    setErr(null);

    try {
      const selectedCountry = countries.find((c) => c.isoCode === countryIso);
      const selectedState = states.find((s) => s.isoCode === stateIso);

      const r = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          currency: items[0]?.currency ?? "USD",
          shipping: {
            fullName,
            email,
            phone,
            country: selectedCountry?.name ?? countryIso,
            state: selectedState?.name ?? "",
            city: cityName,
            address1,
            address2,
            postalCode,
            notes,
          },
          payment: { method: payment },
        }),
      });

      if (!r.ok) throw new Error("err");
      const d = await r.json();
      const orderId = d?.order?.id ?? "";

      clearCart();
      window.location.href = `/thank-you?order=${encodeURIComponent(orderId)}`;
    } catch {
      setErr("فشل إنشاء الطلب. تأكد من المعلومات وحاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="lux-card p-10 text-center">
        <div className="text-white/70">لا توجد منتجات في السلة.</div>
        <div className="mt-4">
          <Link className="lux-btn-gold shine" href="/shop">اذهب للمتجر</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="lux-card p-6">
        <h1 className="text-2xl font-semibold">إتمام الشراء</h1>
        <p className="mt-1 text-sm text-white/60">أدخل معلومات الشحن واختر طريقة الدفع.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lux-card p-5 lg:col-span-2 space-y-4">
          <div className="text-lg font-semibold">معلومات الشحن</div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lux-label">الاسم الكامل</label>
              <input className="lux-input" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
            </div>
            <div>
              <label className="lux-label">رقم الهاتف</label>
              <input className="lux-input" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+212..." required />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lux-label">البريد الإلكتروني</label>
              <input className="lux-input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="name@email.com" required />
            </div>
            <div>
              <label className="lux-label">الرمز البريدي (اختياري)</label>
              <input className="lux-input" value={postalCode} onChange={(e)=>setPostalCode(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="lux-label">الدولة</label>
              <select className="lux-input" value={countryIso} onChange={(e)=>setCountryIso(e.target.value)}>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="lux-label">الولاية / الإقليم</label>
              {states.length > 0 ? (
                <select className="lux-input" value={stateIso} onChange={(e)=>setStateIso(e.target.value)}>
                  {states.map((s) => (
                    <option key={s.isoCode} value={s.isoCode}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <input className="lux-input" value={stateIso} onChange={(e)=>setStateIso(e.target.value)} placeholder="اكتب الإقليم" />
              )}
            </div>

            <div>
              <label className="lux-label">المدينة</label>
              {cities.length > 0 ? (
                <select className="lux-input" value={cityName} onChange={(e)=>setCityName(e.target.value)}>
                  {cities.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input className="lux-input" value={cityName} onChange={(e)=>setCityName(e.target.value)} placeholder="اكتب المدينة" />
              )}
            </div>
          </div>

          <div>
            <label className="lux-label">العنوان</label>
            <input className="lux-input" value={address1} onChange={(e)=>setAddress1(e.target.value)} placeholder="الحي، الشارع، رقم المنزل..." required />
          </div>
          <div>
            <label className="lux-label">عنوان إضافي (اختياري)</label>
            <input className="lux-input" value={address2} onChange={(e)=>setAddress2(e.target.value)} placeholder="شقة، طابق..." />
          </div>

          <div>
            <label className="lux-label">ملاحظات (اختياري)</label>
            <textarea className="lux-input min-h-[110px]" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="معلومة تساعدنا في التوصيل..." />
          </div>

          <div className="lux-divider" />

          <div className="text-lg font-semibold">طريقة الدفع</div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="lux-card p-4 cursor-pointer hover:bg-white/5 transition">
              <input type="radio" name="pay" className="ml-2" checked={payment==="paypal"} onChange={()=>setPayment("paypal")} />
              <span className="font-medium">PayPal</span>
              <div className="mt-1 text-xs text-white/55">دفع سريع وآمن عبر بايبال.</div>
            </label>

            <label className="lux-card p-4 cursor-pointer hover:bg-white/5 transition">
              <input type="radio" name="pay" className="ml-2" checked={payment==="card"} onChange={()=>setPayment("card")} />
              <span className="font-medium">بطاقة (Visa/Mastercard)</span>
              <div className="mt-1 text-xs text-white/55">سنربط بوابة الدفع لاحقًا.</div>
            </label>

            <label className="lux-card p-4 cursor-pointer hover:bg-white/5 transition">
              <input type="radio" name="pay" className="ml-2" checked={payment==="cod"} onChange={()=>setPayment("cod")} />
              <span className="font-medium">الدفع عند الاستلام</span>
              <div className="mt-1 text-xs text-white/55">ادفع عند وصول الطلب.</div>
            </label>

            <label className="lux-card p-4 cursor-pointer hover:bg-white/5 transition">
              <input type="radio" name="pay" className="ml-2" checked={payment==="bank"} onChange={()=>setPayment("bank")} />
              <span className="font-medium">تحويل بنكي</span>
              <div className="mt-1 text-xs text-white/55">سنرسل لك بيانات التحويل بعد التأكيد.</div>
            </label>
          </div>

          {err && <div className="text-sm text-red-300">{err}</div>}

          <div className="flex items-center justify-between pt-2">
            <Link href="/cart" className="lux-btn-ghost">رجوع للسلة</Link>
            <button className="lux-btn-gold shine" onClick={submit} disabled={busy}>
              {busy ? "جارٍ إنشاء الطلب..." : "تأكيد الطلب"}
            </button>
          </div>
        </div>

        <div className="lux-card p-5">
          <div className="text-lg font-semibold">ملخّص الطلب</div>
          <div className="mt-4 space-y-3 text-sm text-white/70">
            {items.map((it) => (
              <div key={it.id} className="flex items-center justify-between gap-2">
                <span className="line-clamp-1">{it.name} × {it.qty}</span>
                <span className="text-white/90">{formatMoney(it.price * it.qty, it.currency)}</span>
              </div>
            ))}
            <div className="lux-divider my-3" />
            <div className="flex items-center justify-between text-base">
              <span className="text-white/80">الإجمالي</span>
              <span className="font-semibold text-gold">{formatMoney(total, items[0]?.currency ?? "USD")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
