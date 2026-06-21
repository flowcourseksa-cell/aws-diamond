"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconCurrencyDollar, IconDiscount2, IconCheck, IconX,
  IconPlus, IconTrash, IconEdit, IconLock,
} from "@tabler/icons-react";

import { usePlatformStore } from "@/lib/store";
import {
  fetchDiscountCodes, createDiscountCode, deleteDiscountCode,
  fetchSubscriptionPrices, saveSubscriptionPrices,
  type DiscountCode, type SubscriptionPrice,
} from "@/lib/supabase/services/pricing";

// Default tiers used only as a starting form when nothing is saved yet.
const DEFAULT_PRICES: SubscriptionPrice[] = [
  { id: "monthly", label: "شهري", months: 1, price: 0, discountedPrice: null, isActive: true },
  { id: "yearly", label: "سنوي", months: 12, price: 0, discountedPrice: null, isActive: true },
];

// ── Component ─────────────────────────────────────────────────
export default function AdminPricingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Individual content items still come from the cloud-hydrated store.
  const lessons = usePlatformStore(s => s.lessons);
  const exams = usePlatformStore(s => s.exams);
  const files = usePlatformStore(s => s.files);
  const updateItemPrice = usePlatformStore(s => s.updateItemPrice);

  // Cloud-backed subscription prices.
  const [prices, setPrices] = useState<SubscriptionPrice[]>(DEFAULT_PRICES);

  // Cloud-backed discount codes.
  const [codes, setCodes] = useState<DiscountCode[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [cloudPrices, cloudCodes] = await Promise.all([
      fetchSubscriptionPrices(),
      fetchDiscountCodes(),
    ]);
    if (cloudPrices.length > 0) setPrices(cloudPrices);
    setCodes(cloudCodes);
    setLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    loadAll();
  }, [loadAll]);

  // Discount code form
  const [showAddCode, setShowAddCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newDiscount, setNewDiscount] = useState(10);
  const [newMaxUses, setNewMaxUses] = useState(100);
  const [newExpiry, setNewExpiry] = useState("");

  // Content items (paid only)
  const items = [
    ...lessons.filter(l => l.accessType === "paid").map(l => ({ id: l.id, title: l.title, type: "درس", currentPrice: l.price, rawType: "lesson" as const })),
    ...exams.filter(e => e.accessType === "paid").map(e => ({ id: e.id, title: e.name, type: "اختبار", currentPrice: e.price, rawType: "exam" as const })),
    ...files.filter(f => f.accessType === "paid").map(f => ({ id: f.id, title: f.title, type: "ملف", currentPrice: f.price, rawType: "file" as const })),
  ];

  const [editingItem, setEditingItem] = useState<{ id: string, type: "lesson" | "exam" | "file" } | null>(null);
  const [editPriceVal, setEditPriceVal] = useState(0);

  function updatePriceField(id: string, field: "price" | "discountedPrice", value: number) {
    setPrices(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function handleSavePlans() {
    setSaving(true);
    const ok = await saveSubscriptionPrices(prices);
    setSaving(false);
    alert(ok ? "تم حفظ أسعار الاشتراكات بنجاح" : "تعذّر الحفظ. تأكد من صلاحية الأدمن.");
  }

  async function handleAddCode() {
    if (!newCode.trim()) return;
    const created = await createDiscountCode({
      code: newCode,
      discountPercent: newDiscount,
      maxUses: newMaxUses,
      expiryDate: newExpiry || null,
    });
    if (created) {
      setCodes(prev => [created, ...prev]);
      setShowAddCode(false);
      setNewCode(""); setNewDiscount(10); setNewMaxUses(100); setNewExpiry("");
    } else {
      alert("تعذّر إضافة الكود. ربما الكود مكرّر أو لا تملك صلاحية الأدمن.");
    }
  }

  async function handleDeleteCode(id: string) {
    const ok = await deleteDiscountCode(id);
    if (ok) setCodes(prev => prev.filter(c => c.id !== id));
  }

  function saveItemPrice(id: string, type: "lesson" | "exam" | "file") {
    updateItemPrice(type, id, editPriceVal);
    setEditingItem(null);
  }

  if (!isMounted || loading) return <div className="p-8 text-center font-bold text-text-muted">جاري التحميل...</div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconCurrencyDollar size={26} />
          <h2 className="text-xl font-black">التسعير والكودات</h2>
        </div>
        <p className="text-white/55 text-sm">إدارة أسعار الاشتراكات، المحتوى المنفصل، وإنشاء كودات الخصم.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        
        {/* Left Col: Plans & Items */}
        <div className="flex flex-col gap-6 fade-up">
          
          {/* Subscriptions */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5 text-text font-black text-lg">
              <IconLock size={20} className="text-accent-amber"/> خطط الاشتراك (شاملة كل شيء)
            </div>
            <div className="flex flex-col gap-4">
              {prices.map(p => (
                <div key={p.id}>
                  <label className="text-xs font-black text-text-muted mb-1.5 block">الاشتراك {p.label} (ر.س)</label>
                  <input type="number" value={p.price} onChange={e => updatePriceField(p.id, "price", Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm font-bold outline-none focus:border-primary" />
                </div>
              ))}
              <button onClick={handleSavePlans} disabled={saving} className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60">
                <IconCheck size={18}/> {saving ? "جاري الحفظ..." : "حفظ الأسعار"}
              </button>
            </div>
          </div>

          {/* Individual Items */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-5 text-text font-black text-lg">
              <IconCurrencyDollar size={20} className="text-emerald-500"/> تسعير المحتوى المنفصل
            </div>
            <div className="flex flex-col gap-3">
              {items.length === 0 && (
                <p className="text-xs font-bold text-text-muted text-center py-4">لا يوجد محتوى مدفوع منفصل بعد.</p>
              )}
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-bg">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-text">{item.title}</span>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded w-max mt-1">{item.type}</span>
                  </div>
                  {editingItem?.id === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <input type="number" value={editPriceVal} onChange={e => setEditPriceVal(Number(e.target.value))} autoFocus
                        className="w-16 rounded-lg border border-primary bg-card px-2 py-1 text-xs font-bold text-center outline-none"/>
                      <button onClick={() => saveItemPrice(item.id, item.rawType)} className="text-emerald-600"><IconCheck size={16}/></button>
                      <button onClick={() => setEditingItem(null)} className="text-text-muted"><IconX size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-text">{item.currentPrice} ر.س</span>
                      <button onClick={() => { setEditingItem({ id: item.id, type: item.rawType }); setEditPriceVal(item.currentPrice); }}
                        className="text-text-muted hover:text-primary"><IconEdit size={14}/></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Col: Discount Codes */}
        <div className="flex flex-col gap-6 fade-up delay-1">
          <div className="rounded-2xl border border-border bg-card p-6 flex-1">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2 text-text font-black text-lg">
                <IconDiscount2 size={22} className="text-accent-teal"/> كودات الخصم
              </div>
              <button onClick={() => setShowAddCode(!showAddCode)} className="flex items-center gap-1.5 rounded-lg bg-accent-teal/10 text-accent-teal px-3 py-1.5 text-xs font-bold hover:bg-accent-teal/20 transition-colors">
                <IconPlus size={14}/> كود جديد
              </button>
            </div>

            {showAddCode && (
              <div className="mb-5 p-4 rounded-xl border border-border bg-bg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1 block">الكود</label>
                    <input value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} placeholder="مثال: SAVE20"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold outline-none focus:border-primary uppercase" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1 block">نسبة الخصم %</label>
                    <input type="number" value={newDiscount} onChange={e => setNewDiscount(Number(e.target.value))} min={1} max={100}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1 block">الحد الأقصى للاستخدام</label>
                    <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(Number(e.target.value))} min={1}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-black text-text-muted mb-1 block">تاريخ الانتهاء</label>
                    <input type="date" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowAddCode(false)} className="px-3 py-1.5 text-xs font-bold text-text-muted hover:text-text">إلغاء</button>
                  <button onClick={handleAddCode} className="px-4 py-1.5 rounded-lg bg-accent-teal text-white text-xs font-bold hover:bg-accent-teal/90">إضافة الكود</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] border-collapse text-[13.5px]">
                <thead>
                  <tr className="border-b border-border bg-bg/60">
                    <th className="px-4 py-3 text-right text-xs font-black text-text-muted uppercase">الكود</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-text-muted uppercase">الخصم</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-text-muted uppercase">الاستخدام</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-text-muted uppercase">الصلاحية</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-text-muted uppercase">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-xs font-bold text-text-muted">لا توجد كودات خصم بعد.</td></tr>
                  )}
                  {codes.map(c => {
                    const isExhausted = c.maxUses > 0 && c.uses >= c.maxUses;
                    return (
                      <tr key={c.id} className="border-b border-border last:border-none hover:bg-bg/40">
                        <td className="px-4 py-3 font-black text-text"><span className="bg-bg border border-border px-2 py-1 rounded text-primary">{c.code}</span></td>
                        <td className="px-4 py-3 font-black text-accent-teal">{c.discountPercent}%</td>
                        <td className="px-4 py-3 font-semibold text-text-muted">
                          {c.uses} / {c.maxUses > 0 ? c.maxUses : "∞"}
                          {isExhausted && <span className="mr-2 text-[10px] text-accent-red font-black bg-accent-red/10 px-1.5 py-0.5 rounded">مكتمل</span>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-text-muted" dir="ltr">{c.expiryDate || "—"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => handleDeleteCode(c.id)} className="text-text-muted hover:text-accent-red transition-colors"><IconTrash size={15}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
