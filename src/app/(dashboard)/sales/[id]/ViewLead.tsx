// src/app/(dashboard)/sales/[id]/ViewLead.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TransferBanner from "./TransferBanner";
import DocumentVault from "@/components/DocumentVault";
import { updateSalesProcessing } from "@/app/actions/salesActions";
import { requestPaymentVerification, PaymentType } from "@/app/actions/paymentActions"; 
import ActivityTimeline from "@/components/ActivityTimeline";
import LeadStepper from "@/components/LeadStepper";
import toast, { Toaster } from "react-hot-toast";

// --- ENTERPRISE ICONS ---
const Icons = {
  User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Folder: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Clipboard: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 002-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Handshake: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Building: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Cog: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Payment: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Check: () => <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  WhatsApp: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.016-.967-.259-.099-.447-.149-.635.149-.188.297-.755.967-.924 1.166-.17.198-.34.223-.637.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.652-2.059-.17-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.635-1.534-.87-2.1-.228-.548-.46-.474-.635-.482-.17-.008-.364-.009-.563-.009-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
};

const FEEDBACK_OPTIONS = [
  "Interested", "Converted", "Not Responding", 
  "Not Interested", "Not Eligible", "Client is for Next Test"
];

// 🛠️ DATE FORMATTING HELPERS
const formatDate = (dateString?: string | null) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
const formatDisplayDate = (dateString?: string | null) => dateString ? new Date(dateString).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—";
const todayStr = new Date().toISOString().split('T')[0];

// 🚀 1-CLICK COPY COMPONENT
const CopyAction = ({ text, label }: { text: string, label: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all" title={`Copy ${label}`}>
      {copied ? <Icons.Check /> : <Icons.Copy />}
    </button>
  );
};

// 🚀 "CLICK-TO-EDIT" (MICRO-EDITING) COMPONENT WITH NUMBER VALIDATION
const EditableField = ({ label, name, initialValue, type = "text", disabled = false, numericOnly = false, onChange }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(initialValue || "");

  const displayVal = type === "date" ? formatDisplayDate(val) : val;
  const inputStyle = "w-full px-3 py-2 text-sm bg-white border border-indigo-300 text-slate-900 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm outline-none";

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value;
    if (numericOnly) newVal = newVal.replace(/[^0-9+ ]/g, ''); 
    setVal(newVal);
    onChange();
  };

  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type="hidden" name={name} value={type === "date" ? formatDate(val) : val} disabled={disabled} />
      
      {isEditing && !disabled ? (
        <input autoFocus type={type} value={type === "date" ? formatDate(val) : val} onChange={handleValChange} onBlur={() => setIsEditing(false)} className={inputStyle} />
      ) : (
        <div onClick={() => !disabled && setIsEditing(true)} className={`text-sm font-medium bg-slate-50/50 px-3 py-2 rounded-md border min-h-[38px] flex items-center relative group transition-all ${disabled ? "text-slate-500 border-slate-200 cursor-not-allowed" : "text-slate-900 border-slate-100 cursor-pointer hover:border-indigo-300 hover:shadow-sm"}`}>
          <span className="truncate pr-6">{displayVal || "—"}</span>
          {!disabled && <span className="absolute right-3 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity"><Icons.Edit /></span>}
        </div>
      )}
    </div>
  );
};

