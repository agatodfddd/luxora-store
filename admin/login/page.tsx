"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LogIn, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) throw new Error("bad");
      router.replace(next);
    } catch {
      setErr("بيانات الدخول غير صحيحة");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="lux-card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">تسجيل دخول الإدارة</h1>
            <p className="mt-1 text-sm text-white/60">أدخل اسم المستخدم وكلمة المرور للمتابعة.</p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="lux-label">اسم المستخدم</label>
            <input className="lux-input" value={username} onChange={(e)=>setUsername(e.target.value)} placeholder="admin" required />
          </div>
          <div>
            <label className="lux-label">كلمة المرور</label>
            <input className="lux-input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="••••••••" required />
          </div>

          {err && <div className="text-sm text-red-300">{err}</div>}

          <button className="lux-btn-gold shine w-full" type="submit" disabled={busy}>
            <LogIn className="h-4 w-4" />
            {busy ? "جارٍ الدخول..." : "دخول"}
          </button>

          <p className="text-xs text-white/45">
            ملاحظة: هذا نظام بسيط للبداية. للإنتاج يمكننا إضافة تسجيل دخول حقيقي بصلاحيات متعددة.
          </p>
        </form>
      </div>
    </div>
  );
}
