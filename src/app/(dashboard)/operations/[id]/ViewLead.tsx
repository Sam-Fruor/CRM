// src/app/(dashboard)/operations/[id]/ViewLead.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DocumentVault from "@/components/DocumentVault";
import { updateOpsFile } from "@/app/actions/opsActions"; 
import { requestPaymentVerification, PaymentType } from "@/app/actions/paymentActions"; 
import ActivityTimeline from "@/components/ActivityTimeline";

const FEEDBACK_OPTIONS = [
  "Converted", 
  "Not Responding", 
  "Not Interested", 
  "Not Eligible", 
  "Client is for Next Test"
];

const caseStatuses = [
  "Not Interested/Dropped Off", "Client Not Enrolled", "Pending Payment 1 (Service Agreement)", 
  "Stage 1 Under Process", "Stage 2 Under Process", "Stage 2 (Ops & HR)",
  "Stage 2: HR - Waiting for Job Offer", "Stage 2: HR - Waiting for Work Permit",
  "Stage 2: Ops - Welcome & Docs", "Stage 2: Ops - Collect Job Offer Payment", "Stage 2: Ops - Collect WP Payment",
  "Job Offer Letter Pending", "Signed Job Offer Letter Pending", "Pending Payment 2 (Job Offer Letter)", 
  "Work Permit Under Process", "Signed Work Permit Pending", "Pending Payment 3 (Work Permit)", 
  "Pending Payment 4 (Insurance)", "Visa Appointment Pending", "Visa Status Under process", 
  "Visa Approved", "Visa Rejected", "School Fees Pending", "Flight Ticket Pending"
];