// 🚀 "/" SLASH COMMAND (QUICK MACROS) COMPONENT
const MacroTextarea = ({ name, initialValue, disabled, placeholder, onChange }: any) => {
  const [val, setVal] = useState(initialValue || "");
  const [showMenu, setShowMenu] = useState(false);

  const templates = [
    "Client requested a callback.",
    "Awaiting pending documents from client.",
    "Payment collected and verified.",
    "Client is unresponsive, moving to cold lead.",
    "Sent file to HR for review."
  ];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setVal(newVal);
    onChange();
    if (newVal.endsWith("/")) setShowMenu(true);
    else setShowMenu(false);
  };

  const insertTemplate = (template: string) => {
    const base = val.slice(0, -1); 
    setVal(base + template);
    setShowMenu(false);
    onChange();
  };

  return (
    <div className="relative">
      <textarea name={name} value={val} onChange={handleChange} disabled={disabled} rows={4} placeholder={placeholder} className="w-full px-3 py-2 text-sm bg-white border border-slate-300 text-slate-900 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm outline-none" />
      
      {showMenu && !disabled && (
        <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700 bg-slate-800">Quick Macros (Press /)</div>
          <ul className="max-h-48 overflow-y-auto custom-scrollbar">
            {templates.map((t, i) => (
              <li key={i} onClick={() => insertTemplate(t)} className="px-4 py-2.5 text-xs font-medium hover:bg-indigo-600 cursor-pointer border-b border-slate-800 last:border-0 transition-colors">{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};


export default function ViewLead({ lead, activeTab }: { lead: any, activeTab?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState<PaymentType | string | null>(null);
  
  // 🗂️ Modals & Drawers
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultDefaultCategory, setVaultDefaultCategory] = useState<string>("");
  const [vaultDefaultType, setVaultDefaultType] = useState<string>("");
  
  // 🚀 IN-APP DOCUMENT PREVIEW DRAWER STATE
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // 📑 LOCAL TAB STATE
  const [currentTab, setCurrentTab] = useState(activeTab || "profile");
  
  // 🚀 THE FLOATING SAVE BAR STATE (Unsaved Changes)
  const [isDirty, setIsDirty] = useState(false);     

  // ✏️ INLINE EDIT STATES 
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // ⭐ SYNCED STATE 
  const initialFeedback = lead.feedbackStatus || "";
  const isCustomFeedback = initialFeedback && !FEEDBACK_OPTIONS.includes(initialFeedback);
  const [feedbackSelect, setFeedbackSelect] = useState(isCustomFeedback ? "Others" : initialFeedback);
  
  const [otherPayments, setOtherPayments] = useState<any[]>(
    Array.isArray(lead.otherPayments) ? lead.otherPayments.map((p: any) => ({
      ...p, 
      testDate: p.testDate || "", 
      date: p.date || "", 
      amount: p.amount || "",
      remarks: p.remarks || "", 
      status: p.status || "Unsubmitted", 
      rejectReason: p.rejectReason || "", 
      isAutoRetest: !!p.isAutoRetest, 
      isAutoReschedule: !!p.isAutoReschedule, 
      attempt: p.attempt || null
    })) : []
  );

  // ==========================================
  // 🧮 CORE LOGIC & LOCKING 
  // ==========================================

  // 🔒 THE ULTIMATE SALES LOCK
  // If the file is no longer in Stage 1, it is completely locked for Sales!
  const isTransferredOut = lead.caseStatus !== "Stage 1 Under Process" && lead.caseStatus !== "New" && lead.caseStatus !== "Not Interested/Dropped Off";

  const evalsCount = lead.testEvaluations?.length || 0;
  const isInitialScored = evalsCount > 0;
  const isRetestScored = evalsCount > 1;
  const failedExamsCount = lead.testEvaluations?.filter((t: any) => t.status === "Rejected" || t.status === "Failed" || t.englishTestResult === "Failed" || t.yardTestResult === "Failed").length || 0;
  const hasFailedExam = lead.examinerStatus === "Rejected" || failedExamsCount > 0;
  const isExamPassed = lead.examinerStatus === "Approved";

  const isPastDate = (d?: string | null) => {
    if (!d) return false;
    const date = new Date(d);
    date.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    return date < today;
  };

  const isInitialDateLocked = isInitialScored || isPastDate(lead.testDate);
  const isRetestDateLocked = isRetestScored || isPastDate(lead.reTestDate);
  const initialIsNoShow = !isInitialScored && isPastDate(lead.testDate);
  const retestIsNoShow = hasFailedExam && !isRetestScored && isPastDate(lead.reTestDate);

  // 🕒 HISTORY GENERATION 
  let combinedHistory = (lead.testEvaluations || []).map((t: any) => ({ ...t, isMissed: false }));
  
  const resched1 = otherPayments.find((p: any) => p.isAutoReschedule && p.attempt === 1 && p.testDate);
  if (resched1 && lead.testDate) {
    combinedHistory.push({ id: 'noshow-1', createdAt: new Date(lead.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  }
  
  const resched2 = otherPayments.find((p: any) => p.isAutoReschedule && p.attempt === 2 && p.testDate);
  if (resched2 && lead.reTestDate) {
    combinedHistory.push({ id: 'noshow-2', createdAt: new Date(lead.reTestDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  }

  otherPayments.filter((p: any) => p.isAutoReschedule && p.attempt > 2 && p.testDate).forEach((resched: any) => {
    const orig = otherPayments.find((p: any) => p.isAutoRetest && p.attempt === resched.attempt);
    if (orig && orig.testDate) {
      combinedHistory.push({ id: `noshow-${resched.attempt}`, createdAt: new Date(orig.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
    }
  });

  combinedHistory.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  combinedHistory = combinedHistory.map((test: any, index: number) => ({ ...test, attemptLabel: `Attempt ${index + 1}` }));
  combinedHistory.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  useEffect(() => {
    setOtherPayments(prev => {
      let newRows = [...prev];

      const hasInitResch = newRows.some((p: any) => p.isAutoReschedule && p.attempt === 1);
      if (initialIsNoShow && !hasInitResch) {
        newRows.push({ id: Math.random().toString(36).substr(2, 9), name: "Attempt 1 Reschedule", amount: "", remarks: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoReschedule: true, attempt: 1 });
      } else if (!initialIsNoShow && hasInitResch) {
        newRows = newRows.filter((p: any) => !(p.isAutoReschedule && p.attempt === 1 && p.status === "Unsubmitted")); 
      }

      const hasRetestResch = newRows.some((p: any) => p.isAutoReschedule && p.attempt === 2);
      if (retestIsNoShow && !hasRetestResch) {
        newRows.push({ id: Math.random().toString(36).substr(2, 9), name: "Attempt 2 Reschedule", amount: "", remarks: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoReschedule: true, attempt: 2 });
      } else if (!retestIsNoShow && hasRetestResch) {
        newRows = newRows.filter((p: any) => !(p.isAutoReschedule && p.attempt === 2 && p.status === "Unsubmitted"));
      }

      if (failedExamsCount > 1) {
        const extraNeeded = failedExamsCount - 1;
        const existingAutoRetests = newRows.filter((p: any) => p.isAutoRetest);
        if (existingAutoRetests.length < extraNeeded) {
          for (let i = existingAutoRetests.length; i < extraNeeded; i++) {
            newRows.push({ id: Math.random().toString(36).substr(2, 9), name: `Attempt ${i + 3} Re-Test`, amount: "", remarks: "", invoice: "", date: "", testDate: "", status: "Unsubmitted", rejectReason: "", isAutoRetest: true, attempt: i + 3 });
          }
        }
      }
      return newRows;
    });
  }, [initialIsNoShow, retestIsNoShow, failedExamsCount]);

  // 🎨 TIGHTER ENTERPRISE STYLING SYSTEM
  const sectionStyle = "bg-white p-5 rounded-lg shadow-sm border border-slate-200 mb-5 relative overflow-hidden";
  const labelStyle = "text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const baseInputStyle = "w-full px-3 py-2 text-sm rounded-md outline-none transition-all duration-200 border ";
  const inputStyle = baseInputStyle + "bg-white border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm";
  const lockedInputStyle = baseInputStyle + "bg-slate-50 border-slate-200 text-slate-500 font-medium pointer-events-none cursor-not-allowed";

  const docs = lead.documentStatus || {};
  const [hasJustUploaded, setHasJustUploaded] = useState(false);

  const updatePaymentRow = (id: string, field: string, value: string) => { 
    setIsDirty(true); 
    setOtherPayments(prev => prev.map((p: any) => p.id === id ? { ...p, [field]: value } : p)); 
  };
  
  const hasReceiptUploaded = (expectedDocType: string) => {
    if (hasJustUploaded) return true;
    let filesObj = lead.documentFiles;
    if (typeof filesObj === 'string') {
      try { 
        filesObj = JSON.parse(filesObj); 
      } catch(e) { 
        filesObj = {}; 
      }
    }
    if (!filesObj) return false;
    const filesArray = Array.isArray(filesObj) ? filesObj : Object.values(filesObj);
    return filesArray.some((f: any) => f?.category === 'Financial' || String(f?.documentType).toLowerCase().includes('receipt'));
  };

  const handleInlineSave = async (e?: React.FormEvent<HTMLFormElement>, silent = false, overridePayments?: any[]) => {
    if (e) e.preventDefault();
    if (!formRef.current) return;
    
    setLoading(true);
    const formData = new FormData(formRef.current);
    formData.append("otherPayments", JSON.stringify(overridePayments || otherPayments));
    
    try {
      await updateSalesProcessing(lead.id, formData);
      setIsEditingDocs(false);
      setIsEditingProfile(false);
      setIsDirty(false); // Clear dirty state
      if (!silent) toast.success("All updates saved successfully!"); // Toast Notification
      router.refresh();
    } catch (error) {
      console.error(error);
      if (!silent) toast.error("Failed to save updates.");
    } finally {
      setLoading(false);
    }
  };

  const sendForVerification = async (type: PaymentType) => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    
    let reqDocType = "";
    if (type === 'TEST') {
      if (!formData.get('testDate') || !formData.get('testFeesAmount') || !formData.get('paymentDate')) {
        return toast.error("Please enter the Test Date, Amount, and Payment Date.");
      }
      reqDocType = "Initial Test Receipt";
    }
    if (type === 'RETEST') {
      if (!formData.get('reTestDate') || !formData.get('reTestFeesAmount') || !formData.get('reTestPaymentDate')) {
        return toast.error("Please enter the Re-Test Date, Amount, and Payment Date.");
      }
      reqDocType = "Re-Test Receipt";
    }
    if (type === 'SA') {
      if (!formData.get('serviceAgreementAmount') || !formData.get('serviceAgreementTotal') || !formData.get('serviceAgreementPaymentDate')) {
        return toast.error("Please enter the Service Agreement Amounts and Payment Date.");
      }
      reqDocType = "Service Agreement Receipt";
    }

    if (!hasReceiptUploaded(reqDocType)) {
      return toast.error(`You must upload a receipt to the Vault before sending for Verification.`);
    }

    setVerifyLoading(type);
    try {
      await handleInlineSave(undefined, true);
      await requestPaymentVerification(lead.id, type);
      toast.success("Verification request sent to HR!");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send verification request.");
    } finally {
      setVerifyLoading(null);
    }
  };

  const sendOtherForVerification = async (id: string) => {
    const payment = otherPayments.find((p: any) => p.id === id);
    if (!payment?.testDate || !payment?.amount || !payment?.date) {
      return toast.error("Please enter the Test Date, Amount and Payment Date.");
    }

    const reqDocType = `Misc Receipt - ${payment.name}`;
    if (!hasReceiptUploaded(reqDocType)) {
      return toast.error("You must upload a receipt to the Vault first.");
    }

    setVerifyLoading(id);
    const updatedPayments = otherPayments.map((p: any) => p.id === id ? { ...p, status: 'Pending', rejectReason: '' } : p);
    setOtherPayments(updatedPayments);
    setTimeout(() => {
      if (formRef.current) handleInlineSave(undefined, true, updatedPayments);
      toast.success("Verification request sent to HR!");
      setVerifyLoading(null);
    }, 200);
  };

  const renderVerifyBadge = (status: string) => {
    if (status === "Approved") {
      return <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200"><Icons.Check /> Approved</span>;
    }
    if (status === "Pending") {
      return <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 animate-pulse">⏳ Pending HR</span>;
    }
    if (status === "Rejected") {
      return <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200"><Icons.Alert /> Rejected</span>;
    }
    return <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">Unsubmitted</span>;
  };

  const renderVerifyButton = (status: string, onClick: () => void, loadingId: string, disabledStyle = "bg-slate-100 text-slate-400 border-slate-200") => {
    if (status === "Approved") {
      return (
        <button type="button" disabled className="w-full py-2 bg-emerald-50/50 text-emerald-600 text-sm font-semibold rounded-md border border-emerald-200/50 cursor-not-allowed flex items-center justify-center gap-2">
          <Icons.Check /> Verified
        </button>
      );
    }
    if (status === "Pending") {
      return (
        <button type="button" disabled className="w-full py-2 bg-amber-50/50 text-amber-600 text-sm font-semibold rounded-md border border-amber-200/50 cursor-not-allowed animate-pulse flex items-center justify-center gap-2">
          ⏳ Verification Sent
        </button>
      );
    }
    return (
      <button 
        type="button" 
        onClick={onClick} 
        disabled={verifyLoading === loadingId || isTransferredOut} 
        className={`w-full py-2 text-white text-sm font-semibold rounded-md shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:${disabledStyle} bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center gap-2`}
      >
        {verifyLoading === loadingId ? (
          <span className="animate-pulse">Sending...</span>
        ) : (
          <><Icons.Upload /> Send for Verification</>
        )}
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
      disabled={isTransferredOut}
      onClick={() => openVaultPreFilled("Financial", docType)}
      className="w-full py-2 mt-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold rounded-md transition-colors shadow-sm flex justify-center items-center gap-2 focus:ring-2 focus:ring-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icons.Folder /> Upload Receipt
    </button>
  );

  const getExpiryCountdown = (dateString?: string | null) => {
    if (!dateString) return <span className="text-slate-400">—</span>;
    const exp = new Date(dateString);
    const now = new Date();
    now.setHours(0,0,0,0);
    
    if (exp < now) {
      return <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Expired</span>;
    }
    
    let m = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
    let d = exp.getDate() - now.getDate();
    if (d < 0) {
      m--;
      d += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    }
    
    if (m === 0 && d === 0) {
      return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Expires Today</span>;
    }
    return <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{m}m {d}d</span>;
  };

  const getLatestDocUrl = (expectedType: string) => {
    if (!lead.documentFiles) return null;
    let filesObj = lead.documentFiles;
    if (typeof filesObj === 'string') { 
      try { 
        filesObj = JSON.parse(filesObj); 
      } catch(e) { 
        filesObj = {}; 
      } 
    }
    const filesArray = Array.isArray(filesObj) ? filesObj : Object.values(filesObj);
    const matchingFiles = filesArray.filter((f: any) => f?.documentType === expectedType);
    if (matchingFiles.length > 0) {
      return matchingFiles[matchingFiles.length - 1].url;
    }
    return null;
  };

  const renderDocRow = (
    title: string, uploadCat: string, uploadType: string, isUploaded: boolean, 
    issueName?: string, issueDate?: string, expiryName?: string, expiryDate?: string, 
    docNumName?: string, docNum?: string
  ) => {
    const isOther = title === "TEST OR VIDEO";
    const docUrl = getLatestDocUrl(uploadType);

    return (
      <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
        <td className="py-3 px-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{isUploaded ? <Icons.Check /> : <Icons.Cross />}</div>
            <div>
              <p className="font-semibold text-slate-800 text-sm tracking-tight">{title}</p>
              <div className="mt-1">
                {docNumName && isEditingDocs ? (
                  <input 
                    type="text" 
                    name={docNumName} 
                    defaultValue={docNum || ""} 
                    disabled={isTransferredOut || currentTab !== "documents"} 
                    placeholder="Document No." 
                    className="w-full max-w-[140px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" 
                  />
                ) : docNum ? (
                  <p className="text-xs text-slate-500 font-mono font-medium bg-slate-100/50 border border-slate-200 px-1.5 py-0.5 rounded inline-block">
                    {docNum}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </td>
        
        {issueName !== undefined ? (
          <>
            <td className="py-3 px-4 text-sm font-medium text-slate-700">
              {isEditingDocs ? (
                <input 
                  type="date" 
                  name={issueName} 
                  defaultValue={formatDate(issueDate)} 
                  disabled={isTransferredOut || currentTab !== "documents"} 
                  className="w-[120px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" 
                />
              ) : (
                <span className="text-slate-600">{formatDisplayDate(issueDate)}</span>
              )}
            </td>
            <td className="py-3 px-4 text-sm font-medium text-slate-700">
              {isEditingDocs ? (
                <input 
                  type="date" 
                  name={expiryName} 
                  defaultValue={formatDate(expiryDate)} 
                  disabled={isTransferredOut || currentTab !== "documents"} 
                  className="w-[120px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" 
                />
              ) : (
                <span className="text-slate-600">{formatDisplayDate(expiryDate)}</span>
              )}
            </td>
            <td className="py-3 px-4">{getExpiryCountdown(expiryDate)}</td>
          </>
        ) : (
          <td colSpan={3} className="py-3 px-4 text-center text-xs text-slate-400 font-medium italic">- Not Applicable -</td>
        )}

        <td className="py-3 px-4 text-right">
          <div className="flex justify-end gap-2 items-center opacity-80 group-hover:opacity-100 transition-opacity">
            {!isTransferredOut && (
              <button 
                type="button" 
                onClick={() => openVaultPreFilled(isOther ? "" : uploadCat, isOther ? "" : uploadType)} 
                className="text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:border-slate-300 px-2 py-1.5 rounded hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1"
              >
                <Icons.Upload /> Upload
              </button>
            )}
            {docUrl ? (
              <button 
                type="button" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  setPreviewDocUrl(docUrl); 
                }}
                className="text-xs font-medium bg-slate-800 text-white px-2 py-1.5 rounded hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1"
              >
                <Icons.Eye /> View
              </button>
            ) : (
              <button 
                type="button" 
                disabled 
                className="text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 px-2 py-1.5 rounded cursor-not-allowed flex items-center gap-1"
              >
                <Icons.Eye /> View
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // 🚀 VISUAL PROGRESS BAR RENDERER
  const renderProgressBar = (score: any, status: string) => {
    if (score === null || score === "-") return null;
    const num = parseFloat(score);
    if (isNaN(num)) return null;
    
    const percentage = Math.min(100, Math.max(0, (num / 10) * 100));
    const colorClass = status === 'Passed' ? 'bg-emerald-500' : status === 'Failed' ? 'bg-rose-500' : 'bg-indigo-500';
    
    return (
      <div className="w-full max-w-[120px] bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden shadow-inner">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  const renderFollowUpBlock = (tabTitle: string, prefix: string) => {
    const dbName = prefix === "profile" ? "salesRemarks" : `${prefix}SalesRemarks`;

    return (
      <div className="mt-10">
        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/80 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200/80 pb-3 mb-5 flex items-center gap-2">
            <Icons.Edit /> {tabTitle} Notes & Context
          </h2>
          <MacroTextarea 
            name={dbName} 
            disabled={isTransferredOut || currentTab !== prefix} 
            initialValue={lead[dbName] || ""} 
            placeholder={`Add detailed context specifically regarding ${tabTitle}... (Press '/' for macros)`} 
            onChange={() => setIsDirty(true)}
          />
        </div>

        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <h2 className="text-sm font-bold text-indigo-900 border-b border-indigo-100 pb-3 mb-5 flex items-center gap-2">
            <Icons.Refresh /> Follow-Ups & Status
          </h2>

          <div className="space-y-6">
            <div className="bg-indigo-50/30 p-5 rounded-lg border border-indigo-100/60">
              <label className="block text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-3">Conversion Status</label>
              <div className="flex gap-4">
                <select 
                  name="feedbackStatus" 
                  disabled={isTransferredOut || currentTab !== prefix} 
                  value={feedbackSelect} 
                  onChange={(e) => { 
                    setFeedbackSelect(e.target.value); 
                    setIsDirty(true); 
                  }} 
                  className={`${inputStyle} w-1/2 font-semibold text-indigo-900 border-indigo-200 focus:ring-indigo-500/20`}
                >
                  <option value="">Pending...</option>
                  {FEEDBACK_OPTIONS.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="Others">Others (Custom)</option>
                </select>
                {feedbackSelect === "Others" && (
                  <input 
                    type="text" 
                    name="feedbackStatusOther" 
                    disabled={isTransferredOut || currentTab !== prefix} 
                    defaultValue={isCustomFeedback ? initialFeedback : ""} 
                    placeholder="Custom status..." 
                    className={`${inputStyle} w-1/2 border-indigo-200`} 
                    required={currentTab === prefix && feedbackSelect === "Others"} 
                    onChange={() => setIsDirty(true)}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelStyle}>Last Contact Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icons.Calendar />
                  </div>
                  <input 
                    type="date" 
                    name="lastCallDate" 
                    disabled={isTransferredOut || currentTab !== prefix} 
                    defaultValue={formatDate(lead.lastCallDate)} 
                    className={`${inputStyle} pl-10`} 
                    onChange={() => setIsDirty(true)}
                  />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Next Follow-up</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Icons.Calendar />
                  </div>
                  <input 
                    type="date" 
                    name="followUpDate" 
                    disabled={isTransferredOut || currentTab !== prefix} 
                    defaultValue={formatDate(lead.followUpDate)} 
                    className={`${inputStyle} pl-10`} 
                    onChange={() => setIsDirty(true)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelStyle}>Follow-up Remarks</label>
              <MacroTextarea 
                name="followUpRemarks" 
                disabled={isTransferredOut || currentTab !== prefix} 
                initialValue={lead.followUpRemarks || ""} 
                placeholder="Brief notes from the last interaction... (Press '/' for macros)" 
                onChange={() => setIsDirty(true)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 🚀 SLA HEAT INDICATOR LOGIC
  const lastInteractionTime = lead.updatedAt ? new Date(lead.updatedAt).getTime() : new Date().getTime();
  const daysStagnant = Math.floor((new Date().getTime() - lastInteractionTime) / (1000 * 3600 * 24));
  
  let slaBadge = (
    <span className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 
      ACTIVE (HOT)
    </span>
  );
  
  if (daysStagnant >= 7) {
    slaBadge = (
      <span className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm">
        ❄️ COLD ({daysStagnant}d)
      </span>
    );
  } else if (daysStagnant >= 3) {
    slaBadge = (
      <span className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm">
        ⚠️ WARM ({daysStagnant}d)
      </span>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 pt-4 relative">
      <Toaster position="bottom-right" reverseOrder={false} toastOptions={{ style: { fontSize: '14px', fontWeight: 'bold' } }} />

      {/* 🚀 THE MASSIVE GLOBAL LOCK BANNER */}
      {isTransferredOut && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-8 flex items-center gap-5 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 shrink-0">
            <Icons.Lock />
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">File is Read-Only</h2>
            <p className="text-slate-400 text-sm mt-0.5 font-medium leading-snug">
              This candidate has been transferred to HR (Current Status: <span className="text-indigo-400 font-bold">{lead.caseStatus}</span>). Sales can no longer modify this file.
            </p>
          </div>
        </div>
      )}

      {/* 🚀 THE FLOATING "UNSAVED CHANGES" ACTION BAR */}
      {isDirty && !isTransferredOut && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 border border-slate-700/80 w-max">
            <span className="text-sm font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> 
              You have unsaved changes.
            </span>
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => { 
                  formRef.current?.reset(); 
                  setIsDirty(false); 
                  setFeedbackSelect(isCustomFeedback ? "Others" : initialFeedback); 
                }} 
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Discard
              </button>
              <button 
                type="button" 
                onClick={() => handleInlineSave()} 
                disabled={loading} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 IN-APP DOCUMENT PREVIEW DRAWER (SLIDE-OUT) */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setPreviewDocUrl(null)}></div>
          <div className="w-full md:w-[600px] lg:w-[800px] bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Icons.Folder /> Document Preview
              </h3>
              <div className="flex items-center gap-3">
                <a 
                  href={previewDocUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors"
                >
                  Open in New Tab
                </a>
                <button 
                  onClick={() => setPreviewDocUrl(null)} 
                  className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                >
                  <Icons.Cross />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200/50 p-4 lg:p-6 overflow-hidden">
              <iframe 
                src={previewDocUrl} 
                className="w-full h-full rounded-lg border border-slate-300 shadow-sm bg-white" 
              />
            </div>
          </div>
        </div>
      )}

      {/* 🗂️ VAULT MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-base flex items-center gap-2">
                <Icons.Folder /> Document Vault
              </h2>
              <button 
                type="button" 
                onClick={() => setIsVaultModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 w-7 h-7 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <Icons.Cross />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1 custom-scrollbar">
              <DocumentVault 
                leadId={lead.id} 
                existingDocs={lead.documentFiles} 
                defaultCategory={vaultDefaultCategory} 
                defaultType={vaultDefaultType} 
                onUploadSuccess={() => { 
                  setHasJustUploaded(true); 
                  setIsVaultModalOpen(false); 
                  router.refresh(); 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* 🚀 ONLY SHOW TRANSFER BANNER IF NOT YET TRANSFERRED */}
      {isExamPassed && lead.saFeeVerifyStatus === "Approved" && !isTransferredOut && (
        <TransferBanner leadId={lead.id} />
      )}

      {/* ENTERPRISE HEADER WITH SMART LINKS & SLA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 tracking-wider flex items-center gap-1">
              ID: {lead.id.slice(-6).toUpperCase()} 
              <CopyAction text={lead.id} label="ID" />
            </span>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <Icons.MapPin /> {lead.countryPreferred || "Unknown"}
            </span>
            {slaBadge}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            {lead.givenName} {lead.surname}
          </h1>
          
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> 
              {lead.caseStatus}
            </span>
            <span className="flex items-center gap-1 group">
              <a href={`tel:${lead.callingNumber}`} className="hover:text-indigo-600 hover:underline">
                {lead.callingNumber}
              </a> 
              <CopyAction text={lead.callingNumber} label="Phone" />
            </span>
            {lead.whatsappNumber && (
              <span className="flex items-center gap-1 text-emerald-600 group">
                <Icons.WhatsApp /> 
                <a href={`https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline">
                  {lead.whatsappNumber}
                </a> 
                <CopyAction text={lead.whatsappNumber} label="WhatsApp" />
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 text-slate-500 group">
                ✉️ 
                <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 hover:underline">
                  {lead.email}
                </a> 
                <CopyAction text={lead.email} label="Email" />
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/sales/leads" 
            className="px-4 py-2 rounded-md font-medium text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-sm"
          >
            <Icons.ArrowLeft /> Back to Leads
          </Link>
        </div>
      </div>

      <LeadStepper currentStatus={lead.caseStatus} />

      {/* MAIN WRAPPER FORM */}
      <form ref={formRef} onSubmit={(e) => handleInlineSave(e, false)}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-8">
            
            {/* 🚀 STICKY ENTERPRISE TABS */}
            <div className="sticky top-0 z-40 pt-4 pb-2 bg-slate-50/95 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 sm:bg-transparent sm:backdrop-blur-none transition-all">
              <div className="flex overflow-x-auto custom-scrollbar p-1 bg-slate-200/50 backdrop-blur-md rounded-lg shadow-sm border border-slate-200/60">
                <button 
                  type="button" 
                  onClick={() => setCurrentTab("profile")} 
                  className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${currentTab === 'profile' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  <Icons.User /> Profile
                </button>
                <button 
                  type="button" 
                  onClick={() => setCurrentTab("documents")} 
                  className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${currentTab === 'documents' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  <Icons.Folder /> Documents
                  {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shadow-sm border ${currentTab === 'documents' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                      {Object.keys(lead.documentFiles).length}
                    </span>
                  )}
                </button>
                <button 
                  type="button" 
                  onClick={() => setCurrentTab("testing")} 
                  className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${currentTab === 'testing' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  <Icons.Clipboard /> Tests & Exams
                </button>
                <button 
                  type="button" 
                  onClick={() => setCurrentTab("sa")} 
                  className={`flex-1 flex justify-center items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-all duration-200 ${currentTab === 'sa' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
                >
                  <Icons.Handshake /> Agreement
                  {!isExamPassed && <span className="opacity-40 ml-1"><Icons.Lock /></span>}
                </button>
              </div>
            </div>

            {/* TAB CONTENT: PROFILE */}
            <div className={currentTab === "profile" ? "space-y-5 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    1. Routing Information
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <EditableField 
                    label="Lead Source" 
                    name="leadSource" 
                    initialValue={lead.leadSource} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Category" 
                    name="category" 
                    initialValue={lead.category} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Preferred Country" 
                    name="countryPreferred" 
                    initialValue={lead.countryPreferred} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Slot Booking Date" 
                    name="slotBookingDate" 
                    type="date" 
                    initialValue={lead.slotBookingDate} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Test Date" 
                    name="testDate" 
                    type="date" 
                    initialValue={lead.testDate} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                </div>
              </div>

              <div className={sectionStyle}>
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  2. Client Information
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  <EditableField 
                    label="Full Name" 
                    name="givenName" 
                    initialValue={lead.givenName} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Father's Name" 
                    name="fatherName" 
                    initialValue={lead.fatherName} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Date of Birth" 
                    name="dob" 
                    type="date" 
                    initialValue={lead.dob} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Phone" 
                    name="callingNumber" 
                    initialValue={lead.callingNumber} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    numericOnly={true} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="WhatsApp" 
                    name="whatsappNumber" 
                    initialValue={lead.whatsappNumber} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    numericOnly={true} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Email" 
                    name="email" 
                    initialValue={lead.email} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <div className="md:col-span-3">
                    <EditableField 
                      label="Nationality" 
                      name="nationality" 
                      initialValue={lead.nationality} 
                      disabled={isTransferredOut || currentTab !== "profile"} 
                      onChange={() => setIsDirty(true)} 
                    />
                  </div>
                </div>
              </div>

              <div className={sectionStyle}>
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
                  3. Experience & Agency History
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  <EditableField 
                    label="Home Exp" 
                    name="experienceHome" 
                    type="number" 
                    initialValue={lead.experienceHome} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    numericOnly={true}
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="GCC Exp" 
                    name="experienceGCC" 
                    type="number" 
                    initialValue={lead.experienceGCC} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    numericOnly={true}
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Previous Agency" 
                    name="previousAgency" 
                    initialValue={lead.previousAgency} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                  <EditableField 
                    label="Prev. Country" 
                    name="previousCountry" 
                    initialValue={lead.previousCountry} 
                    disabled={isTransferredOut || currentTab !== "profile"} 
                    onChange={() => setIsDirty(true)} 
                  />
                </div>
              </div>
              {renderFollowUpBlock("Profile", "profile")}
            </div>

            {/* TAB CONTENT: DOCUMENTS */}
            <div className={currentTab === "documents" ? "space-y-5 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-200 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icons.Folder /> Core ID Checklist
                  </h2>
                  {!isTransferredOut && (
                    <div className="flex gap-2 items-center">
                      <button 
                        type="button" 
                        onClick={() => { 
                          if (isEditingDocs) handleInlineSave(); 
                          else setIsEditingDocs(true); 
                        }} 
                        disabled={loading} 
                        className={`text-xs font-medium px-3 py-1.5 rounded transition-all shadow-sm disabled:opacity-50 flex items-center gap-1 ${isEditingDocs ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {loading && isEditingDocs ? "Saving..." : isEditingDocs ? <><Icons.Check /> Done</> : <><Icons.Edit /> Edit Dates & IDs</>}
                      </button>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Document Type</th>
                        <th className="py-3 px-4">Issue Date</th>
                        <th className="py-3 px-4">Expiry Date</th>
                        <th className="py-3 px-4">Expiring In</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {renderDocRow("CV / RESUME", "Client", "CV / Resume", docs.resumeUploaded)}
                      {renderDocRow("PASSPORT", "Client", "Passport", docs.passportUploaded, "passportIssueDate", lead.passportIssueDate, "passportExpiry", lead.passportExpiry, "passportNum", lead.passportNum)}
                      {renderDocRow("DRIVING LICENCE", "Client", "Driving License", docs.dlUploaded, "dlIssueDate", lead.dlIssueDate, "dlExpiry", lead.dlExpiry, "dlNumber", lead.dlNumber)}
                      {renderDocRow("RESIDENT ID", "Client", "Emirates ID", docs.residentIdUploaded, "residentIdIssueDate", lead.residentIdIssueDate, "residentIdExp", lead.residentIdExp, "residentIdNum", lead.residentIdNum)}
                      {renderDocRow("TEST OR VIDEO", "Client", "Other Document", docs.videoUploaded)}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`mt-6 border-t border-slate-200 pt-6 ${isTransferredOut ? 'opacity-60 pointer-events-none' : ''}`}>
                <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Icons.Folder /> Complete Document Vault
                </h2>
                <DocumentVault 
                  leadId={lead.id} 
                  existingDocs={lead.documentFiles} 
                  defaultCategory={vaultDefaultCategory} 
                  defaultType={vaultDefaultType} 
                  onUploadSuccess={() => { 
                    setHasJustUploaded(true); 
                    setIsVaultModalOpen(false); 
                    router.refresh(); 
                  }} 
                />
              </div>
              {renderFollowUpBlock("Documents", "documents")}
            </div>

            {/* TAB CONTENT: TESTING */}
            <div className={currentTab === "testing" ? "space-y-5 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              {combinedHistory.length > 0 && (
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 mb-6">
                  <h2 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-3 mb-5 flex justify-between items-center">
                    <span className="flex items-center gap-2"><Icons.Clipboard /> 5. Exam Scores & History</span>
                  </h2>

                  <div className="space-y-5">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Final Status</h3>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded border shadow-sm ${
                          lead.examinerStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
                          (lead.examinerStatus === "Denied" || lead.examinerStatus === "Rejected") ? "bg-rose-50 text-rose-700 border-rose-200" : 
                          "bg-white text-slate-600 border-slate-200"
                        }`}>
                          {lead.examinerStatus?.toUpperCase() || "PENDING"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col items-center text-center">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            English Assessment
                          </p>
                          <p className="text-3xl font-bold text-slate-800 tracking-tight">
                            {lead.englishScore !== null ? lead.englishScore : "-"}
                            <span className="text-sm text-slate-300 font-medium ml-1">/10</span>
                          </p>
                          {renderProgressBar(lead.englishScore, lead.englishTestResult)}
                          <p className={`text-xs font-bold mt-2 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-rose-600' : 'text-slate-400'}`}>
                            {lead.englishTestResult || "Pending"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col items-center text-center">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Driving / Yard Test
                          </p>
                          <p className="text-3xl font-bold text-slate-800 tracking-tight">
                            {lead.drivingScore !== null ? lead.drivingScore : "-"}
                            <span className="text-sm text-slate-300 font-medium ml-1">/10</span>
                          </p>
                          {renderProgressBar(lead.drivingScore, lead.yardTestResult)}
                          <p className={`text-xs font-bold mt-2 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-rose-600' : 'text-slate-400'}`}>
                            {lead.yardTestResult || "Pending"}
                          </p>
                        </div>
                      </div>
                      
                      {lead.examinerRemarks && (
                        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Latest Examiner Remarks
                          </p>
                          <p className="text-xs font-medium text-slate-700 whitespace-pre-wrap">
                            {lead.examinerRemarks}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h3 className="text-[11px] font-bold text-slate-500 mb-3 uppercase tracking-wider">
                        Testing History ({combinedHistory.length} Attempts)
                      </h3>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {combinedHistory.map((test: any) => (
                          <div 
                            key={test.id} 
                            className={`p-3 rounded-md border flex justify-between items-center ${test.isMissed ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}
                          >
                            <div>
                              <p className={`text-xs font-bold ${test.isMissed ? 'text-amber-800' : 'text-slate-800'}`}>
                                {test.attemptLabel} 
                                <span className={`font-medium text-[10px] ml-1.5 ${test.isMissed ? 'text-amber-600' : 'text-slate-400'}`}>
                                  ({new Date(test.createdAt).toLocaleDateString("en-GB")})
                                </span>
                              </p>
                              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                                English: 
                                <span className={`font-semibold ${test.isMissed ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {test.englishScore !== "-" ? ` ${test.englishScore}/10 ` : "-"}
                                </span> 
                                <span className={test.isMissed ? "text-amber-500" : ""}>
                                  ({test.englishTestResult})
                                </span> 
                                <span className="mx-1.5 text-slate-200">|</span> 
                                Yard: 
                                <span className={`font-semibold ${test.isMissed ? 'text-amber-600' : 'text-slate-700'}`}>
                                  {test.drivingScore !== "-" ? ` ${test.drivingScore}/10 ` : "-"}
                                </span> 
                                <span className={test.isMissed ? "text-amber-500" : ""}>
                                  ({test.yardTestResult})
                                </span>
                              </p>
                            </div>
                            <span 
                              className={`px-2 py-1 text-[9px] font-bold rounded uppercase shrink-0 shadow-sm border ${
                                test.isMissed ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                                test.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {test.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 mb-6">
                <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Icons.Calendar /> 6. Test & Scheduling</span>
                </h2>

                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="bg-slate-800 text-white w-4 h-4 flex items-center justify-center rounded text-[9px]">1</span> Initial Test
                  </h3>
                  
                  {lead.testFeeVerifyStatus === 'Rejected' && lead.testFeeRejectReason && (
                    <div className="mb-4 p-3 bg-rose-50 border-l-2 border-rose-500 rounded-r shadow-sm">
                      <strong className="block uppercase tracking-wider text-[9px] text-rose-700 mb-0.5 font-bold flex items-center gap-1">
                        <Icons.Alert /> HR Rejection Reason:
                      </strong>
                      <span className="text-xs text-rose-900 font-medium">{lead.testFeeRejectReason}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Icons.Calendar /> Schedule Date
                        </h4>
                        <div className="mb-4">
                          <label className={labelStyle}>
                            Test Date {isInitialDateLocked && <Icons.Lock />}
                          </label>
                          <input 
                            type="date" 
                            name="testDate" 
                            disabled={isTransferredOut || currentTab !== "testing"} 
                            defaultValue={formatDate(lead.testDate)} 
                            min={!isInitialDateLocked ? todayStr : undefined} 
                            className={isInitialDateLocked || isTransferredOut ? lockedInputStyle : inputStyle} 
                            readOnly={isInitialDateLocked || isTransferredOut} 
                            onChange={() => setIsDirty(true)} 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                            <Icons.Payment /> Collect Payment
                          </h4>
                          {renderVerifyBadge(lead.testFeeVerifyStatus)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <label className={labelStyle}>Test Fees (AED)</label>
                            <input 
                              type="number" step="0.01" 
                              name="testFeesAmount" 
                              disabled={isTransferredOut || currentTab !== "testing"} 
                              defaultValue={lead.testFeesAmount} 
                              placeholder="0.00" 
                              className={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                              readOnly={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved'} 
                              onChange={() => setIsDirty(true)} 
                            />
                          </div>
                          <div>
                            <label className={labelStyle}>Payment Date</label>
                            <input 
                              type="date" 
                              name="paymentDate" 
                              disabled={isTransferredOut || currentTab !== "testing"} 
                              defaultValue={formatDate(lead.paymentDate)} 
                              className={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                              readOnly={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved'} 
                              onChange={() => setIsDirty(true)} 
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={labelStyle}>Payment Notes</label>
                            <input 
                              type="text" 
                              name="testFeeRemarks" 
                              disabled={isTransferredOut || currentTab !== "testing"} 
                              defaultValue={lead.testFeeRemarks || ""} 
                              placeholder="Any notes..." 
                              className={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                              readOnly={isTransferredOut || lead.testFeeVerifyStatus === 'Pending' || lead.testFeeVerifyStatus === 'Approved'} 
                              onChange={() => setIsDirty(true)} 
                            />
                          </div>
                        </div>
                        <div className="mb-4 border-t border-slate-200 pt-3">
                          <label className={labelStyle}>Invoice No. (HR)</label>
                          <input 
                            type="text" 
                            name="invoiceNumber" 
                            disabled={isTransferredOut || currentTab !== "testing"} 
                            defaultValue={lead.invoiceNumber} 
                            placeholder="Generated by HR" 
                            className={lockedInputStyle} 
                            readOnly 
                          />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        {!isTransferredOut && renderVerifyButton(lead.testFeeVerifyStatus || "Unsubmitted", () => sendForVerification('TEST'), "TEST")}
                        {!isTransferredOut && renderUploadReceiptButton("Initial Test Receipt")}
                      </div>
                    </div>
                  </div>
                </div>

                {hasFailedExam && (
                  <div className="mb-8 animate-in fade-in slide-in-from-top-4 pt-6 border-t border-slate-200">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="bg-slate-800 text-white w-4 h-4 flex items-center justify-center rounded text-[9px]">2</span> Re-Test
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Icons.Calendar /> Schedule Re-Test
                          </h4>
                          <div className="mb-4">
                            <label className={labelStyle}>
                              Re-Test Date {isRetestDateLocked && <Icons.Lock />}
                            </label>
                            <input 
                              type="date" 
                              name="reTestDate" 
                              disabled={isTransferredOut || currentTab !== "testing"} 
                              defaultValue={formatDate(lead.reTestDate)} 
                              min={!isRetestDateLocked ? todayStr : undefined} 
                              className={isRetestDateLocked || isTransferredOut ? lockedInputStyle : inputStyle} 
                              readOnly={isRetestDateLocked || isTransferredOut} 
                              onChange={() => setIsDirty(true)} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Icons.Payment /> Collect Payment
                            </h4>
                            {renderVerifyBadge(lead.reTestFeeVerifyStatus)}
                          </div>
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className={labelStyle}>Re-Test Fee</label>
                              <input 
                                type="number" step="0.01" 
                                name="reTestFeesAmount" 
                                disabled={isTransferredOut || currentTab !== "testing"} 
                                defaultValue={lead.reTestFeesAmount} 
                                placeholder="0.00" 
                                className={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                                readOnly={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved'} 
                                onChange={() => setIsDirty(true)} 
                              />
                            </div>
                            <div>
                              <label className={labelStyle}>Date</label>
                              <input 
                                type="date" 
                                name="reTestPaymentDate" 
                                disabled={isTransferredOut || currentTab !== "testing"} 
                                defaultValue={formatDate(lead.reTestPaymentDate)} 
                                className={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                                readOnly={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved'} 
                                onChange={() => setIsDirty(true)} 
                              />
                            </div>
                            <div className="col-span-2">
                              <label className={labelStyle}>Notes</label>
                              <input 
                                type="text" 
                                name="reTestFeeRemarks" 
                                disabled={isTransferredOut || currentTab !== "testing"} 
                                defaultValue={lead.reTestFeeRemarks || ""} 
                                placeholder="Any notes..." 
                                className={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                                readOnly={isTransferredOut || lead.reTestFeeVerifyStatus === 'Pending' || lead.reTestFeeVerifyStatus === 'Approved'} 
                                onChange={() => setIsDirty(true)} 
                              />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          {!isTransferredOut && renderVerifyButton(lead.reTestFeeVerifyStatus || "Unsubmitted", () => sendForVerification('RETEST'), "RETEST", "bg-slate-100 text-slate-400")}
                          {!isTransferredOut && renderUploadReceiptButton("Re-Test Receipt")}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {otherPayments.filter((p: any) => p.isAutoRetest || p.isAutoReschedule).map((payment: any, idx: number) => {
                  const isPendingOrApproved = payment.status === 'Pending' || payment.status === 'Approved';
                  const isDynamicDateLocked = evalsCount >= payment.attempt || isPastDate(payment.testDate);

                  return (
                    <div key={payment.id} className="mb-8 animate-in fade-in slide-in-from-top-4 pt-6 border-t border-slate-200">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <span className="bg-slate-800 text-white w-4 h-4 flex items-center justify-center rounded text-[9px]">{payment.isAutoReschedule ? "!" : (3 + idx)}</span> {payment.name}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <div>
                            <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Icons.Calendar /> Schedule {payment.isAutoReschedule ? "Reschedule" : "Re-Test"}
                            </h4>
                            <div className="mb-4">
                              <label className={labelStyle}>
                                New Date {isDynamicDateLocked && <Icons.Lock />}
                              </label>
                              <input 
                                type="date" 
                                value={payment.testDate} 
                                onChange={(e) => updatePaymentRow(payment.id, 'testDate', e.target.value)} 
                                min={!isDynamicDateLocked ? todayStr : undefined} 
                                className={isTransferredOut || isDynamicDateLocked ? lockedInputStyle : inputStyle} 
                                readOnly={isTransferredOut || isDynamicDateLocked} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-md border border-slate-200 flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <div>
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Icons.Payment /> Collect Payment
                              </h4>
                              {renderVerifyBadge(payment.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className={labelStyle}>Fee Amount</label>
                                <input 
                                  type="number" step="0.01" 
                                  value={payment.amount} 
                                  onChange={(e) => updatePaymentRow(payment.id, 'amount', e.target.value)} 
                                  placeholder="0.00" 
                                  className={isTransferredOut || isPendingOrApproved ? lockedInputStyle : inputStyle} 
                                  readOnly={isTransferredOut || isPendingOrApproved} 
                                />
                              </div>
                              <div>
                                <label className={labelStyle}>Date</label>
                                <input 
                                  type="date" 
                                  value={payment.date} 
                                  onChange={(e) => updatePaymentRow(payment.id, 'date', e.target.value)} 
                                  className={isTransferredOut || isPendingOrApproved ? lockedInputStyle : inputStyle} 
                                  readOnly={isTransferredOut || isPendingOrApproved} 
                                />
                              </div>
                              <div className="col-span-2">
                                <label className={labelStyle}>Notes</label>
                                <input 
                                  type="text" 
                                  value={payment.remarks || ""} 
                                  onChange={(e) => updatePaymentRow(payment.id, 'remarks', e.target.value)} 
                                  placeholder="Any notes..." 
                                  className={isTransferredOut || isPendingOrApproved ? lockedInputStyle : inputStyle} 
                                  readOnly={isTransferredOut || isPendingOrApproved} 
                                />
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 mt-4">
                            {!isTransferredOut && renderVerifyButton(payment.status || "Unsubmitted", () => sendOtherForVerification(payment.id), payment.id, "bg-slate-100 text-slate-400")}
                            {!isTransferredOut && renderUploadReceiptButton(`Misc Receipt - ${payment.name}`)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
              {renderFollowUpBlock("Testing", "testing")}
            </div>

            {/* ================================================== */}
            {/* 📑 TAB 4: SERVICE AGREEMENT                        */}
            {/* ================================================== */}
            <div className={currentTab === "sa" ? "space-y-5 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              {!isExamPassed ? (
                /* 🔒 ENTERPRISE LOCKED STATE FOR SERVICE AGREEMENT */
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden animate-in zoom-in-95 duration-500">
                   <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-500"></div>
                   <div className="w-20 h-20 bg-white border border-slate-200 rounded-full flex items-center justify-center text-amber-500 shadow-md mb-6">
                     <div className="scale-150 text-amber-500"><Icons.Lock /></div>
                   </div>
                   <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Agreement Locked</h3>
                   <p className="text-slate-500 text-sm max-w-md font-medium leading-relaxed">
                     The Service Agreement cannot be processed until the candidate has successfully passed all required exams.
                   </p>
                   <button 
                     type="button" 
                     onClick={() => setCurrentTab('testing')} 
                     className="mt-8 text-sm font-bold text-indigo-600 flex items-center gap-2 transition-all bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 hover:shadow-sm px-6 py-3 rounded-xl border border-indigo-200 active:scale-95"
                   >
                     <Icons.Clipboard /> Check Testing Status
                   </button>
                </div>
              ) : (
                /* ✅ NORMAL SERVICE AGREEMENT FORM */
                <>
                  <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-slate-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-slate-100 pb-4 mb-5">
                      <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Icons.Handshake /> Service Agreement Processing
                      </h3>
                      <div className="flex items-center gap-3 mt-3 md:mt-0">
                        {renderVerifyBadge(lead.saFeeVerifyStatus)}
                        {(!isTransferredOut && (!lead.saFeeVerifyStatus || lead.saFeeVerifyStatus === "Unsubmitted" || lead.saFeeVerifyStatus === "Rejected")) && (
                          <button 
                            type="button" 
                            onClick={() => sendForVerification('SA')} 
                            disabled={verifyLoading === 'SA'} 
                            className="text-xs font-semibold bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-all shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:text-slate-500 flex items-center gap-1.5"
                          >
                            {verifyLoading === 'SA' ? <span className="animate-pulse">Sending...</span> : <><Icons.Upload /> Request Verification</>}
                          </button>
                        )}
                      </div>
                    </div>

                    {lead.saFeeVerifyStatus === 'Rejected' && lead.saFeeRejectReason && (
                      <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-md shadow-sm flex items-start gap-3">
                        <div className="text-rose-500 mt-0.5"><Icons.Alert /></div>
                        <div>
                          <strong className="block text-[11px] font-bold text-rose-800 mb-0.5">Payment Rejected</strong>
                          <span className="text-xs text-rose-700 font-medium">{lead.saFeeRejectReason}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 bg-slate-50 p-5 rounded-md border border-slate-200">
                      <div>
                        <label className={labelStyle}>Fee (AED)</label>
                        <input 
                          type="number" step="0.01" 
                          name="serviceAgreementAmount" 
                          disabled={isTransferredOut || currentTab !== "sa"} 
                          defaultValue={lead.serviceAgreementAmount} 
                          placeholder="0.00" 
                          className={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                          readOnly={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                          onChange={() => setIsDirty(true)} 
                        />
                      </div>
                      <div>
                        <label className={labelStyle}>Total Amount</label>
                        <input 
                          type="number" step="0.01" 
                          name="serviceAgreementTotal" 
                          disabled={isTransferredOut || currentTab !== "sa"} 
                          defaultValue={lead.serviceAgreementTotal} 
                          placeholder="0.00" 
                          className={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                          readOnly={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                          onChange={() => setIsDirty(true)} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStyle}>Payment Notes</label>
                        <input 
                          type="text" 
                          name="saFeeRemarks" 
                          disabled={isTransferredOut || currentTab !== "sa"} 
                          defaultValue={lead.saFeeRemarks || ""} 
                          placeholder="Any notes regarding this payment..." 
                          className={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                          readOnly={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                          onChange={() => setIsDirty(true)} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStyle}>Payment Date</label>
                        <input 
                          type="date" 
                          name="serviceAgreementPaymentDate" 
                          disabled={isTransferredOut || currentTab !== "sa"} 
                          defaultValue={formatDate(lead.serviceAgreementPaymentDate)} 
                          className={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved' ? lockedInputStyle : inputStyle} 
                          readOnly={isTransferredOut || lead.saFeeVerifyStatus === 'Pending' || lead.saFeeVerifyStatus === 'Approved'} 
                          onChange={() => setIsDirty(true)} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelStyle}>Invoice No. (HR)</label>
                        <input 
                          type="text" 
                          name="serviceAgreementInvoice" 
                          disabled={isTransferredOut || currentTab !== "sa"} 
                          defaultValue={lead.serviceAgreementInvoice} 
                          placeholder="Generated by HR" 
                          className={lockedInputStyle} 
                          readOnly 
                        />
                      </div>
                      <div className="md:col-span-4 mt-2">
                        {!isTransferredOut && renderUploadReceiptButton("Service Agreement Receipt")}
                      </div>
                    </div>
                  </div>
                  {renderFollowUpBlock("Agreement", "sa")}
                </>
              )}
            </div>

          </div>
          
          {/* RIGHT COLUMN (Timeline) */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-20 bg-white p-5 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Icons.Clipboard /> Activity Timeline
              </h3>
              <ActivityTimeline activities={lead.activities} />
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}