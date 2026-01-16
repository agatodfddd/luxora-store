"use client";

import { useState } from "react";
import { Mail, Phone, Send } from "lucide-react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (!r.ok) throw new Error("err");
      setName(""); setEmail(""); setSubject(""); setMessage("");
      setMsg("تم إرسال رسالتك ✅ سنرد عليك قريبًا.");
    } catch {
      setMsg("تعذّر إرسال الرسالة. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lux-card p-6 lg:col-span-2">
        <h1 className="text-2xl font-semibold">اتصل بنا</h1>
        <p className="mt-1 text-sm text-white/60">أرسل رسالة وسنرد عليك في أسرع وقت.</p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="lux-label">الاسم</label>
              <input className="lux-input" value={name} onChange={(e)=>setName(e.target.value)} required />
            </div>
            <div>
              <label className="lux-label">البريد الإلكتروني</label>
              <input className="lux-input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
            </div>
          </div>

          <div>
            <label className="lux-label">الموضوع (اختياري)</label>
            <input className="lux-input" value={subject} onChange={(e)=>setSubject(e.target.value)} />
          </div>

          <div>
            <label className="lux-label">الرسالة</label>
            <textarea className="lux-input min-h-[160px]" value={message} onChange={(e)=>setMessage(e.target.value)} required />
          </div>

          {msg && <div className={"text-sm " + (msg.includes("✅") ? "text-gold" : "text-red-300")}>{msg}</div>}

          <button className="lux-btn-gold shine" type="submit" disabled={busy}>
            <Send className="h-4 w-4" />
            {busy ? "جارٍ الإرسال..." : "إرسال"}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <div className="lux-card p-6">
          <div className="flex items-center gap-2 text-white/85">
            <Mail className="h-4 w-4 text-gold" />
            البريد
          </div>
          <div className="mt-2 text-sm text-white/60">moadsabr6@gmail.com</div>
        </div>

        <div className="lux-card p-6">
          <div className="flex items-center gap-2 text-white/85">
            <Phone className="h-4 w-4 text-gold" />
            الهاتف
          </div>
          <div className="mt-2 text-sm text-white/60">+21999999999</div>
        </div>

        <div className="lux-card p-6">
          <div className="text-white/85">أوقات الرد</div>
          <div className="mt-2 text-sm text-white/60">عادةً خلال 24 ساعة.</div>
        </div>
      </div>
    </div>
  );
}