export default function OpsViewLead({ lead, activeTab }: { lead: any, activeTab: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<string | null>(null);
  
  // 🗂️ Quick Vault Modal State
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultDefaultCategory, setVaultDefaultCategory] = useState<string>("");
  const [vaultDefaultType, setVaultDefaultType] = useState<string>("");

  // 📑 LOCAL TAB STATE
  const [currentTab, setCurrentTab] = useState(activeTab || "ops");
  
  // ✏️ INLINE EDIT STATES (Ops can edit Profile, Docs, and Ops Tab)
  const [isEditingProfile, setIsEditingProfile] = useState(false); 
  const [isEditingDocs, setIsEditingDocs] = useState(false);       

  // 🧠 OPS ROUTING STATE
  const [currentRoute, setCurrentRoute] = useState(lead.caseStatus);

  // 🔽 SMART COLLAPSIBLE PAYMENT BLOCKS STATE
  const [expandedOpsBlocks, setExpandedOpsBlocks] = useState<Record<string, boolean>>(() => {
    // Helper to see if a payment is assigned but NOT fully approved yet
    const needsAction = (amount: any, status: any) => parseFloat(amount) > 0 && status !== 'Approved';
    
    // Check in chronological order of the process
    let active = "";
    if (needsAction(lead.jobOfferPending, lead.jobOfferVerifyStatus)) active = "JOB_OFFER";
    else if (needsAction(lead.workPermitPending, lead.workPermitVerifyStatus)) active = "WORK_PERMIT";
    else if (needsAction(lead.insurancePending, lead.insuranceVerifyStatus)) active = "INSURANCE";
    else if (needsAction(lead.schoolFeesPending, lead.schoolFeesVerifyStatus)) active = "SCHOOL_FEES";
    else if (needsAction(lead.flightTicketPending, lead.flightTicketVerifyStatus)) active = "FLIGHT_TICKET";
    else if (needsAction(lead.otherPending, lead.otherPendingVerifyStatus)) active = "OTHER_OPS";

    return {
      "JOB_OFFER": active === "JOB_OFFER",
      "WORK_PERMIT": active === "WORK_PERMIT",
      "INSURANCE": active === "INSURANCE",
      "SCHOOL_FEES": active === "SCHOOL_FEES",
      "FLIGHT_TICKET": active === "FLIGHT_TICKET",
      "OTHER_OPS": active === "OTHER_OPS",
    };
  });

  const toggleOpsBlock = (typeCode: string) => {
    setExpandedOpsBlocks(prev => ({ ...prev, [typeCode]: !prev[typeCode] }));
  };

  const formRef = useRef<HTMLFormElement>(null);

  // 🛠️ FORMATTING HELPERS
  const formatDate = (dateString?: string | null) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
  const formatDisplayDate = (dateString?: string | null) => dateString ? new Date(dateString).toLocaleDateString("en-GB") : "N/A";

  const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : [];
  const evalsCount = lead.testEvaluations?.length || 0;

  // 🕒 HISTORY GENERATION 
  let combinedHistory = (lead.testEvaluations || []).map((t: any) => ({ ...t, isMissed: false }));
  
  const resched1 = otherPayments.find((p: any) => p.isAutoReschedule && p.attempt === 1 && p.testDate);
  if (resched1 && lead.testDate) combinedHistory.push({ id: 'noshow-1', createdAt: new Date(lead.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  
  const resched2 = otherPayments.find((p: any) => p.isAutoReschedule && p.attempt === 2 && p.testDate);
  if (resched2 && lead.reTestDate) combinedHistory.push({ id: 'noshow-2', createdAt: new Date(lead.reTestDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);

  otherPayments.filter((p: any) => p.isAutoReschedule && p.attempt > 2 && p.testDate).forEach((resched: any) => {
    const orig = otherPayments.find((p: any) => p.isAutoRetest && p.attempt === resched.attempt);
    if (orig && orig.testDate) combinedHistory.push({ id: `noshow-${resched.attempt}`, createdAt: new Date(orig.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  });

  combinedHistory.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  combinedHistory = combinedHistory.map((test: any, index: number) => ({ ...test, attemptLabel: `Attempt ${index + 1}` }));
  combinedHistory.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 💰 FINANCIAL CALCULATIONS
  const totalDealAmount = parseFloat(lead.serviceAgreementTotal) || 0;
  const totalCollectedAmount = parseFloat(lead.serviceAgreementAmount) || 0;
  const remainingBalance = totalDealAmount - totalCollectedAmount;

  // 🎨 STYLING CONSTANTS
  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 relative";
  const labelStyle = "text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const valueStyle = "text-sm font-semibold text-slate-800";
  const readOnlyGridValue = "text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100";
  const baseInputStyle = "w-full p-2.5 text-sm rounded-lg outline-none transition-all shadow-sm border ";
  const inputStyle = baseInputStyle + "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-blue-500 font-medium";
  const lockedInputStyle = baseInputStyle + "bg-slate-100 border-slate-200 text-slate-500 font-bold pointer-events-none cursor-not-allowed";

  const docs = lead.documentStatus || {};
  const [hasJustUploaded, setHasJustUploaded] = useState(false);

  // 🛡️ VALIDATION: Generic check to see if ANY receipt exists
  const hasReceiptUploaded = (expectedDocType: string) => {
    if (hasJustUploaded) return true;
    let filesObj = lead.documentFiles;
    if (typeof filesObj === 'string') {
      try { filesObj = JSON.parse(filesObj); } catch(e) { filesObj = {}; }
    }
    if (!filesObj) return false;
    const filesArray = Array.isArray(filesObj) ? filesObj : Object.values(filesObj);
    return filesArray.some((f: any) => f?.category === 'Financial' && String(f?.documentType).toLowerCase() === expectedDocType.toLowerCase());
  };

  const handleInlineSave = async (e?: React.FormEvent<HTMLFormElement>, silent = false) => {
    if (e) e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    const formData = new FormData(formRef.current);
    try {
      await updateOpsFile(lead.id, formData); 
      setIsEditingDocs(false);
      setIsEditingProfile(false);
      if (!silent) alert("✅ Operations Updates Saved Successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      if (!silent) alert("Failed to save updates.");
    } finally {
      setLoading(false);
    }
  };

  const sendForVerification = async (typeCode: string, receiptName: string, dateField: string) => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    
    if (!formData.get(dateField)) {
      return alert("❌ ERROR: Please enter the Payment Date before submitting for verification.");
    }

    if (!hasReceiptUploaded(receiptName)) {
      return alert(`❌ ERROR: You must upload the '${receiptName}' to the Document Vault before sending for HR Verification. Please click 'Upload Receipt'.`);
    }

    setVerifyLoading(typeCode);
    try {
      await handleInlineSave(undefined, true);
      await requestPaymentVerification(lead.id, typeCode as PaymentType);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to send verification request.");
    } finally {
      setVerifyLoading(null);
    }
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
      <button type="button" onClick={onClick} disabled={verifyLoading === loadingId} className={`w-full py-3.5 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:${disabledStyle} bg-emerald-600 hover:bg-emerald-700`}>
        {verifyLoading === loadingId ? "Sending..." : "📤 Submit for Verification"}
      </button>
    );
  };

  const openVaultPreFilled = (category: string, type: string) => {
    setVaultDefaultCategory(category);
    setVaultDefaultType(type);
    setIsVaultModalOpen(true);
  };

  const renderUploadReceiptButton = (docType: string) => (
    <button 
      type="button" 
      onClick={() => openVaultPreFilled("Financial", docType)}
      className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[11px] font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
    >
      ⬆️ Upload Receipt
    </button>
  );

  const getExpiryCountdown = (dateString?: string | null) => {
    if (!dateString) return <span className="text-slate-400">-</span>;
    const exp = new Date(dateString);
    const now = new Date();
    now.setHours(0,0,0,0);
    if (exp < now) return <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Expired</span>;
    let m = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
    let d = exp.getDate() - now.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); }
    if (m === 0 && d === 0) return <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">Expires Today</span>;
    return <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">{m}m {d}d</span>;
  };

  const renderProfileField = (label: string, name: string, value: any, type: string = "text") => (
    <div>
      <p className={labelStyle}>{label}</p>
      {isEditingProfile ? (
        <input 
          type={type} name={name} 
          defaultValue={type === "date" ? formatDate(value) : value || ""} 
          disabled={currentTab !== "profile"}
          className={inputStyle} 
        />
      ) : (
        <p className={valueStyle}>{type === "date" ? formatDisplayDate(value) : value || "N/A"}</p>
      )}
    </div>
  );

  const getLatestDocUrl = (expectedType: string) => {
    if (!lead.documentFiles) return null;
    let filesObj = lead.documentFiles;
    if (typeof filesObj === 'string') {
      try { filesObj = JSON.parse(filesObj); } catch(e) { filesObj = {}; }
    }
    const filesArray = Array.isArray(filesObj) ? filesObj : Object.values(filesObj);
    const matchingFiles = filesArray.filter((f: any) => f?.documentType === expectedType);
    if (matchingFiles.length > 0) return matchingFiles[matchingFiles.length - 1].url;
    return null;
  };

  const renderDocRow = (
    title: string, uploadCat: string, uploadType: string, isUploaded: boolean, 
    issueName?: string, issueDate?: string, expiryName?: string, expiryDate?: string, 
    docNumName?: string, docNum?: string
  ) => {
    const docUrl = getLatestDocUrl(uploadType);

    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">{isUploaded ? "✅" : "❌"}</span>
            <div>
              <p className="font-bold text-slate-800 text-sm">{title}</p>
              <div className="mt-1">
                {docNumName && isEditingDocs ? (
                  <input 
                    type="text" name={docNumName} defaultValue={docNum || ""} disabled={currentTab !== "documents"}
                    placeholder={`${title} No.`} 
                    className="w-[140px] p-1 border border-blue-300 bg-blue-50/30 rounded text-slate-800 text-[10px] font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner" 
                  />
                ) : docNum ? (
                  <p className="text-xs text-slate-500 font-mono tracking-wider font-bold mt-0.5">{docNum}</p>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        
        {issueName !== undefined ? (
          <>
            <td className="py-4 px-4 text-xs font-medium text-slate-600">
              {isEditingDocs ? (
                <input type="date" name={issueName} defaultValue={formatDate(issueDate)} disabled={currentTab !== "documents"} className="w-[110px] p-1.5 border border-blue-300 bg-blue-50/30 rounded text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner" />
              ) : formatDisplayDate(issueDate)}
            </td>
            <td className="py-4 px-4 text-xs font-medium text-slate-600">
              {isEditingDocs ? (
                <input type="date" name={expiryName} defaultValue={formatDate(expiryDate)} disabled={currentTab !== "documents"} className="w-[110px] p-1.5 border border-blue-300 bg-blue-50/30 rounded text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner" />
              ) : formatDisplayDate(expiryDate)}
            </td>
            <td className="py-4 px-4">{getExpiryCountdown(expiryDate)}</td>
          </>
        ) : (
          <td colSpan={3} className="py-4 px-4 text-center text-xs text-slate-400 italic bg-slate-50/50">- Not Applicable -</td>
        )}

        <td className="py-4 px-4 text-right">
          <div className="flex justify-end gap-2 items-center">
            <button type="button" onClick={() => openVaultPreFilled("Client", uploadType)} className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded hover:bg-blue-100 transition-colors flex items-center gap-1">
              🚀 Upload to Vault
            </button>
            {docUrl ? (
              <a href={docUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-slate-800 text-white px-3 py-2 rounded hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer">
                👁️ View
              </a>
            ) : (
              <button type="button" disabled className="text-[10px] font-bold bg-slate-300 text-slate-500 px-3 py-2 rounded cursor-not-allowed flex items-center gap-1">
                👁️ View
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const renderReadOnlySalesFollowUp = (tabTitle: string) => (
    <div className="mt-8 border-t-2 border-slate-200 pt-6 opacity-80">
      <h2 className="text-sm font-bold text-slate-500 pb-4 flex items-center gap-2">
        💭 {tabTitle} Notes (Read-Only from Sales)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-5 rounded-xl border border-slate-200">
        <div><p className={labelStyle}>Conversion Status</p><p className={readOnlyGridValue}>{lead.feedbackStatus || "Pending"}</p></div>
        <div><p className={labelStyle}>Last Call Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.lastCallDate)}</p></div>
        <div><p className={labelStyle}>Next Follow-up Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.followUpDate)}</p></div>
        <div className="md:col-span-3"><p className={labelStyle}>Follow-up Remarks</p><p className={readOnlyGridValue}>{lead.followUpRemarks || "-"}</p></div>
      </div>
    </div>
  );

  // 📝 COLLAPSIBLE PREMIUM OPS PAYMENT BLOCK GENERATOR
  const renderOpsPaymentBlock = (
    title: string, pendingAmount: number | null, 
    dateName: string, dateValue: any, 
    remarksName: string, remarksValue: string, 
    invoiceValue: string, 
    statusValue: string, rejectReason: string, 
    receiptName: string, typeCode: string
  ) => {
    if (!pendingAmount || pendingAmount <= 0) return null; // Hide if HR hasn't requested this payment
    
    const isLocked = statusValue === 'Pending' || statusValue === 'Approved';
    const isExpanded = expandedOpsBlocks[typeCode];

    return (
      <div className="mb-6 border border-emerald-200 rounded-xl overflow-hidden shadow-sm bg-white animate-in fade-in">
        
        {/* COLLAPSIBLE HEADER */}
        <button 
          type="button"
          onClick={() => toggleOpsBlock(typeCode)}
          className="w-full flex justify-between items-center bg-emerald-50/50 p-4 hover:bg-emerald-100/50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 inset-0"
        >
          <h3 className="text-sm font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            🏷️ {title} Processing
          </h3>
          <div className="flex items-center gap-4">
            {renderVerifyBadge(statusValue)}
            <span className="text-emerald-600 text-lg transition-transform duration-200">
              {isExpanded ? "▲" : "▼"}
            </span>
          </div>
        </button>

        {/* COLLAPSIBLE CONTENT */}
        {isExpanded && (
          <div className="p-6 border-t border-emerald-100">
            {statusValue === 'Rejected' && rejectReason && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                <strong className="block uppercase tracking-wider text-[10px] text-red-600 mb-1">HR Rejection Reason:</strong>
                <span className="text-sm text-red-800 font-bold">{rejectReason}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
                💰 Collect & Verify
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side: Input Fields */}
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelStyle}>Amount Assigned (AED)</label>
                    <input type="text" value={`${pendingAmount} AED`} className={lockedInputStyle} readOnly />
                  </div>
                  <div>
                    <label className={labelStyle}>Payment Date</label>
                    <input 
                      type="date" name={dateName} disabled={currentTab !== "ops"} defaultValue={formatDate(dateValue)} 
                      className={isLocked ? lockedInputStyle : inputStyle} 
                      readOnly={isLocked} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelStyle}>Payment Remarks / Notes</label>
                    <input 
                      type="text" name={remarksName} disabled={currentTab !== "ops"} defaultValue={remarksValue || ""} 
                      placeholder="Notes from Operations..." 
                      className={isLocked ? lockedInputStyle : inputStyle} 
                      readOnly={isLocked} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelStyle}>Invoice No. (HR Only)</label>
                    <input type="text" value={invoiceValue || ""} placeholder="Generated by HR" className={lockedInputStyle} readOnly />
                  </div>
                </div>
              </div>
              
              {/* Right Side: Big Action Buttons */}
              <div className="flex flex-col justify-center space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2">Required Actions</p>
                {renderUploadReceiptButton(receiptName)}
                {renderVerifyButton(statusValue || "Unsubmitted", () => sendForVerification(typeCode, receiptName, dateName), typeCode, "bg-slate-400")}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const masterLedger = [
    { name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: lead.testFeeVerifyStatus, collector: "Sales", receiptType: "Initial Test Receipt" },
    { name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: lead.reTestFeeVerifyStatus, collector: "Sales", receiptType: "Re-Test Receipt" },
    { name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: lead.saFeeVerifyStatus, collector: "Sales", receiptType: "Service Agreement Receipt" },
    { name: "Job Offer", amount: lead.jobOfferPending, date: lead.jobOfferPaymentDate, status: lead.jobOfferVerifyStatus, collector: "Ops", receiptType: "Job Offer Receipt" },
    { name: "Work Permit", amount: lead.workPermitPending, date: lead.workPermitPaymentDate, status: lead.workPermitVerifyStatus, collector: "Ops", receiptType: "Work Permit Receipt" },
    { name: "Insurance", amount: lead.insurancePending, date: lead.insurancePaymentDate, status: lead.insuranceVerifyStatus, collector: "Ops", receiptType: "Insurance Receipt" },
    { name: "School Fees", amount: lead.schoolFeesPending, date: lead.schoolFeesPaymentDate, status: lead.schoolFeesVerifyStatus, collector: "Ops", receiptType: "School Fees Receipt" },
    { name: "Flight Ticket", amount: lead.flightTicketPending, date: lead.flightTicketPaymentDate, status: lead.flightTicketVerifyStatus, collector: "Ops", receiptType: "Flight Ticket Receipt" },
    { name: "Other Ops Fee", amount: lead.otherPending, date: lead.otherPendingPaymentDate, status: lead.otherPendingVerifyStatus, collector: "Ops", receiptType: "Other Ops Receipt" },
    ...otherPayments.map((p: any) => ({ name: p.name, amount: p.amount, date: p.date, status: p.status, collector: "Sales/Ops", receiptType: `Misc Receipt - ${p.name}` }))
  ].filter(item => item.amount);

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">

      {/* 🗂️ QUICK VAULT MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-600">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900 shrink-0">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🗂️</span> Document Vault Hub
              </h2>
              <button type="button" onClick={() => setIsVaultModalOpen(false)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold">✕</button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
              <DocumentVault 
                leadId={lead.id} 
                existingDocs={lead.documentFiles} 
                defaultCategory={vaultDefaultCategory} 
                defaultType={vaultDefaultType} 
                onUploadSuccess={() => {
                  setIsVaultModalOpen(false); 
                  setHasJustUploaded(true);
                  router.refresh(); 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Operations File: {lead.givenName} {lead.surname}
          </h1>
          <p className="text-slate-500 text-sm">
            File is currently with: <span className="font-bold text-emerald-600 ml-1">{lead.caseStatus}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/operations/leads" className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm">
            Back to Queue
          </Link>
        </div>
      </div>

      {/* 🚀 MAIN WRAPPER FORM */}
      <form ref={formRef} onSubmit={(e) => handleInlineSave(e, false)}>
        
        {/* HIDDEN INPUTS TO PRESERVE CORE DATA IF NOT EDITING */}
        <input type="hidden" name="givenName" value={lead.givenName || ""} />
        <input type="hidden" name="surname" value={lead.surname || ""} />
        <input type="hidden" name="fatherName" value={lead.fatherName || ""} />
        <input type="hidden" name="dob" value={lead.dob ? new Date(lead.dob).toISOString() : ""} />
        <input type="hidden" name="nationality" value={lead.nationality || ""} />
        <input type="hidden" name="passportNum" value={lead.passportNum || ""} />
        <input type="hidden" name="residentIdNum" value={lead.residentIdNum || ""} />
        <input type="hidden" name="dlNumber" value={lead.dlNumber || ""} />
        <input type="hidden" name="callingNumber" value={lead.callingNumber || ""} />
        <input type="hidden" name="whatsappNumber" value={lead.whatsappNumber || ""} />
        <input type="hidden" name="email" value={lead.email || ""} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2">
            
            {/* 📑 CLIENT-SIDE TAB NAVIGATION */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-6 pb-2">
              <button type="button" onClick={() => setCurrentTab("profile")} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${currentTab === 'profile' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>👤 Lead Profile</button>
              <button type="button" onClick={() => setCurrentTab("documents")} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors flex items-center gap-2 ${currentTab === 'documents' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                🗂️ Documents & ID
                {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentTab === 'documents' ? 'bg-emerald-800 text-white' : 'bg-slate-300 text-slate-700'}`}>
                    {Object.keys(lead.documentFiles).length}
                  </span>
                )}
              </button>
              <button type="button" onClick={() => setCurrentTab("testing")} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${currentTab === 'testing' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>📝 Tests & Exams</button>
              <button type="button" onClick={() => setCurrentTab("sa")} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${currentTab === 'sa' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🤝 Service Agreement</button>
              
              <button type="button" onClick={() => setCurrentTab("ops")} className={`px-5 py-2.5 text-sm font-black rounded-lg transition-colors border-2 ${currentTab === 'ops' ? 'bg-slate-800 border-slate-800 text-white shadow-md' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'}`}>⚙️ Operations</button>
              <button type="button" onClick={() => setCurrentTab("hr")} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-colors ${currentTab === 'hr' ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>🏢 HR & Financials</button>
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 1: LEAD PROFILE (Editable by Ops)             */}
            {/* ================================================== */}
            <div className={currentTab === "profile" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              
              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-bold text-slate-800">📍 1. Routing Information</h2>
                  <button type="button" onClick={() => { if (isEditingProfile) handleInlineSave(); else setIsEditingProfile(true); }} disabled={loading} className={`text-[10px] font-bold px-3 py-1.5 rounded transition-colors shadow-sm disabled:opacity-50 ${isEditingProfile ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>
                    {loading && isEditingProfile ? "💾 Saving..." : isEditingProfile ? "💾 Done Editing" : "✏️ Edit Lead"}
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {renderProfileField("Lead Source", "leadSource", lead.leadSource)}
                  {renderProfileField("Category", "category", lead.category)}
                  {renderProfileField("Preferred Country", "countryPreferred", lead.countryPreferred)}
                  {renderProfileField("Slot Booking Date", "slotBookingDate", lead.slotBookingDate, "date")}
                  {renderProfileField("Test Date", "testDate", lead.testDate, "date")}
                </div>
              </div>

              <div className={sectionStyle}>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">👤 2. Client Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {renderProfileField("Full Name", "givenName", lead.givenName)}
                  {renderProfileField("Father's Name", "fatherName", lead.fatherName)}
                  {renderProfileField("Date of Birth", "dob", lead.dob, "date")}
                  {renderProfileField("Phone", "callingNumber", lead.callingNumber)}
                  {renderProfileField("WhatsApp", "whatsappNumber", lead.whatsappNumber)}
                  {renderProfileField("Email", "email", lead.email)}
                  <div className="md:col-span-3">
                    {renderProfileField("Nationality", "nationality", lead.nationality)}
                  </div>
                </div>
              </div>

              <div className={sectionStyle}>
                <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">💼 3. Experience & Agency History</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {renderProfileField("Home Exp", "experienceHome", lead.experienceHome, "number")}
                  {renderProfileField("GCC Exp", "experienceGCC", lead.experienceGCC, "number")}
                  {renderProfileField("Previous Agency", "previousAgency", lead.previousAgency)}
                  {renderProfileField("Prev. Country", "previousCountry", lead.previousCountry)}
                </div>
              </div>

              {renderReadOnlySalesFollowUp("Lead Profile")}
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 2: DOCUMENTS & ID DETAILS (Editable by Ops)   */}
            {/* ================================================== */}
            <div className={currentTab === "documents" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800">🗂️ Core ID Checklist & Expiry Tracker</h2>
                  <div className="flex gap-3 items-center">
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">Auto-Synced to Vault</span>
                    <button type="button" onClick={() => { if (isEditingDocs) handleInlineSave(); else setIsEditingDocs(true); }} disabled={loading} className={`text-[10px] font-bold px-3 py-1.5 rounded transition-colors shadow-sm disabled:opacity-50 ${isEditingDocs ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'}`}>
                      {loading && isEditingDocs ? "💾 Saving..." : isEditingDocs ? "💾 Done Editing" : "✏️ Edit Dates & IDs"}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Document Type</th>
                        <th className="py-3 px-4 font-bold">Issue Date</th>
                        <th className="py-3 px-4 font-bold">Expiry Date</th>
                        <th className="py-3 px-4 font-bold">Expiring In</th>
                        <th className="py-3 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {renderDocRow("CV / RESUME", "Client", "CV / Resume", docs.resumeUploaded)}
                      {renderDocRow("PASSPORT", "Client", "Passport", docs.passportUploaded, "passportIssueDate", lead.passportIssueDate, "passportExpiry", lead.passportExpiry, "passportNum", lead.passportNum)}
                      {renderDocRow("DRIVING LICENCE", "Client", "Driving License", docs.dlUploaded, "dlIssueDate", lead.dlIssueDate, "dlExpiry", lead.dlExpiry, "dlNumber", lead.dlNumber)}
                      {renderDocRow("RESIDENT ID", "Client", "Emirates ID", docs.residentIdUploaded, "residentIdIssueDate", lead.residentIdIssueDate, "residentIdExp", lead.residentIdExp, "residentIdNum", lead.residentIdNum)}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* THE FULL DOCUMENT VAULT IS VISIBLE HERE! */}
              <div className="mt-8 border-t-2 border-slate-200 pt-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📂 Complete Document Vault</span>
                </h2>
                <DocumentVault 
                  leadId={lead.id} 
                  existingDocs={lead.documentFiles} 
                  onUploadSuccess={() => router.refresh()} 
                />
              </div>

              {renderReadOnlySalesFollowUp("Documents")}
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 3: TESTS, SCORES & SCHEDULING (READ ONLY)     */}
            {/* ================================================== */}
            <div className={currentTab === "testing" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>

              {/* 📝 EXAM SCORES & HISTORY */}
              {combinedHistory.length > 0 && (
                <div className="bg-purple-50/50 p-6 rounded-xl shadow-sm border border-purple-200 mb-6 animate-in fade-in duration-500">
                  <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-4 flex justify-between items-center">
                    <span className="flex items-center gap-2">📝 5. Exam Scores & History</span>
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
                          <p className={`text-sm font-bold mt-1 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
                            {lead.englishTestResult || "Pending"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                          <p className="text-2xl font-black text-slate-800">
                            {lead.drivingScore !== null ? lead.drivingScore : "-"}
                            <span className="text-sm text-slate-400 font-medium">/10</span>
                          </p>
                          <p className={`text-sm font-bold mt-1 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
                            {lead.yardTestResult || "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50/30 p-6 rounded-xl shadow-sm border border-blue-200 mb-6">
                <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-6 mt-2 flex items-center gap-2">
                  <span>💰 6. Test & Scheduling</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">Read-Only</span>
                </h2>

                <div className="mb-8">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">1️⃣ Initial Test Fee & Schedule</h3>
                    {renderVerifyBadge(lead.testFeeVerifyStatus)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <p className={labelStyle}>Test Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.testDate)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div><p className={labelStyle}>Test Fees (AED)</p><p className={readOnlyGridValue}>{lead.testFeesAmount ? `${lead.testFeesAmount} AED` : "-"}</p></div>
                      <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.invoiceNumber || "-"}</p></div>
                      <div className="col-span-2"><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.paymentDate)}</p></div>
                    </div>
                  </div>
                </div>

                {/* 🔄 ATTEMPT 2: RE-TEST (READ ONLY) */}
                {lead.reTestDate && (
                  <div className="mb-8">
                    <div className="flex justify-between items-center border-b border-red-200 pb-2 mb-4">
                      <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">🔄 Attempt 2: Re-Test Fee & Schedule</h3>
                      {renderVerifyBadge(lead.reTestFeeVerifyStatus)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-red-50/50 p-4 rounded-lg border border-red-100 shadow-sm">
                        <p className={labelStyle}>Re-Test Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.reTestDate)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-lg border border-red-100 shadow-sm">
                        <div><p className={labelStyle}>Re-Test Fee (AED)</p><p className={readOnlyGridValue}>{lead.reTestFeesAmount ? `${lead.reTestFeesAmount} AED` : "-"}</p></div>
                        <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.reTestInvoiceNumber || "-"}</p></div>
                        <div className="col-span-2"><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.reTestPaymentDate)}</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {renderReadOnlySalesFollowUp("Testing")}
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 4: SERVICE AGREEMENT (READ ONLY)              */}
            {/* ================================================== */}
            <div className={currentTab === "sa" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              
              <div className="mb-10 p-6 bg-white rounded-xl shadow-sm border border-emerald-200">
                <div className="flex justify-between items-end border-b border-emerald-200 pb-3 mb-4">
                  <h3 className="text-lg font-black text-emerald-800 uppercase tracking-wider">🤝 Service Agreement Processing</h3>
                  <div className="flex items-center gap-2">
                    {renderVerifyBadge(lead.saFeeVerifyStatus)}
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded shadow-sm">Read-Only</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                  <div><p className={labelStyle}>Agreement Fee (AED)</p><p className={readOnlyGridValue}>{lead.serviceAgreementAmount ? `${lead.serviceAgreementAmount} AED` : "-"}</p></div>
                  <div><p className={labelStyle}>Total Deal Amount (AED)</p><p className={readOnlyGridValue}>{lead.serviceAgreementTotal ? `${lead.serviceAgreementTotal} AED` : "-"}</p></div>
                  <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.serviceAgreementInvoice || "-"}</p></div>
                  <div><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.serviceAgreementPaymentDate)}</p></div>
                </div>
              </div>

              {renderReadOnlySalesFollowUp("Service Agreement")}
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 5: OPERATIONS (EDITABLE PAYMENT COLLECTION)   */}
            {/* ================================================== */}
            <div className={currentTab === "ops" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              
              <div className="bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-emerald-200">
                
                {/* 🚀 QUICK ROUTING DROPDOWN INSIDE OPERATIONS */}
                <div className="bg-white p-5 rounded-lg border border-emerald-300 shadow-sm mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="w-full">
                    <label className="block text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">Active Case Status (Route File)</label>
                    <select name="caseStatus" value={currentRoute} onChange={(e) => setCurrentRoute(e.target.value)} className={`${inputStyle} border-2 border-emerald-400 text-emerald-900 cursor-pointer`}>
                      <option disabled>------------------------</option>
                      {caseStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-auto shrink-0 mt-4 md:mt-0">
                    <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:bg-slate-400">
                      {loading ? "Saving..." : "💾 Update Status"}
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-emerald-900 border-b border-emerald-200 pb-3 mb-5 flex justify-between">
                  <span>💳 10. Operations Payment Collection</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded shadow-sm">Editable</span>
                </h2>

                {/* 🚀 REVERSED RENDER ORDER FOR COLLAPSIBLE ACCORDIONS */}
                {renderOpsPaymentBlock(
                  "Other / Misc", lead.otherPending, 
                  "otherPendingPaymentDate", lead.otherPendingPaymentDate, 
                  "otherPendingPaymentRemarks", lead.otherPendingPaymentRemarks, 
                  lead.otherPendingInvoice, 
                  lead.otherPendingVerifyStatus, lead.otherPendingRejectReason, 
                  "Other Ops Receipt", "OTHER_OPS"
                )}

                {renderOpsPaymentBlock(
                  "Flight Ticket", lead.flightTicketPending, 
                  "flightTicketPaymentDate", lead.flightTicketPaymentDate, 
                  "flightTicketPaymentRemarks", lead.flightTicketPaymentRemarks, 
                  lead.flightTicketInvoice, 
                  lead.flightTicketVerifyStatus, lead.flightTicketRejectReason, 
                  "Flight Ticket Receipt", "FLIGHT_TICKET"
                )}

                {renderOpsPaymentBlock(
                  "School Fees", lead.schoolFeesPending, 
                  "schoolFeesPaymentDate", lead.schoolFeesPaymentDate, 
                  "schoolFeesPaymentRemarks", lead.schoolFeesPaymentRemarks, 
                  lead.schoolFeesInvoice, 
                  lead.schoolFeesVerifyStatus, lead.schoolFeesRejectReason, 
                  "School Fees Receipt", "SCHOOL_FEES"
                )}

                {renderOpsPaymentBlock(
                  "Insurance", lead.insurancePending, 
                  "insurancePaymentDate", lead.insurancePaymentDate, 
                  "insurancePaymentRemarks", lead.insurancePaymentRemarks, 
                  lead.insuranceInvoice, 
                  lead.insuranceVerifyStatus, lead.insuranceRejectReason, 
                  "Insurance Receipt", "INSURANCE"
                )}

                {renderOpsPaymentBlock(
                  "Work Permit", lead.workPermitPending, 
                  "workPermitPaymentDate", lead.workPermitPaymentDate, 
                  "workPermitPaymentRemarks", lead.workPermitPaymentRemarks, 
                  lead.workPermitInvoice, 
                  lead.workPermitVerifyStatus, lead.workPermitRejectReason, 
                  "Work Permit Receipt", "WORK_PERMIT"
                )}

                {renderOpsPaymentBlock(
                  "Job Offer", lead.jobOfferPending, 
                  "jobOfferPaymentDate", lead.jobOfferPaymentDate, 
                  "jobOfferPaymentRemarks", lead.jobOfferPaymentRemarks, 
                  lead.jobOfferInvoice, 
                  lead.jobOfferVerifyStatus, lead.jobOfferRejectReason, 
                  "Job Offer Receipt", "JOB_OFFER"
                )}

                {/* 🚀 NEW: DYNAMIC / CUSTOM PAYMENTS RENDERER */}
                {otherPayments.map((payment: any) => (
                  <div key={payment.id}>
                    {renderOpsPaymentBlock(
                      payment.name || "Custom Payment", 
                      parseFloat(payment.amount) || null, 
                      `date_${payment.id}`, 
                      payment.date, 
                      `remarks_${payment.id}`, 
                      payment.remarks || "", 
                      payment.invoice, 
                      payment.status || "Unsubmitted", 
                      payment.rejectReason, 
                      `${payment.name || "Custom"} Receipt`, 
                      payment.id
                    )}
                  </div>
                ))}

                {(!lead.jobOfferPending && !lead.workPermitPending && !lead.insurancePending && !lead.schoolFeesPending && !lead.flightTicketPending && !lead.otherPending) && (
                  <div className="bg-white/50 p-6 rounded-xl border border-slate-200 text-center text-sm text-slate-500 italic shadow-sm">
                    No pending payments have been assigned by HR yet.
                  </div>
                )}
              </div>

              {/* 📋 11. OPS INTERNAL NOTES & FOLLOW UPS (EDITABLE) */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  📝 11. Notes & Follow-ups
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelStyle}>Last Action Date</label>
                    <input 
                      type="date" name="opsLastActionDate" disabled={currentTab !== "ops"} 
                      defaultValue={formatDate(lead.opsLastActionDate)} className={inputStyle} 
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Next Follow-Up</label>
                    <input 
                      type="date" name="opsNextFollowUpDate" disabled={currentTab !== "ops"} 
                      defaultValue={formatDate(lead.opsNextFollowUpDate)} className={inputStyle} 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Operations Remarks</label>
                  <textarea 
                    name="opsRemarks" disabled={currentTab !== "ops"} 
                    defaultValue={lead.opsRemarks || ""} rows={3} 
                    placeholder="Add private follow-up notes or internal Operations remarks..." 
                    className={inputStyle}>
                  </textarea>
                </div>
              </div>

              {/* MASTER SAVE BUTTON */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-12 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:bg-slate-400 disabled:scale-100 w-full md:w-auto"
                >
                  {loading ? "Saving..." : "💾 Save Operations Updates"}
                </button>
              </div>

            </div>

            {/* ================================================== */}
            {/* 📑 TAB 6: HR & FINANCIALS (READ ONLY)                */}
            {/* ================================================== */}
            <div className={currentTab === "hr" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              
              {/* 🔥 FINANCIAL SUMMARY CARD */}
              <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-800 text-white p-6 rounded-xl shadow-md border border-slate-700">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Deal Amount</p>
                  <p className="text-2xl font-black text-white">{totalDealAmount.toFixed(2)} <span className="text-sm font-medium text-slate-400">AED</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Collected Amount</p>
                  <p className="text-2xl font-black text-emerald-400">{totalCollectedAmount.toFixed(2)} <span className="text-sm font-medium text-emerald-700">AED</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Remaining Balance</p>
                  <p className="text-2xl font-black text-orange-400">{remainingBalance.toFixed(2)} <span className="text-sm font-medium text-orange-700">AED</span></p>
                </div>
              </div>

              {/* 📋 MASTER PAYMENT LEDGER */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
                <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">💳 Master Collection Ledger</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Payment Item</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Collected By</th>
                        <th className="py-3 px-4 font-bold text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {masterLedger.length === 0 ? (
                        <tr><td colSpan={5} className="py-4 px-4 text-center text-xs text-slate-400 italic bg-slate-50/50">No payments collected yet.</td></tr>
                      ) : (
                        masterLedger.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-slate-800">{item.name}</td>
                            <td className="py-4 px-4 text-sm font-bold text-emerald-600">{item.amount} AED</td>
                            <td className="py-4 px-4 text-xs font-medium text-slate-600">{formatDisplayDate(item.date)}</td>
                            <td className="py-4 px-4"><span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded">{item.collector}</span></td>
                            <td className="py-4 px-4 text-right flex justify-end items-center gap-2">
                              {renderVerifyBadge(item.status)}
                              {getLatestDocUrl(item.receiptType) && (
                                <a href={getLatestDocUrl(item.receiptType)!} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold bg-slate-800 text-white px-2 py-1 rounded hover:bg-slate-700 transition-colors">👁️</a>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 📋 HR INTERNAL NOTES (READ ONLY) */}
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-3 mb-4 flex items-center gap-2">
                  📝 HR Case Notes & Follow-ups
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className={labelStyle}>Last HR Action Date</p>
                    <p className={readOnlyGridValue}>{formatDisplayDate(lead.lastEmailDate)}</p>
                  </div>
                  <div>
                    <p className={labelStyle}>Next HR Follow-Up</p>
                    <p className={readOnlyGridValue}>{formatDisplayDate(lead.hrNextFollowUpDate)}</p>
                  </div>
                </div>
                <div>
                  <p className={labelStyle}>Internal HR Notes</p>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 min-h-[80px]">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.hrRemarks || "No remarks provided."}</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
          
          {/* RIGHT COLUMN (Timeline) */}
          <div className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-6">
              <ActivityTimeline activities={lead.activities} />
            </div>
          </div>

        </div>
      </form>

    </div>
  );
}