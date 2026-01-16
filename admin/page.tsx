"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Product } from "@/lib/types";
import {
  Trash2, Pencil, Plus, LogOut, LayoutDashboard, Package, Image as ImageIcon,
  ClipboardList, RotateCcw, Save, RefreshCw, Mail, LifeBuoy,
  Layers,
  Percent, CreditCard, Truck
} from "lucide-react";

type Draft = Omit<Product, "id">;

type Hero = {
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
};

type Order = {
  id: string;
  createdAt: string;
  status: "new" | "processing" | "shipped" | "completed" | "cancelled" | "return_requested" | "refunded";
  total: number;
  currency: string;
  shipping: { fullName: string; phone: string; email: string; country: string; state?: string; city: string; address1: string };
  items: { name: string; qty: number }[];
  payment: { method: string };
};

type ContactMessage = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "archived";
};

type Ticket = {
  id: string;
  createdAt: string;
  status: "open" | "pending" | "resolved" | "closed";
  name: string;
  email: string;
  phone?: string;
  topic: "order" | "product" | "return" | "shipping" | "other";
  orderId?: string;
  message: string;
  notes?: string;
};

type ReturnRequest = {
  id: string;
  createdAt: string;
  status: "requested" | "approved" | "rejected" | "received" | "refunded";
  name: string;
  phone: string;
  email: string;
  orderId?: string;
  reason: "size" | "damaged" | "wrong_item" | "changed_mind" | "other";
  details?: string;
};

type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  amount: number;
  active: boolean;
  minSubtotal?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
};

type PaymentSettings = {
  paypal: { enabled: boolean; clientId: string };
  stripe: { enabled: boolean; publishableKey: string };
  cod: { enabled: boolean };
  bank: { enabled: boolean; instructions: string };
};

type ShippingZone = {
  id: string;
  name: string;
  countries: string[];
  base: number;
  perItem: number;
  freeOver: number;
};

type ShippingSettings = {
  currency: string;
  zones: ShippingZone[];
};

const TABS = [
  { key: "dashboard", label: "الرئيسية", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "categories", label: "الأقسام", icon: <Layers className="h-4 w-4" /> },
  { key: "products", label: "المنتجات", icon: <Package className="h-4 w-4" /> },
  { key: "editor", label: "تعديل الموقع", icon: <ImageIcon className="h-4 w-4" /> },
  { key: "orders", label: "الطلبات", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "returns", label: "الإرجاع والاسترداد", icon: <RotateCcw className="h-4 w-4" /> },
  { key: "messages", label: "رسائل اتصل بنا", icon: <Mail className="h-4 w-4" /> },
  { key: "support", label: "الدعم والشكاوى", icon: <LifeBuoy className="h-4 w-4" /> },
  { key: "coupons", label: "كوبونات/خصومات", icon: <Percent className="h-4 w-4" /> },
  { key: "payments", label: "إعدادات الدفع", icon: <CreditCard className="h-4 w-4" /> },
  { key: "shipping", label: "إعدادات الشحن", icon: <Truck className="h-4 w-4" /> },
];

