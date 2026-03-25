// src/app/(dashboard)/hr/verification/PaymentApprovalClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resolvePaymentVerification, PaymentType } from "@/app/actions/paymentActions";

export default function PaymentApprovalClient({ leadId, paymentType, isHistory = false }: { leadId: string, paymentType: PaymentType, isHistory?: boolean }) {
  const router = useRouter();
  
  // Modal State
  const [modalMode, setModalMode] = useState<"NONE" | "APPROVE" | "REJECT">("NONE");
  
  // Input States
  const [invoice, setInvoice] = useState("");
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // 🛡️ Strict Validation
    if (modalMode === "APPROVE" && !invoice.trim()) {
      return alert("❌ Invoice Number is required for Approval.");
    }
    if (modalMode === "REJECT" && !remark.trim()) {
      return alert("❌ Rejection Reason is required.");
    }

    setLoading(true);
    const finalStatus = modalMode === "APPROVE" ? "Approved" : "Rejected";

    try {
      // Send data to server action
      await resolvePaymentVerification(
        leadId, 
        paymentType, 
        finalStatus, 
        modalMode === "APPROVE" ? invoice : undefined, 
        remark
      );
      
      setModalMode("NONE");
      setInvoice("");
      setRemark("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to process payment verification.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModalMode("NONE");
    setInvoice("");
    setRemark("");
  };

  // If this is rendering on the History tab, just show a badge, no buttons.
  if (isHistory) return null;

  return (
    <>
      {/* 🟢 BUTTON TRIGGERS */}
      <div className="flex flex-col gap-2 w-full max-w-[130px] ml-auto">
        <button 
          onClick={() => setModalMode("APPROVE")} 
          className="w-full py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          Approve
        </button>
        
        <button 
          onClick={() => setModalMode("REJECT")} 
          className="w-full py-2 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          Reject
        </button>
      </div>

      {/* 🔴 THE MODAL OVERLAY */}
      {modalMode !== "NONE" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 transform scale-100 animate-in zoom-in-95 duration-200">
            
            {/* MODAL HEADER */}
            <div className={`p-5 border-b flex justify-between items-center ${modalMode === "APPROVE" ? "bg-emerald-50 border-emerald-100" : "bg-red-50 border-red-100"}`}>
              <h3 className={`text-lg font-black flex items-center gap-2 ${modalMode === "APPROVE" ? "text-emerald-800" : "text-red-800"}`}>
                {modalMode === "APPROVE" ? "✅ Approve Payment" : "❌ Reject Payment"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 font-bold w-8 h-8 flex justify-center items-center rounded-full hover:bg-slate-200 transition-colors">✕</button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-5">
              <p className="text-sm text-slate-500 font-medium">
                {modalMode === "APPROVE" 
                  ? "Please verify the receipt in the Document Vault and input the generated invoice number below." 
                  : "Please provide a clear reason for rejecting this payment so Operations/Sales can fix it."}
              </p>

              {/* INVOICE FIELD (ONLY FOR APPROVAL) */}
              {modalMode === "APPROVE" && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Invoice Number <span className="text-red-500 text-sm">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={invoice} 
                    onChange={e => setInvoice(e.target.value)} 
                    placeholder="e.g. INV-2026-001" 
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" 
                    required 
                  />
                </div>
              )}

              {/* REMARK FIELD */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {modalMode === "REJECT" ? "Rejection Reason " : "Internal HR Remarks (Optional)"}
                  {modalMode === "REJECT" && <span className="text-red-500 text-sm">*</span>}
                </label>
                <textarea 
                  value={remark} 
                  onChange={e => setRemark(e.target.value)} 
                  placeholder={modalMode === "REJECT" ? "e.g., The receipt is blurry, or the amount does not match..." : "Notes for the file..."} 
                  rows={3} 
                  className={`w-full p-3 border rounded-lg text-sm focus:ring-2 outline-none transition-all shadow-sm ${
                    modalMode === "REJECT" ? "border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50/30" : "border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                  }`} 
                  required={modalMode === "REJECT"} 
                />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={closeModal} 
                disabled={loading} 
                className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading} 
                className={`px-6 py-2.5 text-sm font-bold text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 ${
                  modalMode === "APPROVE" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {loading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  modalMode === "APPROVE" ? "✅ Confirm Approval" : "❌ Confirm Rejection"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}