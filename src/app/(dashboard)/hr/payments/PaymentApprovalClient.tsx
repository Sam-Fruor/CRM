// src/app/(dashboard)/hr/payments/PaymentApprovalClient.tsx
"use client";

import { useState } from "react";
import { resolvePaymentVerification, PaymentType } from "@/app/actions/paymentActions";

export default function PaymentApprovalClient({ leadId, paymentType, isHistory = false }: { leadId: string, paymentType: PaymentType, isHistory?: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    const invoice = window.prompt("Payment Verified! Please enter the Invoice Number to assign to this transaction (Optional but recommended):");
    if (invoice === null) return; // User clicked Cancel
    
    setLoading(true);
    try {
      await resolvePaymentVerification(leadId, paymentType, 'Approved', invoice, undefined);
    } catch (error) {
      console.error(error);
      alert("Failed to approve payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt("Payment Rejected! Please enter the reason for Sales (e.g., 'Amount mismatch', 'Receipt missing'):");
    if (!reason) {
      alert("You must provide a rejection reason so Sales knows what to fix.");
      return; 
    }
    
    setLoading(true);
    try {
      await resolvePaymentVerification(leadId, paymentType, 'Rejected', undefined, reason);
    } catch (error) {
      console.error(error);
      alert("Failed to reject payment.");
    } finally {
      setLoading(false);
    }
  };

  // If this is rendering on the History tab, just show a badge, no buttons.
  if (isHistory) return null;

  if (loading) return <span className="text-xs font-bold text-slate-400">Processing...</span>;

  return (
    <div className="flex justify-end gap-2">
      <button 
        onClick={handleReject} 
        className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded shadow-sm transition-colors"
      >
        Reject
      </button>
      <button 
        onClick={handleApprove} 
        className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded shadow-sm transition-colors"
      >
        Verify & Approve
      </button>
    </div>
  );
}