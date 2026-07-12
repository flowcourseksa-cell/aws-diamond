"use client";

import { useEffect, useState } from "react";
import { IconSearch, IconCheck, IconX, IconUser, IconBook, IconAlertCircle, IconBell } from "@tabler/icons-react";
import { createClient } from "@/lib/supabase/client";
import { fetchPendingActivations, approveActivation, rejectActivation } from "@/lib/supabase/services/activations";

type ActivationRequest = {
  enrollment_id: string;
  student_id: string;
  course_id: string;
  student_name: string;
  student_code: string;
  course_title: string;
  course_price: number;
  payment_status: string;
  discount_code?: string;
  final_price?: number;
  created_at: string;
};

export default function ActivationsPage() {
  const [requests, setRequests] = useState<ActivationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ActivationRequest[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'free' | 'paid'>('free');

  const freeCount = requests.filter(r => r.course_price === 0).length;
  const paidCount = requests.filter(r => r.course_price > 0).length;

  // Modals state
  const [actionModal, setActionModal] = useState<{ type: 'approve' | 'reject'; request: ActivationRequest } | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    const data = await fetchPendingActivations();
    setRequests(data);
    setFilteredRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFilteredRequests(
      requests.filter(
        r => (r.student_name.toLowerCase().includes(q) || r.student_code.toLowerCase().includes(q)) &&
             (activeTab === 'paid' ? r.course_price > 0 : r.course_price === 0)
      )
    );
  }, [search, requests, activeTab]);

  const handleApprove = async () => {
    if (!actionModal) return;
    const { request } = actionModal;
    
    await approveActivation(request.enrollment_id, request.student_id, request.course_title);

    setActionModal(null);
    fetchRequests();
  };

  const handleReject = async () => {
    if (!actionModal) return;
    const { request } = actionModal;
    
    await rejectActivation(request.enrollment_id, request.student_id, request.course_title);

    setActionModal(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6 animate-fade-in-up" dir="rtl">
      {/* Header */}
      <div className="fade-up rounded-2xl bg-sidebar px-7 py-6 text-white">
        <div className="flex items-center gap-3 mb-1">
          <IconBell size={26} />
          <h2 className="text-xl font-black">إشعارات تفعيل الدورات</h2>
        </div>
        <p className="text-white/70 font-medium text-sm">
          مراجعة طلبات الانضمام للدورات {activeTab === 'paid' ? 'المدفوعة' : 'المجانية'} والموافقة عليها.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-sidebar/5 p-1 rounded-xl w-fit gap-1">
        <button
          onClick={() => setActiveTab('free')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'free' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
        >
          الدورات المجانية
          {freeCount > 0 && (
            <span className="bg-accent-red text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {freeCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-colors ${activeTab === 'paid' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text'}`}
        >
          الدورات المدفوعة
          {paidCount > 0 && (
            <span className="bg-accent-red text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {paidCount}
            </span>
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-96">
          <IconSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="ابحث باسم الطالب أو ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-bg border border-border rounded-xl pr-10 pl-4 py-2.5 text-sm outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-bg/50 border-b border-border">
              <tr>
                <th className="p-4 font-bold text-text-muted">الطالب</th>
                <th className="p-4 font-bold text-text-muted">ID</th>
                <th className="p-4 font-bold text-text-muted">الدورة</th>
                <th className="p-4 font-bold text-text-muted">تاريخ الطلب</th>
                <th className="p-4 font-bold text-text-muted text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">جاري التحميل...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-text-muted">
                    <div className="flex flex-col items-center justify-center">
                      <IconCheck size={48} className="opacity-20 mb-3" />
                      لا توجد طلبات تفعيل معلقة حالياً
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.enrollment_id} className="border-b border-border hover:bg-bg/50 transition-colors">
                    <td className="p-4 font-bold flex items-center gap-2">
                      <IconUser size={16} className="text-primary" /> {req.student_name}
                    </td>
                    <td className="p-4 text-text-muted font-medium font-mono text-xs">{req.student_code}</td>
                    <td className="p-4 font-bold text-text flex items-center gap-2">
                      <IconBook size={16} className="text-accent-teal" /> {req.course_title}
                    </td>
                    <td className="p-4 text-text-muted font-medium">
                      {new Date(req.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setActionModal({ type: 'approve', request: req })}
                          className="px-4 py-1.5 rounded-lg bg-accent-teal/10 text-accent-teal font-bold hover:bg-accent-teal hover:text-white transition-colors"
                        >
                          تفعيل
                        </button>
                        <button
                          onClick={() => setActionModal({ type: 'reject', request: req })}
                          className="px-4 py-1.5 rounded-lg bg-accent-red/10 text-accent-red font-bold hover:bg-accent-red hover:text-white transition-colors"
                        >
                          رفض
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 border border-border shadow-2xl scale-in">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${actionModal.type === 'approve' ? 'bg-accent-teal/10 text-accent-teal' : 'bg-accent-red/10 text-accent-red'}`}>
              {actionModal.type === 'approve' ? <IconCheck size={24} /> : <IconAlertCircle size={24} />}
            </div>
            <h3 className="text-xl font-black mb-2">
              {actionModal.type === 'approve' ? 'تأكيد التفعيل' : 'تأكيد الرفض'}
            </h3>
            <p className="text-text-muted text-sm font-medium mb-6 leading-relaxed">
              هل أنت متأكد من {actionModal.type === 'approve' ? 'تفعيل' : 'رفض'} طلب انضمام الطالب <strong className="text-text">{actionModal.request.student_name}</strong> لدورة <strong className="text-text">{actionModal.request.course_title}</strong>؟
              <br/><br/>
              {actionModal.type === 'approve' ? 'سيتم إرسال إشعار للطالب وإتاحة محتوى الدورة له فوراً.' : 'سيتم حذف الطلب وإرسال إشعار للطالب برفض تفعيله.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={actionModal.type === 'approve' ? handleApprove : handleReject}
                className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-colors ${actionModal.type === 'approve' ? 'bg-accent-teal hover:bg-accent-teal/90' : 'bg-accent-red hover:bg-accent-red/90'}`}
              >
                تأكيد
              </button>
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-bg border border-border font-bold hover:bg-border transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
