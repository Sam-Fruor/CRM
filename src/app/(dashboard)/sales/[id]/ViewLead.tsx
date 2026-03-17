// src/app/(dashboard)/sales/[id]/ViewLead.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TransferBanner from "./TransferBanner";
import DocumentVault from "@/components/DocumentVault";
import { updateSalesProcessing } from "@/app/actions/salesActions";
import { requestPaymentVerification, PaymentType } from "@/app/actions/paymentActions"; 

const FEEDBACK_OPTIONS = [
  "Converted", 
  "Not Responding", 
  "Not Interested", 
  "Not Eligible", 
  "Client is for Next Test"
];

export default function ViewLead({ lead, activeTab }: { lead: any, activeTab: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<PaymentType | string | null>(null);
  
  // 🗂️ Quick Vault Modal
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const initialFeedback = lead.feedbackStatus || "";
  const isCustomFeedback = initialFeedback && !FEEDBACK_OPTIONS.includes(initialFeedback);
  const [feedbackSelect, setFeedbackSelect] = useState(isCustomFeedback ? "Others" : initialFeedback);

  const [otherPayments, setOtherPayments] = useState<any[]>(
    Array.isArray(lead.otherPayments) ? lead.otherPayments.map(p => ({
      ...p, 
      testDate: p.testDate || "", 
      date: p.date || "", 
      status: p.status || "Unsubmitted", 
      rejectReason: p.rejectReason || "", 
      isAutoRetest: !!p.isAutoRetest, 
      isAutoReschedule: !!p.isAutoReschedule, 
      attempt: p.attempt || null
    })) : []
  );

  const evalsCount = lead.testEvaluations?.length || 0;
  const isInitialScored = evalsCount > 0;
  const isRetestScored = evalsCount > 1;
  const failedExamsCount = lead.testEvaluations?.filter((t: any) => t.status === "Rejected" || t.status === "Failed" || t.englishTestResult === "Failed" || t.yardTestResult === "Failed").length || 0;
  const hasFailedExam = lead.examinerStatus === "Rejected" || failedExamsCount > 0;
  const isExamPassed = lead.examinerStatus === "Approved";

  const isPastDate = (d: string) => {
    if (!d) return false;
    const date = new Date(d);
    date.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };

  const initialIsNoShow = !isInitialScored && isPastDate(lead.testDate);
  const retestIsNoShow = hasFailedExam && !isRetestScored && isPastDate(lead.reTestDate);

  useEffect(() => {
    setOtherPayments(prev => {
      let newRows = [...prev];

      const hasInitResch = newRows.some(p => p.isAutoReschedule && p.attempt === 1);
      if (initialIsNoShow && !hasInitResch) {
        newRows.push({ id: Math.random().toString(36).substr(2, 9), name: "Attempt 1 Reschedule", amount: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoReschedule: true, attempt: 1 });
      } else if (!initialIsNoShow && hasInitResch) {
        newRows = newRows.filter(p => !(p.isAutoReschedule && p.attempt === 1 && p.status === "Unsubmitted")); 
      }

      const hasRetestResch = newRows.some(p => p.isAutoReschedule && p.attempt === 2);
      if (retestIsNoShow && !hasRetestResch) {
        newRows.push({ id: Math.random().toString(36).substr(2, 9), name: "Attempt 2 Reschedule", amount: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoReschedule: true, attempt: 2 });
      } else if (!retestIsNoShow && hasRetestResch) {
        newRows = newRows.filter(p => !(p.isAutoReschedule && p.attempt === 2 && p.status === "Unsubmitted"));
      }

      if (failedExamsCount > 1) {
        const extraNeeded = failedExamsCount - 1;
        const existingAutoRetests = newRows.filter(p => p.isAutoRetest);
        if (existingAutoRetests.length < extraNeeded) {
          for (let i = existingAutoRetests.length; i < extraNeeded; i++) {
            newRows.push({ id: Math.random().toString(36).substr(2, 9), name: `Attempt ${i + 3} Re-Test`, amount: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoRetest: true, attempt: i + 3 });
          }
        }
      }
      return newRows;
    });
  }, [initialIsNoShow, retestIsNoShow, failedExamsCount]);

  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";
  const labelStyle = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const valueStyle = "text-sm font-semibold text-slate-800";
  const baseInputStyle = "w-full p-2.5 text-sm rounded-lg outline-none transition-all shadow-sm border ";
  const inputStyle = baseInputStyle + "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium";
  const lockedInputStyle = baseInputStyle + "bg-slate-100 border-slate-200 text-slate-500 font-bold pointer-events-none cursor-not-allowed";

  const docs = lead.documentStatus || {};
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
  const formatDisplayDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString("en-GB") : "N/A";

  const addPaymentRow = () => setOtherPayments([...otherPayments, { id: Math.random().toString(36).substr(2, 9), name: "", amount: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoRetest: false, isAutoReschedule: false }]);
  const updatePaymentRow = (id: string, field: string, value: string) => setOtherPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const removePaymentRow = (id: string) => setOtherPayments(prev => prev.filter(p => p.id !== id));

  const handleInlineSave = async (e?: React.FormEvent<HTMLFormElement>, silent = false, overridePayments?: any[]) => {
    if (e) e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    const formData = new FormData(formRef.current);
    formData.append("otherPayments", JSON.stringify(overridePayments || otherPayments));
    try {
      await updateSalesProcessing(lead.id, formData);
      if (!silent) alert("✅ Sales Financials & Schedules Updated!");
      router.refresh();
    } catch (error) {
      console.error(error);
      if (!silent) alert("Failed to save updates.");
    } finally {
      setLoading(false);
    }
  };

  const sendForVerification = async (type: PaymentType) => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    if (type === 'TEST' && (!formData.get('testFeesAmount') || !formData.get('paymentDate'))) {
      return alert("❌ ERROR: Please enter the Test Fees Amount and Payment Date before sending to HR.");
    }
    if (type === 'RETEST' && (!formData.get('reTestFeesAmount') || !formData.get('reTestPaymentDate'))) {
      return alert("❌ ERROR: Please enter the Re-Test Fees Amount and Payment Date before sending to HR.");
    }
    if (type === 'SA' && (!formData.get('serviceAgreementAmount') || !formData.get('serviceAgreementTotal') || !formData.get('serviceAgreementPaymentDate'))) {
      return alert("❌ ERROR: Please enter the Service Agreement Amounts and Payment Date before sending to HR.");
    }

    setVerifyLoading(type);
    try {
      await handleInlineSave(undefined, true);
      await requestPaymentVerification(lead.id, type);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to send verification request.");
    } finally {
      setVerifyLoading(null);
    }
  };

  const sendOtherForVerification = async (id: string) => {
    const payment = otherPayments.find(p => p.id === id);
    if (!payment?.amount || !payment?.date) {
      return alert("❌ ERROR: Please enter the Amount and Payment Date before sending to HR.");
    }

    setVerifyLoading(id);
    const updatedPayments = otherPayments.map(p => p.id === id ? { ...p, status: 'Pending', rejectReason: '' } : p);
    setOtherPayments(updatedPayments);
    setTimeout(() => {
      if (formRef.current) handleInlineSave(undefined, true, updatedPayments);
      setVerifyLoading(null);
    }, 200);
  };

  const renderVerifyBadge = (status: string) => {
    if (status === "Approved") return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">✅ HR Approved</span>;
    if (status === "Pending") return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200 animate-pulse">⏳ Pending HR</span>;
    if (status === "Rejected") return <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">❌ HR Rejected</span>;
    return <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">Unsubmitted</span>;
  };

  const renderVerifyButton = (status: string, onClick: () => void, loadingId: string, disabledStyle = "bg-slate-400") => {
    if (status === "Approved") return <button type="button" disabled className="w-full py-3.5 bg-slate-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 cursor-not-allowed">✅ Payment Verified</button>;
    if (status === "Pending") return <button type="button" disabled className="w-full py-3.5 bg-slate-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-200 cursor-not-allowed animate-pulse">⏳ Verification Sent</button>;
    return (
      <button type="button" onClick={onClick} disabled={verifyLoading === loadingId} className={`w-full py-3.5 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:${disabledStyle} bg-blue-600 hover:bg-blue-700`}>
        {verifyLoading === loadingId ? "Sending..." : "📤 Send for Verification"}
      </button>
    );
  };

  const renderUploadReceiptButton = () => (
    <button 
      type="button" 
      onClick={() => setIsVaultModalOpen(true)}
      className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
    >
      ⬆️ Upload Receipt
    </button>
  );

  const isInitialDateLocked = lead.testFeeVerifyStatus !== 'Approved' || isInitialScored || isPastDate(lead.testDate);
  const isRetestDateLocked = lead.reTestFeeVerifyStatus !== 'Approved' || isRetestScored || isPastDate(lead.reTestDate);

  // 🛑 INJECT NO-SHOWS INTO CANDIDATE HISTORY (Mirrors Examiner View)
  let combinedHistory = (lead.testEvaluations || []).map((t: any) => ({ ...t, isMissed: false }));

  const resched1 = otherPayments.find(p => p.isAutoReschedule && p.attempt === 1 && p.testDate);
  if (resched1 && lead.testDate) {
    combinedHistory.push({ id: 'noshow-1', createdAt: new Date(lead.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  }

  const resched2 = otherPayments.find(p => p.isAutoReschedule && p.attempt === 2 && p.testDate);
  if (resched2 && lead.reTestDate) {
    combinedHistory.push({ id: 'noshow-2', createdAt: new Date(lead.reTestDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  }

  otherPayments.filter(p => p.isAutoReschedule && p.attempt > 2 && p.testDate).forEach(resched => {
    const orig = otherPayments.find(p => p.isAutoRetest && p.attempt === resched.attempt);
    if (orig && orig.testDate) {
      combinedHistory.push({ id: `noshow-${resched.attempt}`, createdAt: new Date(orig.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
    }
  });

  // Sort ascending first to accurately assign Attempt Numbers
  combinedHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  combinedHistory = combinedHistory.map((test, index) => ({ ...test, attemptLabel: `Attempt ${index + 1}` }));
  
  // Re-sort descending so latest is at the top
  combinedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">

      {/* 🗂️ QUICK VAULT MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-600">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900 shrink-0">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🗂️</span> Quick Upload: Document Vault
              </h2>
              <button 
                type="button" 
                onClick={() => setIsVaultModalOpen(false)} 
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
              <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
            </div>
          </div>
        </div>
      )}

      {isExamPassed && lead.caseStatus === "Stage 1 Under Process" && (
        <TransferBanner leadId={lead.id} />
      )}

      {/* HEADER & TABS */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Lead Profile: {lead.givenName} {lead.surname}
          </h1>
          <p className="text-slate-500 text-sm">
            Read-only view. File is currently with: <span className="font-bold text-blue-600 ml-1">{lead.caseStatus}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/sales/leads" 
            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Close
          </Link>
          {lead.caseStatus === "Stage 1 Under Process" ? (
            <Link 
              href={`/sales/${lead.id}/edit`} 
              className="px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Edit Core Details
            </Link>
          ) : (
            <span className="px-6 py-2.5 rounded-lg font-bold text-slate-400 bg-slate-100 cursor-not-allowed shadow-sm border border-slate-200">
              🔒 Archived (Read-Only)
            </span>
          )}
        </div>
      </div>

      <div className="flex space-x-2 border-b border-slate-200 px-2 mb-6">
        <Link 
          href={`/sales/${lead.id}?tab=details`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          👤 Lead Profile & Evaluation
        </Link>
        <Link 
          href={`/sales/${lead.id}?tab=documents`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          🗂️ Document Vault
          {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
              {Object.keys(lead.documentFiles).length}
            </span>
          )}
        </Link>
      </div>

      {/* CONTENT AREA */}
      {activeTab === "details" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* SECTIONS 1-4: ROUTING, CLIENT, EXPERIENCE, VAULT */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span>📍 1. Routing Information</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className={labelStyle}>Lead Source</p>
                  <p className={valueStyle}>{lead.leadSource === "Others" ? lead.leadSourceOther : lead.leadSource}</p>
                </div>
                <div>
                  <p className={labelStyle}>Category</p>
                  <p className={valueStyle}>{lead.category === "Others" ? lead.categoryOther : lead.category}</p>
                </div>
                <div>
                  <p className={labelStyle}>Preferred Country</p>
                  <p className={valueStyle}>{lead.countryPreferred === "Others" ? lead.countryOther : lead.countryPreferred}</p>
                </div>
                <div>
                  <p className={labelStyle}>Slot Booking Date</p>
                  <p className={valueStyle}>{formatDisplayDate(lead.slotBookingDate)}</p>
                </div>
                <div>
                  <p className={labelStyle}>Test Date</p>
                  <p className={valueStyle}>{formatDisplayDate(lead.testDate)}</p>
                </div>
              </div>
            </div>

            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span>👤 2. Client Information</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className={labelStyle}>Full Name</p>
                  <p className={valueStyle}>{lead.givenName} {lead.surname}</p>
                </div>
                <div>
                  <p className={labelStyle}>Father's Name</p>
                  <p className={valueStyle}>{lead.fatherName || "N/A"}</p>
                </div>
                <div>
                  <p className={labelStyle}>Date of Birth</p>
                  <p className={valueStyle}>{formatDisplayDate(lead.dob)}</p>
                </div>
                <div>
                  <p className={labelStyle}>Phone</p>
                  <p className={valueStyle}>{lead.callingNumber}</p>
                </div>
                <div>
                  <p className={labelStyle}>WhatsApp</p>
                  <p className={valueStyle}>{lead.whatsappNumber || "N/A"}</p>
                </div>
                <div>
                  <p className={labelStyle}>Email</p>
                  <p className={valueStyle}>{lead.email || "N/A"}</p>
                </div>
                <div>
                  <p className={labelStyle}>Nationality</p>
                  <p className={valueStyle}>{lead.nationality}</p>
                </div>
              </div>
            </div>

            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span>💼 3. Experience & Agency History</span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className={labelStyle}>Home Exp</p>
                  <p className={valueStyle}>{lead.experienceHome || 0} Years</p>
                </div>
                <div>
                  <p className={labelStyle}>GCC Exp</p>
                  <p className={valueStyle}>{lead.experienceGCC || 0} Years</p>
                </div>
                <div>
                  <p className={labelStyle}>Previous Agency</p>
                  <p className={valueStyle}>{lead.previousAgency || "None"}</p>
                </div>
                <div>
                  <p className={labelStyle}>Prev. Country</p>
                  <p className={valueStyle}>{lead.previousCountry || "None"}</p>
                </div>
              </div>
            </div>

            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span>🗂️ 4. Documents & ID Details</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Vault Auto-Sync</span>
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">1. CV / RESUME</label>
                  {docs.resumeUploaded ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>
                  )}
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">2. DRIVING LICENCE</label>
                    {docs.dlUploaded ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div>
                      <p className={labelStyle}>DL Number</p>
                      <p className={valueStyle}>{lead.dlNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Issue Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.dlIssueDate)}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Expiry Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.dlExpiry)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">3. RESIDENT ID</label>
                    {docs.residentIdUploaded ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div>
                      <p className={labelStyle}>ID Number</p>
                      <p className={valueStyle}>{lead.residentIdNum || "N/A"}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Issue Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.residentIdIssueDate)}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Expiry Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.residentIdExp)}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">4. PASSPORT</label>
                    {docs.passportUploaded ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div>
                      <p className={labelStyle}>Passport Number</p>
                      <p className={valueStyle}>{lead.passportNum || "N/A"}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Issue Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.passportIssueDate)}</p>
                    </div>
                    <div>
                      <p className={labelStyle}>Expiry Date</p>
                      <p className={valueStyle}>{formatDisplayDate(lead.passportExpiry)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">5. TEST OR DRIVING VIDEO</label>
                  {docs.videoUploaded ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">6. OTHER DOCUMENTS</label>
                  {docs.otherUploaded ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">None</span>
                  )}
                </div>
              </div>
            </div>

            {/* 5. EXAM SCORES & HISTORY */}
            <div className="bg-purple-50/50 p-6 rounded-xl shadow-sm border border-purple-200 mb-6">
              <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-4 flex justify-between items-center">
                <span className="flex items-center gap-2">📝 5. Exam Scores & Evaluation History</span>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-100 border border-purple-200 px-2 py-1 rounded">Read-Only</span>
              </h2>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Current Final Status</h3>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      lead.examinerStatus === "Approved" ? "bg-emerald-100 text-emerald-700" : 
                      (lead.examinerStatus === "Denied" || lead.examinerStatus === "Rejected") ? "bg-red-100 text-red-700" : 
                      "bg-slate-100 text-slate-600"
                    }`}>
                      {lead.examinerStatus?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">English Assessment</p>
                      <p className="text-2xl font-black text-slate-800">
                        {lead.englishScore !== null ? lead.englishScore : "-"}
                        <span className="text-sm text-slate-400 font-medium">/10</span>
                      </p>
                      <p className={`text-sm font-bold mt-1 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-red-600' : 'text-slate-500'}`}>
                        {lead.englishTestResult || "Pending"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                      <p className="text-2xl font-black text-slate-800">
                        {lead.drivingScore !== null ? lead.drivingScore : "-"}
                        <span className="text-sm text-slate-400 font-medium">/10</span>
                      </p>
                      <p className={`text-sm font-bold mt-1 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-red-600' : 'text-slate-500'}`}>
                        {lead.yardTestResult || "Pending"}
                      </p>
                    </div>
                  </div>
                  {lead.examinerRemarks && (
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Latest Examiner Remarks</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.examinerRemarks}</p>
                    </div>
                  )}
                </div>

                {/* PAST HISTORY LOG (Now Includes Absences) */}
                {combinedHistory.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <h3 className="text-sm font-bold text-purple-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                      🕒 Complete Testing History ({combinedHistory.length} Attempts)
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {combinedHistory.map((test: any) => (
                        <div key={test.id} className={`p-4 rounded-lg border shadow-sm ${test.isMissed ? 'bg-orange-50 border-orange-200' : 'bg-white border-purple-100'}`}>
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <span className="text-xs font-bold text-slate-500">{test.attemptLabel} • {new Date(test.createdAt).toLocaleDateString("en-GB")}</span>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              test.isMissed ? "bg-orange-100 text-orange-700" :
                              test.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {test.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className={`text-xs uppercase tracking-wider ${test.isMissed ? 'text-orange-500/70' : 'text-slate-500'}`}>English:</span> 
                              <span className={`font-bold ml-1 ${test.isMissed ? 'text-orange-600' : 'text-slate-800'}`}>
                                {test.englishScore !== "-" ? `${test.englishScore}/10` : "-"}
                              </span>
                              {test.isMissed && <span className="text-orange-500 ml-1">({test.englishTestResult})</span>}
                            </div>
                            <div>
                              <span className={`text-xs uppercase tracking-wider ${test.isMissed ? 'text-orange-500/70' : 'text-slate-500'}`}>Driving:</span> 
                              <span className={`font-bold ml-1 ${test.isMissed ? 'text-orange-600' : 'text-slate-800'}`}>
                                {test.drivingScore !== "-" ? `${test.drivingScore}/10` : "-"}
                              </span>
                              {test.isMissed && <span className="text-orange-500 ml-1">({test.yardTestResult})</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================== */}
            {/* 🔴 INLINE EDITABLE FORM STARTS HERE        */}
            {/* ========================================== */}
            <form ref={formRef} onSubmit={(e) => handleInlineSave(e, false)} className="bg-slate-50/50 p-6 rounded-xl border border-slate-200 shadow-sm relative">

              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-6 flex items-center gap-2">
                💰 6. Test & Scheduling
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">Editable</span>
              </h2>

              {/* 🔐 ATTEMPT 1: INITIAL TEST */}
              <div className="mb-10">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  1️⃣ Initial Test Fee & Schedule
                </h3>
                
                {lead.testFeeVerifyStatus === 'Rejected' && lead.testFeeRejectReason && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                    <strong className="block uppercase tracking-wider text-[10px] text-red-600 mb-1">HR Rejection Reason:</strong>
                    <span className="text-sm text-red-800 font-bold">{lead.testFeeRejectReason}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SCHEDULING */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-4 flex items-center gap-2">📅 Schedule Test</h4>
                      <div className="mb-4">
                        <label className={labelStyle}>Test Date {isInitialDateLocked && '🔒'}</label>
                        <input 
                          type="date" 
                          name="testDate" 
                          defaultValue={formatDate(lead.testDate)} 
                          className={isInitialDateLocked ? lockedInputStyle : inputStyle} 
                          readOnly={isInitialDateLocked}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading || isInitialDateLocked} 
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      {lead.testFeeVerifyStatus !== 'Approved' 
                        ? "🔒 Payment Not Verified" 
                        : isInitialScored 
                          ? "🔒 Scored & Locked" 
                          : isPastDate(lead.testDate) 
                            ? "🔒 Date Passed" 
                            : "📅 Schedule & Save Date"}
                    </button>
                  </div>
                  
                  {/* PAYMENT */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">💰 Collect Payment</h4>
                        {renderVerifyBadge(lead.testFeeVerifyStatus)}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className={labelStyle}>Test Fees (AED)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            name="testFeesAmount" 
                            defaultValue={lead.testFeesAmount} 
                            placeholder="0.00" 
                            className={lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                            readOnly={lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved'} 
                          />
                        </div>
                        <div>
                          <label className={labelStyle}>Payment Date</label>
                          <input 
                            type="date" 
                            name="paymentDate" 
                            defaultValue={formatDate(lead.paymentDate)} 
                            className={lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                            readOnly={lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved'} 
                          />
                        </div>
                      </div>
                      <div className="mb-6">
                        <label className={labelStyle}>Invoice No. (HR Only)</label>
                        <input 
                          type="text" 
                          name="invoiceNumber" 
                          defaultValue={lead.invoiceNumber} 
                          placeholder="Generated by HR" 
                          className={lockedInputStyle} 
                          readOnly 
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      {renderVerifyButton(lead.testFeeVerifyStatus || "Unsubmitted", () => sendForVerification('TEST'), "TEST")}
                      {renderUploadReceiptButton()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 🔐 ATTEMPT 2: RE-TEST */}
              {hasFailedExam && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-sm font-black text-red-700 uppercase tracking-wider border-b border-red-200 pb-3 mb-4 flex items-center gap-2">
                    🔄 Attempt 2: Re-Test Fee & Schedule
                  </h3>
                  
                  {lead.reTestFeeVerifyStatus === 'Rejected' && lead.reTestFeeRejectReason && (
                    <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                      <strong className="block uppercase tracking-wider text-[10px] text-red-600 mb-1">HR Rejection Reason:</strong>
                      <span className="text-sm text-red-800 font-bold">{lead.reTestFeeRejectReason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SCHEDULING */}
                    <div className="bg-red-50/30 p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-4 flex items-center gap-2">📅 Schedule Re-Test</h4>
                        <div className="mb-4">
                          <label className={labelStyle}>Re-Test Date {isRetestDateLocked && '🔒'}</label>
                          <input 
                            type="date" 
                            name="reTestDate" 
                            defaultValue={formatDate(lead.reTestDate)} 
                            className={isRetestDateLocked ? lockedInputStyle : `${inputStyle} focus:ring-red-500`} 
                            readOnly={isRetestDateLocked} 
                          />
                        </div>
                      </div>
                      <button 
                        type="submit" 
                        disabled={loading || isRetestDateLocked} 
                        className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                      >
                        {lead.reTestFeeVerifyStatus !== 'Approved' 
                          ? "🔒 Payment Not Verified" 
                          : isRetestScored 
                            ? "🔒 Scored & Locked" 
                            : isPastDate(lead.reTestDate) 
                              ? "🔒 Date Passed" 
                              : "📅 Schedule & Save Date"}
                      </button>
                    </div>

                    {/* PAYMENT */}
                    <div className="bg-red-50/30 p-5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">💰 Collect Re-Test Payment</h4>
                          {renderVerifyBadge(lead.reTestFeeVerifyStatus)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className={labelStyle}>Re-Test Fee (AED)</label>
                            <input 
                              type="number" 
                              step="0.01" 
                              name="reTestFeesAmount" 
                              defaultValue={lead.reTestFeesAmount} 
                              placeholder="0.00" 
                              className={lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved' ? lockedInputStyle : `${inputStyle} focus:ring-red-500`} 
                              readOnly={lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved'} 
                            />
                          </div>
                          <div>
                            <label className={labelStyle}>Payment Date</label>
                            <input 
                              type="date" 
                              name="reTestPaymentDate" 
                              defaultValue={formatDate(lead.reTestPaymentDate)} 
                              className={lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved' ? lockedInputStyle : `${inputStyle} focus:ring-red-500`} 
                              readOnly={lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved'} 
                            />
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className={labelStyle}>Invoice No. (HR Only)</label>
                          <input 
                            type="text" 
                            name="reTestInvoiceNumber" 
                            defaultValue={lead.reTestInvoiceNumber} 
                            placeholder="Generated by HR" 
                            className={lockedInputStyle} 
                            readOnly 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {renderVerifyButton(lead.reTestFeeVerifyStatus || "Unsubmitted", () => sendForVerification('RETEST'), "RETEST", "bg-slate-400")}
                        {renderUploadReceiptButton()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔐 DYNAMIC BOXES (Reschedules & Attempt 3+) */}
              {otherPayments.filter(p => p.isAutoRetest || p.isAutoReschedule).map((payment) => {
                const isApproved = payment.status === 'Approved';
                const isPendingOrApproved = payment.status === 'Pending' || payment.status === 'Approved';
                const isScoredOrPast = evalsCount >= payment.attempt || isPastDate(payment.testDate);
                const isDynamicDateLocked = !isApproved || isScoredOrPast;

                return (
                  <div key={payment.id} className="mb-10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center border-b border-orange-200 pb-3 mb-4">
                      <h3 className="text-sm font-black text-orange-700 uppercase tracking-wider flex items-center gap-2">
                        {payment.isAutoReschedule ? "⚠️" : "🔄"} {payment.name}
                      </h3>
                    </div>
                    
                    {payment.status === 'Rejected' && payment.rejectReason && (
                      <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                        <strong className="block uppercase tracking-wider text-[10px] text-red-600 mb-1">HR Rejection Reason:</strong>
                        <span className="text-sm text-red-800 font-bold">{payment.rejectReason}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* SCHEDULING */}
                      <div className="bg-orange-50/30 p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-4 flex items-center gap-2">📅 Schedule {payment.isAutoReschedule ? "Reschedule" : "Re-Test"}</h4>
                          <div className="mb-4">
                            <label className={labelStyle}>New Date {isDynamicDateLocked && '🔒'}</label>
                            <input 
                              type="date" 
                              value={payment.testDate} 
                              onChange={(e) => updatePaymentRow(payment.id, 'testDate', e.target.value)} 
                              className={isDynamicDateLocked ? lockedInputStyle : `${inputStyle} focus:ring-orange-500`} 
                              readOnly={isDynamicDateLocked} 
                            />
                          </div>
                        </div>
                        <button 
                          type="submit" 
                          disabled={loading || isDynamicDateLocked} 
                          className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:bg-slate-200 disabled:text-slate-400"
                        >
                          {!isApproved 
                            ? "🔒 Payment Not Verified" 
                            : (evalsCount >= payment.attempt) 
                              ? "🔒 Scored & Locked" 
                              : isPastDate(payment.testDate)
                                ? "🔒 Date Passed"
                                : "📅 Schedule & Save Date"}
                        </button>
                      </div>

                      {/* PAYMENT */}
                      <div className="bg-orange-50/30 p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">💰 Collect Payment</h4>
                            {renderVerifyBadge(payment.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className={labelStyle}>Fee Amount (AED)</label>
                              <input 
                                type="number" 
                                step="0.01" 
                                value={payment.amount} 
                                onChange={(e) => updatePaymentRow(payment.id, 'amount', e.target.value)} 
                                placeholder="0.00" 
                                className={isPendingOrApproved ? lockedInputStyle : `${inputStyle} focus:ring-orange-500`} 
                                readOnly={isPendingOrApproved} 
                              />
                            </div>
                            <div>
                              <label className={labelStyle}>Payment Date</label>
                              <input 
                                type="date" 
                                value={payment.date} 
                                onChange={(e) => updatePaymentRow(payment.id, 'date', e.target.value)} 
                                className={isPendingOrApproved ? lockedInputStyle : `${inputStyle} focus:ring-orange-500`} 
                                readOnly={isPendingOrApproved} 
                              />
                            </div>
                          </div>
                          <div className="mb-6">
                            <label className={labelStyle}>Invoice No. (HR Only)</label>
                            <input 
                              type="text" 
                              value={payment.invoice} 
                              placeholder="Generated by HR" 
                              className={lockedInputStyle} 
                              readOnly 
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          {renderVerifyButton(payment.status || "Unsubmitted", () => sendOtherForVerification(payment.id), payment.id, "bg-slate-400")}
                          {renderUploadReceiptButton()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* 🔐 SERVICE AGREEMENT FEES */}
              <div className="mb-10">
                <div className="flex justify-between items-end border-b border-emerald-200 pb-3 mb-4">
                  <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider">🤝 Service Agreement Processing</h3>
                  <div className="flex items-center gap-2">
                    {renderVerifyBadge(lead.saFeeVerifyStatus)}
                    
                    {!isExamPassed ? (
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                        🔒 Locked until Exam Passed
                      </span>
                    ) : (!lead.saFeeVerifyStatus || lead.saFeeVerifyStatus === "Unsubmitted" || lead.saFeeVerifyStatus === "Rejected") ? (
                      <button 
                        type="button" 
                        onClick={() => sendForVerification('SA')}
                        disabled={verifyLoading === 'SA'}
                        className="text-[10px] font-bold bg-emerald-600 text-white px-4 py-1.5 rounded-full hover:bg-emerald-700 transition-colors shadow-sm disabled:bg-slate-400"
                      >
                        {verifyLoading === 'SA' ? "Sending..." : "📤 Send for Verification"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {!isExamPassed && (
                  <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-sm">
                    <strong className="block uppercase tracking-wider text-[10px] text-amber-700 mb-1">🔒 Locked</strong>
                    <span className="text-sm text-amber-900 font-bold">Service Agreement cannot be processed until the candidate passes the exam.</span>
                  </div>
                )}

                {lead.saFeeVerifyStatus === 'Rejected' && lead.saFeeRejectReason && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                    <strong className="block uppercase tracking-wider text-[10px] text-red-600 mb-1">HR Rejection Reason:</strong>
                    <span className="text-sm text-red-800 font-bold">{lead.saFeeRejectReason}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-emerald-50/30 p-5 rounded-xl border border-emerald-100 shadow-sm relative">
                  <div>
                    <label className={labelStyle}>Agreement Fee (AED)</label>
                    <input 
                      type="number" step="0.01" name="serviceAgreementAmount" defaultValue={lead.serviceAgreementAmount} placeholder="0.00" 
                      className={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : `${inputStyle} focus:ring-emerald-500`} 
                      readOnly={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Total Payment (AED)</label>
                    <input 
                      type="number" step="0.01" name="serviceAgreementTotal" defaultValue={lead.serviceAgreementTotal} placeholder="0.00" 
                      className={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : `${inputStyle} focus:ring-emerald-500 bg-emerald-50`} 
                      readOnly={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Invoice No. (HR Only)</label>
                    <input 
                      type="text" name="serviceAgreementInvoice" defaultValue={lead.serviceAgreementInvoice} placeholder="Generated by HR" 
                      className={lockedInputStyle} 
                      readOnly 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Payment Date</label>
                    <input 
                      type="date" name="serviceAgreementPaymentDate" defaultValue={formatDate(lead.serviceAgreementPaymentDate)} 
                      className={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : `${inputStyle} focus:ring-emerald-500`} 
                      readOnly={!isExamPassed || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                    />
                  </div>
                  <div className="md:col-span-4 mt-1">
                    {renderUploadReceiptButton()}
                  </div>
                </div>
              </div>

              {/* ♾️ DYNAMIC OTHER PAYMENTS LEDGER (Fines & Misc Only) */}
              <div className="mb-10 border-t-2 border-dashed border-slate-300 pt-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">➕ Additional / Misc Payments</h3>
                    <p className="text-xs text-slate-500 mt-1">For fines or miscellaneous fees only.</p>
                  </div>
                  <button type="button" onClick={addPaymentRow} className="text-xs font-bold bg-white text-slate-700 border border-slate-300 px-4 py-2 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                    + Add New Ledger Row
                  </button>
                </div>
                
                {otherPayments.filter(p => !p.isAutoRetest && !p.isAutoReschedule).length === 0 ? (
                  <div className="bg-white/50 p-6 rounded-xl border border-slate-200 text-center text-sm text-slate-500 italic shadow-sm">
                    No additional payments logged. Click the button above to add a fine or misc fee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otherPayments.filter(p => !p.isAutoRetest && !p.isAutoReschedule).map((payment) => {
                      const isPendingOrApproved = payment.status === 'Pending' || payment.status === 'Approved';
                      return (
                        <div key={payment.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                          
                          {/* HEADER OF THE CUSTOM ROW (Badges, Verify Button, Remove Row) */}
                          <div className="md:col-span-12 flex justify-between items-center border-b border-slate-100 pb-3 mb-2">
                            <div className="flex items-center gap-3">
                              {renderVerifyBadge(payment.status)}
                              {(!payment.status || payment.status === "Unsubmitted" || payment.status === "Rejected") && (
                                <button type="button" onClick={() => sendOtherForVerification(payment.id)} disabled={verifyLoading === payment.id} className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors disabled:bg-slate-400">
                                  {verifyLoading === payment.id ? "Sending..." : "Send for Verification"}
                                </button>
                              )}
                            </div>
                            
                            {(!payment.status || payment.status === "Unsubmitted" || payment.status === "Rejected") && (
                              <button 
                                type="button" 
                                onClick={() => removePaymentRow(payment.id)} 
                                className="text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1"
                              >
                                ✕ Remove Row
                              </button>
                            )}
                          </div>
                          
                          <div className="md:col-span-4">
                            <label className={labelStyle}>Payment Name / Reason</label>
                            <input type="text" value={payment.name} onChange={(e) => updatePaymentRow(payment.id, 'name', e.target.value)} placeholder="e.g. Late Fine" className={isPendingOrApproved ? lockedInputStyle : inputStyle} readOnly={isPendingOrApproved} required />
                          </div>
                          <div className="md:col-span-3">
                            <label className={labelStyle}>Amount (AED)</label>
                            <input type="number" step="0.01" value={payment.amount} onChange={(e) => updatePaymentRow(payment.id, 'amount', e.target.value)} placeholder="0.00" className={isPendingOrApproved ? lockedInputStyle : inputStyle} readOnly={isPendingOrApproved} required />
                          </div>
                          <div className="md:col-span-2">
                            <label className={labelStyle}>Invoice No.</label>
                            <input type="text" value={payment.invoice} className={lockedInputStyle} readOnly placeholder="HR Only" />
                          </div>
                          <div className="md:col-span-3">
                            <label className={labelStyle}>Payment Date</label>
                            <input type="date" value={payment.date} onChange={(e) => updatePaymentRow(payment.id, 'date', e.target.value)} className={isPendingOrApproved ? lockedInputStyle : inputStyle} readOnly={isPendingOrApproved} />
                          </div>
                          
                          <div className="md:col-span-12 mt-1">
                            {renderUploadReceiptButton()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 💭 7. FOLLOW-UPS & NOTES */}
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-5 flex items-center gap-2 mt-12">
                💭 7. Follow-Ups, Feedback & Notes
              </h2>
              
              <div className="mb-6 bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                <label className="block text-sm font-bold text-blue-800 uppercase tracking-wider mb-2">
                  ⭐ Feedback / Conversion Status
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <select 
                    name="feedbackStatus" 
                    value={feedbackSelect} 
                    onChange={(e) => setFeedbackSelect(e.target.value)} 
                    className={`${inputStyle} font-semibold bg-blue-50/50 border-blue-200 text-blue-800`}
                  >
                    <option value="">Pending Update...</option>
                    {FEEDBACK_OPTIONS.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                    <option value="Others">Others (Custom)</option>
                  </select>
                  {feedbackSelect === "Others" && (
                    <div className="w-full animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        type="text" 
                        name="feedbackStatusOther" 
                        defaultValue={isCustomFeedback ? initialFeedback : ""} 
                        placeholder="Type custom status..." 
                        className={`${inputStyle} border-blue-300 font-semibold`} 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <div>
                  <label className={labelStyle}>Last Call Date</label>
                  <input type="date" name="lastCallDate" defaultValue={formatDate(lead.lastCallDate)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Next Follow-up Date</label>
                  <input type="date" name="followUpDate" defaultValue={formatDate(lead.followUpDate)} className={inputStyle} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Follow-up Remarks</label>
                  <input type="text" name="followUpRemarks" defaultValue={lead.followUpRemarks} placeholder="Quick follow-up notes..." className={inputStyle} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm">
                <label className={labelStyle}>Primary Sales Remarks</label>
                <textarea name="salesRemarks" defaultValue={lead.salesRemarks} rows={4} placeholder="Detailed sales notes and client context..." className={inputStyle}></textarea>
              </div>

              {/* MASTER SAVE BUTTON */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:bg-slate-400 w-full md:w-auto"
                >
                  {loading ? "Saving..." : "💾 Save All Updates"}
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN - ACTIVITY TIMELINE */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6 flex flex-col max-h-[850px] overflow-hidden">
              <div className="p-5 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 relative z-20">
                <h3 className="font-bold text-slate-800">⏱️ Activity History</h3>
                <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">{lead.activities?.length || 0} Events</span>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {(!lead.activities || lead.activities.length === 0) ? (
                  <p className="text-slate-400 text-sm italic text-center py-10">No activities recorded yet.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute top-2 bottom-0 left-[11px] w-[2px] bg-slate-100"></div>
                    <div className="space-y-6">
                      {lead.activities.map((activity: any) => {
                        const actionStr = activity.action.toLowerCase();
                        let dotColor = "bg-slate-400"; let bgColor = "bg-white"; let borderColor = "border-slate-200";
                        
                        if (actionStr.includes("transfer") || actionStr.includes("approve") || actionStr.includes("document")) { 
                          dotColor = "bg-emerald-500"; borderColor = "border-emerald-200"; bgColor = "bg-emerald-50/30"; 
                        } else if (actionStr.includes("deny") || actionStr.includes("fail") || actionStr.includes("reject")) { 
                          dotColor = "bg-red-500"; borderColor = "border-red-200"; bgColor = "bg-red-50/30"; 
                        } else if (actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test")) { 
                          dotColor = "bg-purple-500"; borderColor = "border-purple-200"; bgColor = "bg-purple-50/30"; 
                        } else if (actionStr.includes("update") || actionStr.includes("stage") || actionStr.includes("sales") || actionStr.includes("payment") || actionStr.includes("hr")) { 
                          dotColor = "bg-blue-500"; borderColor = "border-blue-200"; bgColor = "bg-blue-50/30"; 
                        }

                        return (
                          <div key={activity.id} className="relative flex items-start gap-4 z-10 group">
                            <div className="flex flex-col items-center pt-1.5 shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 ${borderColor} z-10`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                              </div>
                            </div>
                            <div className={`flex-1 ${bgColor} p-4 rounded-xl border ${borderColor} shadow-sm transition-all hover:shadow-md`}>
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <span className="font-bold text-slate-800 text-sm">{activity.action}</span>
                                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                                  {new Date(activity.createdAt).toLocaleDateString("en-GB")}
                                </span>
                              </div>
                              {activity.details && <p className="text-xs text-slate-600 mb-3 leading-relaxed">{activity.details}</p>}
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium border-t border-slate-200/60 pt-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                                  {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                                </span>
                                {activity.user?.name || "System"}
                                <span className="text-slate-300">•</span>
                                <span suppressHydrationWarning>{new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
          <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
        </div>
      )}
    </div>
  );
}