function emptyDraft(defaultCategory: string = "clothing"): Draft {
  return {
    name: "",
    slug: "",
    category: defaultCategory,
    price: 0,
    currency: "USD",
    description: "",
    images: [],
    featured: false,
    stock: 0,
  };
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read_error"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

function chip(text: string) {
  return <span className="lux-chip border-gold/20 text-gold">{text}</span>;
}

export default function AdminPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const tab = (sp.get("tab") ?? "dashboard") as string;

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toast = (t: string) => { setToastMsg(t); setTimeout(() => setToastMsg(null), 2200); };
  const go = (k: string) => router.replace(`/admin?tab=${k}`);
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const Header = ({ title, desc, actions }: { title: string; desc: string; actions?: React.ReactNode }) => (
    <div className="lux-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-[color:var(--lux-mutedtext)]">{desc}</p>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {toastMsg && <div className="mt-4 text-sm text-gold">{toastMsg}</div>}
    </div>
  );

  // ====== CATEGORIES ======
  type Cat = {
    id: string;
    nameAr: string;
    nameEn: string;
    descriptionAr?: string;
    descriptionEn?: string;
    image: string;
    productIds: string[];
    order: number;
  };

  const [categories, setCategories] = useState<Cat[]>([]);
  const loadCategories = async () => {
    const r = await fetch("/api/categories");
    const d = await r.json();
    setCategories((d.categories ?? []) as Cat[]);
  };
  useEffect(() => { loadCategories(); }, []);

  // ====== PRODUCTS ======
  const [products, setProducts] = useState<Product[]>([]);
  const [pq, setPq] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());

  const loadProducts = async () => {
    const r = await fetch("/api/products");
    const d = await r.json();
    setProducts(d.products as Product[]);
  };
  useEffect(() => { loadProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const s = pq.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => (p.name + " " + p.description + " " + p.category).toLowerCase().includes(s));
  }, [products, pq]);

  const startCreate = () => { setEditing(null); setDraft(emptyDraft(categories[0]?.id ?? "clothing")); };
  const startEdit = (p: Product) => { setEditing(p); const { id, ...rest } = p; setDraft(rest); };

  const saveProduct = async () => {
    setBusy(true);
    try {
      if (editing) {
        const r = await fetch(`/api/products/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!r.ok) throw new Error("Error");
        toast("تم التعديل");
      } else {
        const r = await fetch(`/api/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
        if (!r.ok) throw new Error("Error");
        toast("تمت الإضافة");
      }
      await loadProducts();
      startCreate();
    } catch {
      toast("فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  const delProduct = async (id: string) => {
    if (!confirm("حذف المنتج؟")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Error");
      toast("تم الحذف");
      await loadProducts();
    } catch {
      toast("فشل الحذف");
    } finally {
      setBusy(false);
    }
  };

  // ====== LANDING ======
  const [hero, setHero] = useState<Hero | null>(null);
  const [theme, setTheme] = useState<any | null>(null);
  const loadSettings = async () => {
    const r = await fetch("/api/settings");
    const d = await r.json();
    setHero(d.settings.hero as Hero);
    setTheme((d.settings as any).theme ?? null);
  };
  useEffect(() => { if (tab === "editor" && !hero) loadSettings(); }, [tab]); // eslint-disable-line

  const saveSettings = async () => {
    if (!hero) return;
    setBusy(true);
    try {
      const r = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hero, theme }) });
      if (!r.ok) throw new Error("err");
      toast("تم حفظ الواجهة");
    } catch {
      toast("فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  // ====== ORDERS ======
  const [orders, setOrders] = useState<Order[]>([]);
  const [oq, setOq] = useState("");
  const loadOrders = async () => {
    const r = await fetch("/api/orders");
    const d = await r.json();
    setOrders((d.orders ?? []) as Order[]);
  };
  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = useMemo(() => {
    const s = oq.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) => (o.id + " " + o.shipping.fullName + " " + o.shipping.phone + " " + o.shipping.country + " " + (o.shipping.state ?? "") + " " + o.shipping.city).toLowerCase().includes(s));
  }, [orders, oq]);

  const setOrderStatus = async (id: string, status: Order["status"]) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/orders/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error("err");
      toast("تم تحديث الحالة");
      await loadOrders();
    } catch {
      toast("فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  // ====== RETURN REQUESTS ======
  const [returnReqs, setReturnReqs] = useState<ReturnRequest[]>([]);
  const [rq, setRq] = useState("");
  const loadReturnReqs = async () => {
    const r = await fetch("/api/admin/returns");
    const d = await r.json();
    setReturnReqs((d.returns ?? []) as ReturnRequest[]);
  };
  useEffect(() => { loadReturnReqs(); }, []);

  const filteredReturns = useMemo(() => {
    const s = rq.trim().toLowerCase();
    if (!s) return returnReqs;
    return returnReqs.filter((r) => (r.id + " " + r.name + " " + r.phone + " " + r.email + " " + (r.orderId ?? "")).toLowerCase().includes(s));
  }, [returnReqs, rq]);

  const setReturnStatus = async (id: string, status: ReturnRequest["status"]) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/returns/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error("err");
      toast("تم تحديث الإرجاع");
      await loadReturnReqs();
    } catch {
      toast("فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  // ====== CONTACT MESSAGES ======
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [mq, setMq] = useState("");
  const loadMessages = async () => {
    const r = await fetch("/api/admin/messages");
    const d = await r.json();
    setMessages((d.messages ?? []) as ContactMessage[]);
  };
  useEffect(() => { loadMessages(); }, []);

  const filteredMessages = useMemo(() => {
    const s = mq.trim().toLowerCase();
    if (!s) return messages;
    return messages.filter((m) => (m.name + " " + m.email + " " + (m.subject ?? "") + " " + m.message).toLowerCase().includes(s));
  }, [messages, mq]);

  const setMessageStatus = async (id: string, status: ContactMessage["status"]) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/messages/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error("err");
      toast("تم تحديث الرسالة");
      await loadMessages();
    } catch {
      toast("فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  // ====== SUPPORT TICKETS ======
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tq, setTq] = useState("");
  const loadTickets = async () => {
    const r = await fetch("/api/admin/tickets");
    const d = await r.json();
    setTickets((d.tickets ?? []) as Ticket[]);
  };
  useEffect(() => { loadTickets(); }, []);

  const filteredTickets = useMemo(() => {
    const s = tq.trim().toLowerCase();
    if (!s) return tickets;
    return tickets.filter((t) => (t.id + " " + t.name + " " + t.email + " " + (t.orderId ?? "") + " " + t.message).toLowerCase().includes(s));
  }, [tickets, tq]);

  const updateTicket = async (id: string, patch: Partial<Ticket>) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/tickets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      if (!r.ok) throw new Error("err");
      toast("تم تحديث التذكرة");
      await loadTickets();
    } catch {
      toast("فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  // ====== COUPONS ======
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [cq, setCq] = useState("");
  const loadCoupons = async () => {
    const r = await fetch("/api/admin/coupons");
    const d = await r.json();
    setCoupons((d.coupons ?? []) as Coupon[]);
  };
  useEffect(() => { loadCoupons(); }, []);

  const filteredCoupons = useMemo(() => {
    const s = cq.trim().toUpperCase();
    if (!s) return coupons;
    return coupons.filter((c) => c.code.includes(s));
  }, [coupons, cq]);

  const [cForm, setCForm] = useState({ code: "", type: "percent" as Coupon["type"], amount: 10, active: true, minSubtotal: 0, maxUses: 0, expiresAt: "" });

  const createCoupon = async () => {
    if (!cForm.code.trim()) return toast("أدخل الكود");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cForm) });
      if (!r.ok) throw new Error("err");
      toast("تم إنشاء الكوبون");
      setCForm({ code: "", type: "percent", amount: 10, active: true, minSubtotal: 0, maxUses: 0, expiresAt: "" });
      await loadCoupons();
    } catch {
      toast("فشل إنشاء الكوبون");
    } finally {
      setBusy(false);
    }
  };

  const toggleCoupon = async (c: Coupon) => {
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/coupons/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !c.active }) });
      if (!r.ok) throw new Error("err");
      toast("تم تحديث الكوبون");
      await loadCoupons();
    } catch {
      toast("فشل التحديث");
    } finally {
      setBusy(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("حذف الكوبون؟")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("err");
      toast("تم حذف الكوبون");
      await loadCoupons();
    } catch {
      toast("فشل الحذف");
    } finally {
      setBusy(false);
    }
  };

  // ====== PAYMENTS ======
  const [payments, setPayments] = useState<PaymentSettings | null>(null);
  const loadPayments = async () => {
    const r = await fetch("/api/admin/payments");
    const d = await r.json();
    setPayments(d.payments as PaymentSettings);
  };
  useEffect(() => { loadPayments(); }, []);

  const savePayments = async () => {
    if (!payments) return;
    setBusy(true);
    try {
      const r = await fetch("/api/admin/payments", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payments) });
      if (!r.ok) throw new Error("err");
      toast("تم حفظ الدفع");
    } catch {
      toast("فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  // ====== SHIPPING ======
  const [shipping, setShipping] = useState<ShippingSettings | null>(null);
  const [shippingJson, setShippingJson] = useState("");
  const loadShipping = async () => {
    const r = await fetch("/api/admin/shipping");
    const d = await r.json();
    setShipping(d.shipping as ShippingSettings);
    setShippingJson(JSON.stringify(d.shipping, null, 2));
  };
  useEffect(() => { loadShipping(); }, []);

  const saveShipping = async () => {
    setBusy(true);
    try {
      const parsed = JSON.parse(shippingJson) as ShippingSettings;
      const r = await fetch("/api/admin/shipping", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      if (!r.ok) throw new Error("err");
      setShipping(parsed);
      toast("تم حفظ الشحن");
    } catch {
      toast("JSON غير صحيح أو فشل الحفظ");
    } finally {
      setBusy(false);
    }
  };

  // ====== CATEGORIES UI ======
  const addCategory = () => {
    const nextN = (categories?.length ?? 0) + 1;
    setCategories([
      ...categories,
      {
        id: `category-${nextN}`,
        nameAr: `قسم جديد ${nextN}`,
        nameEn: `New Category ${nextN}`,
        descriptionAr: "",
        descriptionEn: "",
        image: "/collections/clothing.svg",
        productIds: [],
        order: nextN,
      },
    ]);
  };

  const saveCategories = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });
      if (!r.ok) throw new Error("err");
      toast("تم حفظ الأقسام");
      await loadCategories();
    } catch {
      toast("فشل حفظ الأقسام");
    } finally {
      setBusy(false);
    }
  };

  const uploadImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (!r.ok) throw new Error("upload");
    const d = await r.json();
    return d.url as string;
  };

  const Categories = () => (
    <div className="space-y-6">
      <Header
        title="الأقسام / Categories"
        desc="تعديل الأقسام وصورها وربطها بالمنتجات. (حفظ بزر واحد)"
        actions={
          <>
            <button className="lux-btn-gold shine" onClick={saveCategories} disabled={busy}><Save className="h-4 w-4" /> حفظ</button>
            <button className="lux-btn-ghost" onClick={addCategory}><Plus className="h-4 w-4" /> إضافة قسم</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lux-card p-5">
          <div className="text-lg font-semibold">قائمة الأقسام</div>
          <p className="mt-2 text-sm text-[color:var(--lux-mutedtext)]">نصيحة: اجعل ID بسيطًا بالإنجليزية (مثال: clothing).</p>

          <div className="mt-4 space-y-4">
            {categories
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c, idx) => (
                <div key={c.id + idx} className="rounded-3xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gold">{c.nameAr || c.nameEn || c.id}</div>
                    <button
                      type="button"
                      className="lux-btn-ghost"
                      onClick={() => setCategories(categories.filter((x, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" /> حذف
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="lux-label">ID (slug)</label>
                      <input className="lux-input" value={c.id} onChange={(e) => {
                        const v = e.target.value.toLowerCase().replace(/\s+/g, "-");
                        setCategories(categories.map((x, i) => i === idx ? { ...x, id: v } : x));
                      }} />
                    </div>
                    <div>
                      <label className="lux-label">الترتيب</label>
                      <input className="lux-input" type="number" value={c.order ?? idx + 1} onChange={(e) => {
                        const v = Number(e.target.value);
                        setCategories(categories.map((x, i) => i === idx ? { ...x, order: v } : x));
                      }} />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="lux-label">اسم عربي</label>
                      <input className="lux-input" value={c.nameAr} onChange={(e) => setCategories(categories.map((x,i)=> i===idx?{...x,nameAr:e.target.value}:x))} />
                    </div>
                    <div>
                      <label className="lux-label">English Name</label>
                      <input className="lux-input" value={c.nameEn} onChange={(e) => setCategories(categories.map((x,i)=> i===idx?{...x,nameEn:e.target.value}:x))} />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="lux-label">وصف عربي</label>
                      <input className="lux-input" value={c.descriptionAr ?? ""} onChange={(e) => setCategories(categories.map((x,i)=> i===idx?{...x,descriptionAr:e.target.value}:x))} />
                    </div>
                    <div>
                      <label className="lux-label">English Description</label>
                      <input className="lux-input" value={c.descriptionEn ?? ""} onChange={(e) => setCategories(categories.map((x,i)=> i===idx?{...x,descriptionEn:e.target.value}:x))} />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="lux-label">صورة القسم (رفع من الجهاز)</label>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="lux-chip border-gold/20 text-[color:var(--lux-mutedtext)]">{c.image || "/uploads/..."}</div>
                      <label className="lux-btn-ghost cursor-pointer">
                        رفع صورة
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const url = await uploadImage(f);
                              setCategories(categories.map((x,i)=> i===idx?{...x,image:url}:x));
                              toast("تم رفع الصورة");
                            } catch {
                              toast("فشل رفع الصورة");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}

            {categories.length === 0 && <div className="text-sm text-[color:var(--lux-mutedtext)]">لا توجد أقسام.</div>}
          </div>
        </div>

        <div className="lux-card p-5">
          <div className="text-lg font-semibold">ربط المنتجات بالأقسام</div>
          <p className="mt-2 text-sm text-[color:var(--lux-mutedtext)]">
            الطريقة الأبسط: عدّل كل منتج واختر فئته، أو استخدم هذا الملخص.
          </p>

          <div className="mt-4 space-y-4">
            {categories
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((c) => {
                const list = products.filter((p) => (p.category || "").toLowerCase() === c.id);
                return (
                  <div key={c.id} className="rounded-3xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">{c.nameAr} <span className="opacity-60">/ {c.nameEn}</span></div>
                      <div className="lux-chip">{list.length} products</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {list.slice(0, 6).map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm">
                          <div className="truncate">{p.name}</div>
                          <div className="text-[color:var(--lux-mutedtext)]">{p.price} {p.currency}</div>
                        </div>
                      ))}
                      {list.length === 0 && <div className="text-sm text-[color:var(--lux-mutedtext)]">لا يوجد منتجات هنا بعد.</div>}
                      {list.length > 6 && <div className="text-xs text-[color:var(--lux-mutedtext)]">+{list.length - 6} المزيد...</div>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  // ====== DASHBOARD COUNTS ======
  const counts = useMemo(() => {
    const newOrders = orders.filter(o => o.status === "new").length;
    const processing = orders.filter(o => o.status === "processing").length;
    const newMessages = messages.filter(m => m.status === "new").length;
    const openTickets = tickets.filter(t => t.status === "open").length;
    const returnRequests = returnReqs.filter(r => r.status === "requested").length;
    return { newOrders, processing, newMessages, openTickets, returnRequests };
  }, [orders, messages, tickets, returnReqs]);

  const Dashboard = () => (
    <div className="space-y-6">
      <Header
        title="لوحة الإدارة الذكية"
        desc="كل شيء في مكان واحد — وبترتيب منطقي: محتوى → متجر → طلبات → دعم → إعدادات."
        actions={
          <>
            <button
              className="lux-btn-ghost"
              onClick={() => { loadProducts(); loadOrders(); loadMessages(); loadTickets(); loadReturnReqs(); loadCoupons(); loadPayments(); loadShipping(); toast("تم التحديث"); }}
              disabled={busy}
            >
              <RefreshCw className="h-4 w-4" /> تحديث شامل
            </button>
            <button className="lux-btn-ghost" onClick={logout}>
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-5">
        <div className="lux-card p-5">
          <div className="text-sm text-[color:var(--lux-mutedtext)]">عدد المنتجات</div>
          <div className="mt-2 text-3xl font-semibold text-gold">{products.length}</div>
        </div>
        <div className="lux-card p-5">
          <div className="text-sm text-[color:var(--lux-mutedtext)]">طلبات جديدة</div>
          <div className="mt-2 text-3xl font-semibold text-gold">{counts.newOrders}</div>
        </div>
        <div className="lux-card p-5">
          <div className="text-sm text-[color:var(--lux-mutedtext)]">قيد التجهيز</div>
          <div className="mt-2 text-3xl font-semibold text-gold">{counts.processing}</div>
        </div>
        <div className="lux-card p-5">
          <div className="text-sm text-[color:var(--lux-mutedtext)]">رسائل جديدة</div>
          <div className="mt-2 text-3xl font-semibold text-gold">{counts.newMessages}</div>
        </div>
        <div className="lux-card p-5">
          <div className="text-sm text-[color:var(--lux-mutedtext)]">تذاكر مفتوحة</div>
          <div className="mt-2 text-3xl font-semibold text-gold">{counts.openTickets}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="lux-card p-5">
          <div className="text-lg font-semibold">أقسام ذكية</div>
          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm text-[color:var(--lux-fg)]/65">
            <li>المحتوى: <span className="text-gold">Landing</span> للتحكم في الصفحة الرئيسية.</li>
            <li>المتجر: <span className="text-gold">المنتجات</span> للتحكم في المنتجات والصور.</li>
            <li>العمليات: <span className="text-gold">الطلبات</span> + <span className="text-gold">الإرجاع</span>.</li>
            <li>التواصل: <span className="text-gold">رسائل اتصل بنا</span> + <span className="text-gold">الدعم</span>.</li>
            <li>الإعدادات: <span className="text-gold">الدفع</span> + <span className="text-gold">الشحن</span> + <span className="text-gold">الكوبونات</span>.</li>
          </ul>
        </div>

        <div className="lux-card p-5">
          <div className="text-lg font-semibold">تنبيهات الآن</div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
              <div>طلبات إرجاع جديدة</div>
              {chip(String(counts.returnRequests))}
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
              <div>رسائل “اتصل بنا” الجديدة</div>
              {chip(String(counts.newMessages))}
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
              <div>تذاكر دعم مفتوحة</div>
              {chip(String(counts.openTickets))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const Products = () => (
    <div className="space-y-6">
      <Header
        title="المنتجات"
        desc="إضافة/تعديل/حذف المنتجات وتحديث الصور."
        actions={
          <>
            <input className="lux-input w-56" placeholder="بحث..." value={pq} onChange={(e)=>setPq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={startCreate}><Plus className="h-4 w-4" /> جديد</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lux-card p-5 lg:col-span-3">
          <div className="space-y-3">
            {filteredProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images?.[0]} alt={p.name} className="h-14 w-14 rounded-xl object-cover" />
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-[color:var(--lux-mutedtext)]">{p.category} • {p.price} {p.currency}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="lux-btn-ghost" onClick={() => startEdit(p)} title="تعديل">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="lux-btn-ghost" onClick={() => delProduct(p.id)} title="حذف" disabled={busy}>
                    <Trash2 className="h-4 w-4 text-red-300" />
                  </button>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && <div className="text-sm text-[color:var(--lux-mutedtext)]">لا يوجد منتجات.</div>}
          </div>
        </div>

        <div className="lux-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">{editing ? "تعديل منتج" : "إضافة منتج"}</div>
            {editing && <div className="lux-chip border-gold/20 text-gold">{editing.id}</div>}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="lux-label">الاسم</label>
              <input className="lux-input" value={draft.name} onChange={(e)=>setDraft({...draft, name:e.target.value})} />
            </div>

            <div>
              <label className="lux-label">Slug (اختياري)</label>
              <input className="lux-input" value={draft.slug} onChange={(e)=>setDraft({...draft, slug:e.target.value})} placeholder="noir-silk-shirt" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lux-label">الفئة</label>
                <select className="lux-input" value={draft.category} onChange={(e)=>setDraft({...draft, category:e.target.value})}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.nameEn} / {c.nameAr}</option>
                  ))}
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="lux-label">المخزون</label>
                <input className="lux-input" type="number" value={draft.stock ?? 0} onChange={(e)=>setDraft({...draft, stock:Number(e.target.value)})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lux-label">السعر</label>
                <input className="lux-input" type="number" value={draft.price} onChange={(e)=>setDraft({...draft, price:Number(e.target.value)})} />
              </div>
              <div>
                <label className="lux-label">العملة</label>
                <input className="lux-input" value={draft.currency} onChange={(e)=>setDraft({...draft, currency:e.target.value})} />
              </div>
            </div>

            <div>
              <label className="lux-label">الوصف</label>
              <textarea className="lux-input min-h-[110px]" value={draft.description} onChange={(e)=>setDraft({...draft, description:e.target.value})} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="lux-label">الصور</label>
                <label className="lux-btn-ghost cursor-pointer">
                  رفع صورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await fileToDataUrl(f);
                      setDraft({ ...draft, images: [url, ...(draft.images ?? [])] });
                    }}
                  />
                </label>
              </div>

              <input
                className="lux-input"
                placeholder="أو ضع رابط صورة (URL) ثم Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = (e.currentTarget as HTMLInputElement).value.trim();
                    if (!v) return;
                    setDraft({ ...draft, images: [v, ...(draft.images ?? [])] });
                    (e.currentTarget as HTMLInputElement).value = "";
                  }
                }}
              />

              <div className="grid grid-cols-4 gap-2">
                {(draft.images ?? []).slice(0, 8).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="relative overflow-hidden rounded-xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)]"
                    onClick={() => setDraft({ ...draft, images: (draft.images ?? []).filter((_, i) => i !== idx) })}
                    title="اضغط لحذف الصورة"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="img" className="aspect-square w-full object-cover opacity-90 hover:opacity-100" />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/35 transition" />
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[color:var(--lux-mutedtext)]">
              <input type="checkbox" checked={Boolean(draft.featured)} onChange={(e)=>setDraft({...draft, featured:e.target.checked})} />
              مميز (Featured)
            </label>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button className="lux-btn-ghost" onClick={startCreate} type="button">تفريغ</button>
              <button className="lux-btn-gold shine" onClick={saveProduct} type="button" disabled={busy}>
                {editing ? "حفظ التعديل" : "إضافة المنتج"}
              </button>
            </div>

            <p className="pt-2 text-xs text-[color:var(--lux-fg)]/45">
              رفع الصور الاحترافي (Cloudinary) يمكن إضافته لاحقًا.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const Editor = () => (
    <div className="space-y-6">
      <Header
        title="تعديل الموقع (Visual Editor)"
        desc="تحكم في الألوان والخطوط والمسافات وصورة/نص الـ Landing — ثم اضغط حفظ."
        actions={
          <>
            <button className="lux-btn-gold shine" onClick={saveSettings} disabled={busy}>
              <Save className="h-4 w-4" /> حفظ
            </button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      {!hero ? (
        <div className="lux-card p-8">جارٍ التحميل...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lux-card p-5 lg:col-span-3 space-y-4">
            <div>
              <label className="lux-label">Badge</label>
              <input className="lux-input" value={hero.badge} onChange={(e)=>setHero({...hero, badge:e.target.value})} />
            </div>
            <div>
              <label className="lux-label">العنوان</label>
              <input className="lux-input" value={hero.title} onChange={(e)=>setHero({...hero, title:e.target.value})} />
            </div>
            <div>
              <label className="lux-label">النص</label>
              <textarea className="lux-input min-h-[120px]" value={hero.subtitle} onChange={(e)=>setHero({...hero, subtitle:e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lux-label">زر أساسي (نص)</label>
                <input className="lux-input" value={hero.primaryCta.label} onChange={(e)=>setHero({...hero, primaryCta:{...hero.primaryCta, label:e.target.value}})} />
              </div>
              <div>
                <label className="lux-label">زر أساسي (رابط)</label>
                <input className="lux-input" value={hero.primaryCta.href} onChange={(e)=>setHero({...hero, primaryCta:{...hero.primaryCta, href:e.target.value}})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lux-label">زر ثانوي (نص)</label>
                <input className="lux-input" value={hero.secondaryCta.label} onChange={(e)=>setHero({...hero, secondaryCta:{...hero.secondaryCta, label:e.target.value}})} />
              </div>
              <div>
                <label className="lux-label">زر ثانوي (رابط)</label>
                <input className="lux-input" value={hero.secondaryCta.href} onChange={(e)=>setHero({...hero, secondaryCta:{...hero.secondaryCta, href:e.target.value}})} />
              </div>
            </div>

            <div>
              <label className="lux-label">صورة الـ Hero (رفع من الجهاز فقط)</label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="lux-chip border-gold/20 text-[color:var(--lux-mutedtext)]">{hero.image || "/uploads/..."}</div>
                <label className="lux-btn-ghost cursor-pointer">
                  رفع صورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const url = await uploadImage(f);
                        setHero({ ...hero, image: url });
                        toast("تم رفع الصورة");
                      } catch {
                        toast("فشل رفع الصورة");
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="lux-card p-5 lg:col-span-2">
            <div className="text-lg font-semibold">معاينة</div>
            <div className="mt-4 lux-card overflow-hidden p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={hero.image} alt="preview" className="aspect-[4/3] w-full rounded-2xl object-cover" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="lux-chip border-gold/20 text-gold">{hero.badge}</div>
              <div className="text-xl font-semibold">{hero.title}</div>
              <div className="text-sm text-[color:var(--lux-mutedtext)]">{hero.subtitle}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const Orders = () => (
    <div className="space-y-6">
      <Header
        title="الطلبات"
        desc="عرض الطلبات وتغيير حالتها بسهولة."
        actions={
          <>
            <input className="lux-input w-64" placeholder="بحث..." value={oq} onChange={(e)=>setOq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={loadOrders} disabled={busy}><RefreshCw className="h-4 w-4" /> تحديث</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="space-y-3">
        {filteredOrders.map((o) => (
          <div key={o.id} className="lux-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {chip(o.status)}
                <div className="lux-chip border-[color:var(--lux-border)]">#{o.id}</div>
                <div className="text-[color:var(--lux-fg)]/80">{o.shipping.fullName}</div>
              </div>
              <div className="text-xs text-[color:var(--lux-mutedtext)]">{new Date(o.createdAt).toLocaleString()}</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="space-y-1 text-sm text-[color:var(--lux-mutedtext)]">
                <div className="text-[color:var(--lux-fg)] font-medium">العميل</div>
                <div>{o.shipping.fullName}</div>
                <div>{o.shipping.phone}</div>
                <div className="text-[color:var(--lux-mutedtext)]">{o.shipping.email}</div>
              </div>

              <div className="space-y-1 text-sm text-[color:var(--lux-mutedtext)]">
                <div className="text-[color:var(--lux-fg)] font-medium">العنوان</div>
                <div>{o.shipping.country}{o.shipping.state ? ` — ${o.shipping.state}` : ""}</div>
                <div>{o.shipping.city}</div>
                <div>{o.shipping.address1}</div>
              </div>

              <div className="space-y-1 text-sm text-[color:var(--lux-mutedtext)]">
                <div className="text-[color:var(--lux-fg)] font-medium">الطلب</div>
                <div className="text-[color:var(--lux-mutedtext)]">الدفع: {o.payment.method}</div>
                <div className="text-gold font-semibold">{o.total} {o.currency}</div>
                <div className="text-xs text-[color:var(--lux-mutedtext)]">
                  {o.items.map((it, idx) => <span key={idx}>{it.name}×{it.qty}{idx < o.items.length-1 ? " • " : ""}</span>)}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "processing")} disabled={busy}>قيد التجهيز</button>
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "shipped")} disabled={busy}>تم الشحن</button>
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "completed")} disabled={busy}>مكتمل</button>
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "cancelled")} disabled={busy}>إلغاء</button>
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "return_requested")} disabled={busy}>طلب إرجاع</button>
              <button className="lux-btn-ghost" onClick={() => setOrderStatus(o.id, "refunded")} disabled={busy}>مسترد</button>
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا يوجد طلبات.</div>}
      </div>
    </div>
  );

  const Returns = () => (
    <div className="space-y-6">
      <Header
        title="الإرجاع والاسترداد"
        desc="طلبات الإرجاع التي يرسلها العميل من الموقع + إدارة الحالة."
        actions={
          <>
            <input className="lux-input w-64" placeholder="بحث..." value={rq} onChange={(e)=>setRq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={loadReturnReqs} disabled={busy}><RefreshCw className="h-4 w-4" /> تحديث</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />
      <div className="space-y-3">
        {filteredReturns.map((r) => (
          <div key={r.id} className="lux-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {chip(r.status)}
                <div className="lux-chip border-[color:var(--lux-border)]">#{r.id}</div>
                <div className="text-[color:var(--lux-fg)]/80">{r.name}</div>
              </div>
              <div className="text-xs text-[color:var(--lux-mutedtext)]">{new Date(r.createdAt).toLocaleString()}</div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-[color:var(--lux-mutedtext)]">
              <div>
                <div className="text-[color:var(--lux-fg)] font-medium">التواصل</div>
                <div>{r.phone}</div>
                <div className="text-[color:var(--lux-mutedtext)]">{r.email}</div>
              </div>
              <div>
                <div className="text-[color:var(--lux-fg)] font-medium">السبب</div>
                <div>{r.reason}</div>
                <div className="text-[color:var(--lux-mutedtext)]">Order: {r.orderId || "—"}</div>
              </div>
              <div>
                <div className="text-[color:var(--lux-fg)] font-medium">تفاصيل</div>
                <div className="text-[color:var(--lux-mutedtext)]">{r.details || "—"}</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="lux-btn-ghost" onClick={() => setReturnStatus(r.id, "approved")} disabled={busy}>موافق</button>
              <button className="lux-btn-ghost" onClick={() => setReturnStatus(r.id, "rejected")} disabled={busy}>مرفوض</button>
              <button className="lux-btn-ghost" onClick={() => setReturnStatus(r.id, "received")} disabled={busy}>تم الاستلام</button>
              <button className="lux-btn-ghost" onClick={() => setReturnStatus(r.id, "refunded")} disabled={busy}>تم الاسترداد</button>
            </div>
          </div>
        ))}
        {filteredReturns.length === 0 && <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد طلبات إرجاع.</div>}
      </div>
    </div>
  );

  const Messages = () => (
    <div className="space-y-6">
      <Header
        title="رسائل اتصل بنا"
        desc="كل رسالة يرسلها العميل من صفحة اتصل بنا تُحفظ هنا."
        actions={
          <>
            <input className="lux-input w-64" placeholder="بحث..." value={mq} onChange={(e)=>setMq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={loadMessages} disabled={busy}><RefreshCw className="h-4 w-4" /> تحديث</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="space-y-3">
        {filteredMessages.map((m) => (
          <div key={m.id} className="lux-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {chip(m.status)}
                <div className="lux-chip border-[color:var(--lux-border)]">#{m.id}</div>
                <div className="text-[color:var(--lux-fg)]/80">{m.name}</div>
                <div className="text-[color:var(--lux-mutedtext)]">{m.email}</div>
              </div>
              <div className="text-xs text-[color:var(--lux-mutedtext)]">{new Date(m.createdAt).toLocaleString()}</div>
            </div>

            <div className="mt-3 rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3 text-sm text-[color:var(--lux-mutedtext)] whitespace-pre-wrap">
              <div className="text-[color:var(--lux-fg)] font-medium">{m.subject || "بدون عنوان"}</div>
              <div className="mt-2">{m.message}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="lux-btn-ghost" onClick={() => setMessageStatus(m.id, "read")} disabled={busy}>قراءة</button>
              <button className="lux-btn-ghost" onClick={() => setMessageStatus(m.id, "archived")} disabled={busy}>أرشفة</button>
              <button className="lux-btn-ghost" onClick={() => setMessageStatus(m.id, "new")} disabled={busy}>جديد</button>
            </div>
          </div>
        ))}
        {filteredMessages.length === 0 && <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد رسائل.</div>}
      </div>
    </div>
  );

  const Support = () => (
    <div className="space-y-6">
      <Header
        title="الدعم والشكاوى"
        desc="التذاكر التي يرسلها العملاء من صفحة الدعم."
        actions={
          <>
            <input className="lux-input w-64" placeholder="بحث..." value={tq} onChange={(e)=>setTq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={loadTickets} disabled={busy}><RefreshCw className="h-4 w-4" /> تحديث</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="space-y-3">
        {filteredTickets.map((t) => (
          <div key={t.id} className="lux-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {chip(t.status)}
                <div className="lux-chip border-[color:var(--lux-border)]">#{t.id}</div>
                <div className="text-[color:var(--lux-fg)]/80">{t.name}</div>
                <div className="text-[color:var(--lux-mutedtext)]">{t.email}</div>
              </div>
              <div className="text-xs text-[color:var(--lux-mutedtext)]">{new Date(t.createdAt).toLocaleString()}</div>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-3 text-sm text-[color:var(--lux-mutedtext)]">
              <div>
                <div className="text-[color:var(--lux-fg)] font-medium">الموضوع</div>
                <div>{t.topic}</div>
                <div className="text-[color:var(--lux-mutedtext)]">Order: {t.orderId || "—"}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-[color:var(--lux-fg)] font-medium">الرسالة</div>
                <div className="mt-1 whitespace-pre-wrap text-[color:var(--lux-fg)]/65">{t.message}</div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="lux-label">ملاحظات داخلية (لا تظهر للعميل)</label>
                <textarea
                  className="lux-input min-h-[90px]"
                  defaultValue={t.notes || ""}
                  onBlur={(e) => updateTicket(t.id, { notes: e.target.value })}
                />
              </div>
              <div>
                <label className="lux-label">الحالة</label>
                <select className="lux-input" value={t.status} onChange={(e)=>updateTicket(t.id, { status: e.target.value as any })}>
                  <option value="open">مفتوح</option>
                  <option value="pending">قيد المتابعة</option>
                  <option value="resolved">تم الحل</option>
                  <option value="closed">مغلق</option>
                </select>

                <div className="mt-3 text-xs text-[color:var(--lux-mutedtext)]">
                  هاتف: {t.phone || "—"}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && <div className="lux-card p-10 text-center text-[color:var(--lux-mutedtext)]">لا توجد تذاكر.</div>}
      </div>
    </div>
  );

  const Coupons = () => (
    <div className="space-y-6">
      <Header
        title="الكوبونات والخصومات"
        desc="إنشاء كوبونات خصم (نسبة أو مبلغ ثابت) وإيقافها/حذفها."
        actions={
          <>
            <input className="lux-input w-56" placeholder="بحث بالكود..." value={cq} onChange={(e)=>setCq(e.target.value)} />
            <button className="lux-btn-ghost" onClick={loadCoupons} disabled={busy}><RefreshCw className="h-4 w-4" /> تحديث</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lux-card p-5 lg:col-span-2 space-y-3">
          <div className="text-lg font-semibold">إنشاء كوبون</div>

          <div>
            <label className="lux-label">الكود</label>
            <input className="lux-input" value={cForm.code} onChange={(e)=>setCForm({...cForm, code:e.target.value.toUpperCase()})} placeholder="LUXORA10" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lux-label">النوع</label>
              <select className="lux-input" value={cForm.type} onChange={(e)=>setCForm({...cForm, type:e.target.value as any})}>
                <option value="percent">نسبة %</option>
                <option value="fixed">مبلغ ثابت</option>
              </select>
            </div>
            <div>
              <label className="lux-label">القيمة</label>
              <input className="lux-input" type="number" value={cForm.amount} onChange={(e)=>setCForm({...cForm, amount:Number(e.target.value)})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="lux-label">حد أدنى (اختياري)</label>
              <input className="lux-input" type="number" value={cForm.minSubtotal} onChange={(e)=>setCForm({...cForm, minSubtotal:Number(e.target.value)})} />
            </div>
            <div>
              <label className="lux-label">حد الاستخدام (0 = بلا حد)</label>
              <input className="lux-input" type="number" value={cForm.maxUses} onChange={(e)=>setCForm({...cForm, maxUses:Number(e.target.value)})} />
            </div>
          </div>

          <div>
            <label className="lux-label">تاريخ الانتهاء (ISO اختياري)</label>
            <input className="lux-input" value={cForm.expiresAt} onChange={(e)=>setCForm({...cForm, expiresAt:e.target.value})} placeholder="2026-12-31T23:59:59.000Z" />
          </div>

          <label className="flex items-center gap-2 text-sm text-[color:var(--lux-mutedtext)]">
            <input type="checkbox" checked={cForm.active} onChange={(e)=>setCForm({...cForm, active:e.target.checked})} />
            مفعل
          </label>

          <button className="lux-btn-gold shine" onClick={createCoupon} disabled={busy}>
            <Plus className="h-4 w-4" /> إنشاء
          </button>

          <p className="text-xs text-[color:var(--lux-fg)]/45">
            تطبيق الكوبون على الدفع يمكن ربطه لاحقًا عند توصيل بوابة الدفع.
          </p>
        </div>

        <div className="lux-card p-5 lg:col-span-3">
          <div className="text-lg font-semibold">القائمة</div>
          <div className="mt-4 space-y-3">
            {filteredCoupons.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
                <div className="flex items-center gap-2">
                  {chip(c.active ? "ACTIVE" : "OFF")}
                  <div className="font-semibold text-[color:var(--lux-fg)]">{c.code}</div>
                  <div className="text-sm text-[color:var(--lux-mutedtext)]">
                    {c.type === "percent" ? `${c.amount}%` : `${c.amount}`}
                  </div>
                  <div className="text-xs text-[color:var(--lux-mutedtext)]">Used: {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="lux-btn-ghost" onClick={() => toggleCoupon(c)} disabled={busy}>
                    {c.active ? "إيقاف" : "تفعيل"}
                  </button>
                  <button className="lux-btn-ghost" onClick={() => deleteCoupon(c.id)} disabled={busy} title="حذف">
                    <Trash2 className="h-4 w-4 text-red-300" />
                  </button>
                </div>
              </div>
            ))}
            {filteredCoupons.length === 0 && <div className="text-sm text-[color:var(--lux-mutedtext)]">لا يوجد كوبونات.</div>}
          </div>
        </div>
      </div>
    </div>
  );

  const Payments = () => (
    <div className="space-y-6">
      <Header
        title="إعدادات الدفع"
        desc="تشغيل/إيقاف طرق الدفع وتخزين مفاتيح الربط (لاحقًا عند التفعيل الحقيقي)."
        actions={
          <>
            <button className="lux-btn-gold shine" onClick={savePayments} disabled={busy || !payments}><Save className="h-4 w-4" /> حفظ</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      {!payments ? (
        <div className="lux-card p-8">جارٍ التحميل...</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="lux-card p-5 space-y-4">
            <div className="text-lg font-semibold">طرق الدفع</div>

            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
              <div>
                <div className="font-medium">PayPal</div>
                <div className="text-xs text-[color:var(--lux-mutedtext)]">تفعيل لاحقًا بالـ Client ID.</div>
              </div>
              <input type="checkbox" checked={payments.paypal.enabled} onChange={(e)=>setPayments({...payments, paypal:{...payments.paypal, enabled:e.target.checked}})} />
            </label>
            <div>
              <label className="lux-label">PayPal Client ID</label>
              <input className="lux-input" value={payments.paypal.clientId} onChange={(e)=>setPayments({...payments, paypal:{...payments.paypal, clientId:e.target.value}})} />
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
              <div>
                <div className="font-medium">Stripe (Cards)</div>
                <div className="text-xs text-[color:var(--lux-mutedtext)]">تفعيل لاحقًا بالـ Publishable Key.</div>
              </div>
              <input type="checkbox" checked={payments.stripe.enabled} onChange={(e)=>setPayments({...payments, stripe:{...payments.stripe, enabled:e.target.checked}})} />
            </label>
            <div>
              <label className="lux-label">Stripe Publishable Key</label>
              <input className="lux-input" value={payments.stripe.publishableKey} onChange={(e)=>setPayments({...payments, stripe:{...payments.stripe, publishableKey:e.target.value}})} />
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
              <div>
                <div className="font-medium">الدفع عند الاستلام</div>
                <div className="text-xs text-[color:var(--lux-mutedtext)]">COD</div>
              </div>
              <input type="checkbox" checked={payments.cod.enabled} onChange={(e)=>setPayments({...payments, cod:{enabled:e.target.checked}})} />
            </label>

            <label className="flex items-center justify-between rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-4">
              <div>
                <div className="font-medium">تحويل بنكي</div>
                <div className="text-xs text-[color:var(--lux-mutedtext)]">إظهار تعليمات التحويل.</div>
              </div>
              <input type="checkbox" checked={payments.bank.enabled} onChange={(e)=>setPayments({...payments, bank:{...payments.bank, enabled:e.target.checked}})} />
            </label>
            <div>
              <label className="lux-label">تعليمات التحويل البنكي</label>
              <textarea className="lux-input min-h-[120px]" value={payments.bank.instructions} onChange={(e)=>setPayments({...payments, bank:{...payments.bank, instructions:e.target.value}})} />
            </div>
          </div>

          <div className="lux-card p-5">
            <div className="text-lg font-semibold">ملاحظة</div>
            <p className="mt-3 text-sm text-[color:var(--lux-mutedtext)]">
              هذه الإعدادات “جاهزة” لإدارة المتجر من لوحة واحدة. عند توصيل بوابات الدفع الحقيقية (PayPal/Stripe)
              سيتم استخدام نفس المفاتيح والتفعيل.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const Shipping = () => (
    <div className="space-y-6">
      <Header
        title="إعدادات الشحن"
        desc="قواعد الشحن وأسعاره حسب المناطق/الدول. تحرير سريع عبر JSON (سهل ومرن)."
        actions={
          <>
            <button className="lux-btn-gold shine" onClick={saveShipping} disabled={busy}><Save className="h-4 w-4" /> حفظ</button>
            <button className="lux-btn-ghost" onClick={logout}><LogOut className="h-4 w-4" /> خروج</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lux-card p-5">
          <div className="text-lg font-semibold">القواعد (JSON)</div>
          <p className="mt-2 text-xs text-[color:var(--lux-mutedtext)]">
            مثال: اجعل countries = ["MA","DZ"] لمنطقة المغرب/الجزائر، أو ["*"] للكل.
          </p>
          <textarea className="lux-input mt-4 min-h-[420px] font-mono text-xs" value={shippingJson} onChange={(e)=>setShippingJson(e.target.value)} />
        </div>

        <div className="lux-card p-5">
          <div className="text-lg font-semibold">معاينة سريعة</div>
          {shipping ? (
            <div className="mt-4 space-y-3 text-sm text-[color:var(--lux-mutedtext)]">
              <div>Currency: <span className="text-gold font-semibold">{shipping.currency}</span></div>
              {shipping.zones.map((z) => (
                <div key={z.id} className="rounded-2xl border border-[color:var(--lux-border)] bg-[color:var(--lux-surface)] p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-[color:var(--lux-fg)]">{z.name}</div>
                    {chip(z.countries.join(","))}
                  </div>
                  <div className="mt-2 text-xs text-[color:var(--lux-mutedtext)]">
                    Base: {z.base} • Per item: {z.perItem} • Free over: {z.freeOver}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-[color:var(--lux-mutedtext)]">جارٍ التحميل...</div>
          )}

          <div className="mt-6 lux-card p-4">
            <div className="text-[color:var(--lux-fg)] font-medium">الخطوة القادمة (اختياري)</div>
            <div className="mt-2 text-sm text-[color:var(--lux-mutedtext)]">
              يمكن ربط هذه القواعد داخل Checkout لحساب الشحن تلقائيًا وعرضه للعميل.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const current = tab;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="lux-card p-4 lg:sticky lg:top-6 h-fit">
        <div className="px-3 py-2">
          <div className="text-lg font-semibold">Luxora Admin</div>
          <div className="mt-1 text-xs text-[color:var(--lux-mutedtext)]">لوحة واحدة — قطاعات مرتبة</div>
        </div>

        <div className="mt-3 space-y-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => go(t.key)}
              className={
                "w-full rounded-2xl px-3 py-3 text-right text-sm transition flex items-center justify-between border " +
                (current === t.key ? "border-gold/30 bg-[color:var(--lux-surface)] text-[color:var(--lux-fg)]" : "border-[color:var(--lux-border)] text-[color:var(--lux-mutedtext)] hover:bg-[color:var(--lux-surface)]")
              }
              type="button"
            >
              <span className="flex items-center gap-2">
                <span className="text-gold">{t.icon}</span>
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 lux-divider" />
        <button className="lux-btn-ghost w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          خروج
        </button>
      </aside>

      <main className="min-w-0">
        {current === "dashboard" && <Dashboard />}
        {current === "categories" && <Categories />}
        {current === "products" && <Products />}
        {current === "editor" && <Editor />}
        {current === "orders" && <Orders />}
        {current === "returns" && <Returns />}
        {current === "messages" && <Messages />}
        {current === "support" && <Support />}
        {current === "coupons" && <Coupons />}
        {current === "payments" && <Payments />}
        {current === "shipping" && <Shipping />}
      </main>
    </div>
  );
}
