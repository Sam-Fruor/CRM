// src/app/(dashboard)/hr/[id]/ViewLead.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DocumentVault from "@/components/DocumentVault";
import { updateHRFile } from "@/app/actions/hrActions";
import ActivityTimeline from "@/components/ActivityTimeline";
import LeadStepper from "@/components/LeadStepper";
import toast, { Toaster } from "react-hot-toast";

// --- ENTERPRISE ICONS ---
const Icons = {
  User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Folder: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Clipboard: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Handshake: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Building: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  Cog: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Check: () => <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Copy: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Calendar: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Mail: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Payment: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Refresh: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  WhatsApp: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.016-.967-.259-.099-.447-.149-.635.149-.188.297-.755.967-.924 1.166-.17.198-.34.223-.637.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.652-2.059-.17-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.635-1.534-.87-2.1-.228-.548-.46-.474-.635-.482-.17-.008-.364-.009-.563-.009-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
};

const caseStatuses = [
  "Not Interested/Dropped Off", "Client Not Enrolled", "Pending Payment 1 (Service Agreement)", 
  "Stage 1 Under Process", "Stage 2 Under Process", "Stage 2 (Ops & HR)",
  "Stage 2: HR - Waiting for Job Offer", "Stage 2: HR - Waiting for Work Permit",
  "Stage 2: Ops - Welcome & Docs", "Stage 2: Ops - Collect Job Offer Payment", "Stage 2: Ops - Collect WP Payment",
  "Job Offer Letter Pending", "Signed Job Offer Letter Pending", "Pending Payment 2 (Job Offer Letter)", 
  "Work Permit Under Process", "Signed Work Permit Pending", "Pending Payment 3 (Work Permit)", 
  "Pending Payment 4 (Insurance)", "Visa Appointment Pending", "Visa Status Under process", 
  "Visa Approved", "Visa Rejected", "School Fees Pending", "Flight Ticket Pending",
  "Transferred to Examiner", "Code 95 & TRC"
];

// 🛠️ FORMATTING HELPERS
const formatDate = (dateString?: string | null) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
const formatDisplayDate = (dateString?: string | null) => dateString ? new Date(dateString).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' }) : "—";

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
    <button onClick={handleCopy} className="p-1 text-slate-400 hover:text-indigo-600 transition-colors" title={`Copy ${label}`}>
      {copied ? <Icons.Check /> : <Icons.Copy />}
    </button>
  );
};

// 🚀 "CLICK-TO-EDIT" WITH HIDDEN PAYLOAD
const EditableField = ({ label, name, initialValue, type = "text", disabled = false, numericOnly = false, onChange }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(initialValue || "");

  useEffect(() => { setVal(initialValue || ""); }, [initialValue]);

  const displayVal = type === "date" ? formatDisplayDate(val) : val;
  const inputStyle = "w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white border border-slate-200 text-slate-900 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm outline-none transition-all";

  const handleValChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value;
    if (numericOnly) newVal = newVal.replace(/[^0-9+ ]/g, ''); 
    setVal(newVal);
    onChange();
  };

  return (
    <div>
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{label}</label>
      <input type="hidden" name={name} value={type === "date" ? formatDate(val) : val} />
      
      {isEditing && !disabled ? (
        <input autoFocus type={type} value={type === "date" ? formatDate(val) : val} onChange={handleValChange} onBlur={() => setIsEditing(false)} className={inputStyle} />
      ) : (
        <div 
          onClick={() => !disabled && setIsEditing(true)}
          className={`text-sm font-medium px-3 py-2 rounded-lg border min-h-[38px] flex items-center relative group transition-all ${
            disabled ? "bg-slate-50/50 border-transparent text-slate-600 cursor-not-allowed" : "bg-white border-slate-200 text-slate-900 cursor-pointer hover:border-indigo-300 hover:shadow-sm"
          }`}
        >
          <span className="truncate pr-6">{displayVal || "—"}</span>
          {!disabled && <span className="absolute right-3 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity"><Icons.Edit /></span>}
        </div>
      )}
    </div>
  );
};

// 🚀 "/" SLASH COMMAND (QUICK MACROS) WITH HIDDEN PAYLOAD
const MacroTextarea = ({ name, initialValue, disabled, placeholder, onChange }: any) => {
  const [val, setVal] = useState(initialValue || "");
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => { setVal(initialValue || ""); }, [initialValue]);

  const templates = [
    "Client requested an update on Visa status.",
    "Awaiting pending documents from client.",
    "File moved to Operations for processing.",
    "Client is unresponsive to emails.",
    "Sent file to Management for special review."
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
      <input type="hidden" name={name} value={val} />
      <textarea 
        value={val} onChange={handleChange} readOnly={disabled} rows={4} placeholder={placeholder} 
        className={`w-full px-3 py-2 text-sm bg-slate-50 hover:bg-white border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm outline-none transition-all ${disabled ? 'text-slate-500 pointer-events-none' : 'text-slate-900'}`}
      />
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

export default function HRViewLead({ lead, activeTab }: { lead: any, activeTab: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 🗂️ Modals & Drawers
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [vaultDefaultCategory, setVaultDefaultCategory] = useState<string>("");
  const [vaultDefaultType, setVaultDefaultType] = useState<string>("");
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);

  // 📑 LOCAL TAB STATE
  const [currentTab, setCurrentTab] = useState(activeTab || "profile");
  const [isDirty, setIsDirty] = useState(false);     
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // 🧠 HR ROUTING STATE & LOCKING
  const [currentRoute, setCurrentRoute] = useState(lead.caseStatus);
  // 🚀 UPDATE: Ensure both archived states lock the UI down securely
  const isArchived = lead.caseStatus === "Transferred to Examiner" || lead.caseStatus === "Code 95 & TRC";

  // 🚀 DYNAMIC CUSTOM PAYMENTS STATE
  const initialCustomPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : [];
  const [customPayments, setCustomPayments] = useState<any[]>(initialCustomPayments);

  const addCustomPayment = () => {
    setIsDirty(true);
    const newId = `custom_${Date.now()}`;
    setCustomPayments([...customPayments, { id: newId, name: "", amount: "", status: "Unsubmitted" }]);
  };

  const removeCustomPayment = (idToRemove: string) => {
    setIsDirty(true);
    setCustomPayments(customPayments.filter(p => p.id !== idToRemove));
  };

  const isApproved = (status: string | null | undefined) => status === "Approved";
  const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : [];

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

  // 🎨 NEW SLEEK ENTERPRISE STYLING CONSTANTS
  const sectionStyle = "bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/60 mb-6 relative";
  const labelStyle = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block";
  const baseInputStyle = "w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all duration-200 border ";
  const inputStyle = baseInputStyle + "bg-slate-50 hover:bg-white border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";
  const lockedInputStyle = baseInputStyle + "bg-slate-50/50 border-transparent text-slate-500 font-medium pointer-events-none";
  const readOnlyGridValue = "text-sm font-semibold text-slate-800 bg-slate-50/50 px-3 py-2.5 rounded-lg border border-slate-100";

  const docs = lead.documentStatus || {};

  const handleInlineSave = async (e?: React.FormEvent<HTMLFormElement>, silent = false) => {
    if (e) e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    const formData = new FormData(formRef.current);
    try {
      await updateHRFile(lead.id, formData);
      setIsEditingDocs(false);
      setIsEditingProfile(false);
      setIsDirty(false);
      if (!silent) toast.success("HR Updates Saved Successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      if (!silent) toast.error("Failed to save updates.");
    } finally {
      setLoading(false);
    }
  };

  const handleRouteToOps = async (targetStatus: string, docUrl: string | null, amountName: string) => {
    if (!formRef.current) return;
    
    const formData = new FormData(formRef.current);
    const amount = formData.get(amountName);
    
    if (!amount || parseFloat(amount as string) <= 0) {
        return toast.error("❌ Please specify the amount Operations needs to collect.");
    }

    setLoading(true);
    formData.set("caseStatus", targetStatus); // Override the hidden route input!
    
    try {
        await updateHRFile(lead.id, formData);
        setCurrentRoute(targetStatus);
        setIsDirty(false);
        toast.success("✅ Successfully routed to Operations!");
        router.refresh();
    } catch (e) {
        toast.error("Failed to route file.");
    } finally {
        setLoading(false);
    }
  };

  // 🚀 ACTION: Explicit Transfer to Code 95 & TRC Deployment
  const handleTransferToCode95 = async () => {
    if (!formRef.current) return;
    setLoading(true);

    // 🚀 FIXED: We MUST pass the entire form so the server has givenName, surname, etc.
    const formData = new FormData(formRef.current);
    formData.set("caseStatus", "Code 95 & TRC"); 

    try {
        await updateHRFile(lead.id, formData);
        toast.success("Client Transferred to Code 95 & TRC Deployment!");
        setTimeout(() => {
          window.location.href = "/hr/archived";
        }, 1000);
    } catch(e) {
        console.error(e);
        toast.error("Failed to transfer file to Deployment.");
        setLoading(false);
    }
  };

  const openVaultPreFilled = (category: string, type: string) => {
    setVaultDefaultCategory(category);
    setVaultDefaultType(type);
    setIsVaultModalOpen(true);
  };

  const getExpiryCountdown = (dateString?: string | null) => {
    if (!dateString) return <span className="text-slate-400">—</span>;
    const exp = new Date(dateString);
    const now = new Date();
    now.setHours(0,0,0,0);
    if (exp < now) return <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Expired</span>;
    
    let m = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
    let d = exp.getDate() - now.getDate();
    if (d < 0) { m--; d += new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(); }
    
    if (m === 0 && d === 0) return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Expires Today</span>;
    return <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{m}m {d}d</span>;
  };

  let hasAnyFile = false;
  let absoluteLatestUrl: string | null = null;

  try {
    let f = lead.documentFiles;
    if (typeof f === 'string') f = JSON.parse(f);
    if (typeof f === 'string') f = JSON.parse(f); 
    
    let allUrls: string[] = [];
    
    const extractUrls = (obj: any) => {
      if (!obj) return;
      if (typeof obj === 'string' && (obj.startsWith('http') || obj.startsWith('blob:') || obj.startsWith('/'))) {
          allUrls.push(obj);
      } else if (Array.isArray(obj)) {
          obj.forEach(extractUrls);
      } else if (typeof obj === 'object') {
          if (obj.url && typeof obj.url === 'string') {
              allUrls.push(obj.url);
          } else {
              Object.values(obj).forEach(extractUrls);
          }
      }
    };
    
    extractUrls(f);
    
    if (allUrls.length > 0) {
      hasAnyFile = true;
      absoluteLatestUrl = allUrls[allUrls.length - 1]; 
    }
  } catch(e) {}

  const getLatestDocUrl = (expectedType: string, allowFallback = false) => {
    if (!lead.documentFiles) return allowFallback ? absoluteLatestUrl : null;
    
    let filesObj = lead.documentFiles;
    if (typeof filesObj === 'string') { try { filesObj = JSON.parse(filesObj); } catch(e) { filesObj = {}; } }
    if (typeof filesObj === 'string') { try { filesObj = JSON.parse(filesObj); } catch(e) { filesObj = {}; } }

    const cleanStr = (str: any) => String(str || "").toLowerCase().replace(/receipt|fee|payment|document|\.pdf|\.jpg|\.jpeg|\.png|\s|\(|\)|v\d+/g, "").replace(/[^a-z0-9]/g, '');
    const target = cleanStr(expectedType);
    let foundUrl: string | null = null;

    const searchDeep = (obj: any) => {
      if (!obj || foundUrl) return;
      if (Array.isArray(obj)) {
        for (let i = obj.length - 1; i >= 0; i--) { searchDeep(obj[i]); if (foundUrl) return; }
      } else if (typeof obj === 'object') {
        if (obj.url && typeof obj.url === 'string') {
           if (cleanStr(obj.documentType).includes(target) || cleanStr(obj.name).includes(target) || expectedType === obj.documentType || expectedType === obj.name) {
              foundUrl = obj.url; return;
           }
        }
        const keys = Object.keys(obj);
        for (let i = keys.length - 1; i >= 0; i--) {
          const key = keys[i];
          const val = obj[key];
          if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) {
             if (cleanStr(key).includes(target) || key === expectedType) { foundUrl = val; return; }
          } else {
             searchDeep(val); if (foundUrl) return;
          }
        }
      }
    };

    searchDeep(filesObj);
    
    if (foundUrl) return foundUrl;
    if (allowFallback) return absoluteLatestUrl; 
    return null;
  };

  const renderDocRow = (
    title: string, uploadCat: string, uploadType: string, isUploaded: boolean, 
    issueName?: string, issueDate?: string, expiryName?: string, expiryDate?: string, 
    docNumName?: string, docNum?: string
  ) => {
    const isOther = title === "TEST OR VIDEO";
    const docUrl = getLatestDocUrl(uploadType, false);

    return (
      <div className="flex flex-col md:flex-row md:items-center py-4 border-b border-slate-100 gap-4 group">
        <div className="w-full md:w-1/3 flex items-start gap-3">
          <div className="mt-0.5">{isUploaded ? <Icons.Check /> : <Icons.Cross />}</div>
          <div>
            <p className="font-bold text-slate-800 text-sm tracking-tight">{title}</p>
            <div className="mt-1">
              {docNumName && isEditingDocs ? (
                <input type="text" name={docNumName} defaultValue={docNum || ""} placeholder="Document No." className="w-full max-w-[140px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" />
              ) : docNum ? (
                <p className="text-xs text-slate-500 font-mono font-medium bg-slate-100/50 border border-slate-200 px-1.5 py-0.5 rounded inline-block">{docNum}</p>
              ) : null}
            </div>
          </div>
        </div>
        
        <div className="w-full md:flex-1 flex flex-wrap items-center gap-4">
          {issueName !== undefined ? (
            <>
              <div className="w-[120px]">
                {isEditingDocs ? <input type="date" name={issueName} defaultValue={formatDate(issueDate)} className="w-[120px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" /> : <span className="text-xs font-medium text-slate-600">{formatDisplayDate(issueDate)}</span>}
              </div>
              <div className="w-[120px]">
                {isEditingDocs ? <input type="date" name={expiryName} defaultValue={formatDate(expiryDate)} className="w-[120px] px-2 py-1 border border-slate-300 bg-white rounded text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm" /> : <span className="text-xs font-medium text-slate-600">{formatDisplayDate(expiryDate)}</span>}
              </div>
              <div className="w-[100px]">{getExpiryCountdown(expiryDate)}</div>
            </>
          ) : (
            <div className="flex-1 text-xs text-slate-400 font-medium italic">- Not Applicable -</div>
          )}
        </div>

        <div className="w-full md:w-auto flex justify-end gap-2 items-center opacity-80 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => openVaultPreFilled(isOther ? "" : uploadCat, isOther ? "" : uploadType)} className="text-xs font-medium bg-white text-slate-600 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1" disabled={isArchived}><Icons.Folder /> Upload</button>
          {docUrl ? (
            <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(docUrl); }} className="text-xs font-bold bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1"><Icons.Eye /> View</button>
          ) : (
            <button type="button" disabled className="text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg cursor-not-allowed flex items-center gap-1"><Icons.Eye /> View</button>
          )}
        </div>
      </div>
    );
  };

  const isBlocked = !hasAnyFile; 
  const saDocUrl = getLatestDocUrl("Service Agreement", true);

  const renderRoutingRow = (title: string, docType: string, amountName: string, routeTarget: string, verifyStatus: string, defaultValue: any) => {
    const docUrl = getLatestDocUrl(docType, true); 
    const approved = isApproved(verifyStatus);
    const isCurrentRoute = currentRoute === routeTarget;

    return (
      <div className={`flex flex-col md:flex-row md:items-center justify-between p-5 transition-all ${isBlocked || isArchived ? 'opacity-50 grayscale bg-slate-50 pointer-events-none' : 'bg-white hover:bg-slate-50'}`}>
        <div className="w-full md:w-1/4">
          <p className="text-sm font-bold text-slate-800">{title}</p>
        </div>
        
        <div className="w-full md:w-1/4 pr-4">
          <input 
              type="number" step="0.01" name={amountName} defaultValue={defaultValue} 
              onChange={() => setIsDirty(true)}
              className={approved || isBlocked || isArchived ? lockedInputStyle : inputStyle} placeholder="0.00" 
              readOnly={approved || isBlocked || isArchived} 
          />
        </div>
        
        <div className="w-full md:w-1/4 flex gap-2 items-center">
            <button type="button" onClick={() => openVaultPreFilled("HR Documents", docType)} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm" disabled={isBlocked || isArchived}><Icons.Upload /> Upload</button>
            {docUrl ? (
                <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(docUrl); }} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Icons.Eye /> View</button>
            ) : (
                <button type="button" disabled className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg cursor-not-allowed flex items-center gap-1"><Icons.Eye /> View</button>
            )}
        </div>
        
        <div className="w-full md:w-1/4 flex justify-end mt-4 md:mt-0">
            {approved ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200"><Icons.Check /> Paid & Approved</span>
            ) : verifyStatus === "Pending" ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 animate-pulse"><Icons.Clock /> Ops Pending</span>
            ) : isCurrentRoute ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200"><Icons.Clock /> With Ops</span>
            ) : (
                <button type="button" onClick={() => handleRouteToOps(routeTarget, docUrl, amountName)} disabled={isBlocked || isArchived} className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg transition-all shadow-sm active:scale-95 w-full md:w-auto">
                    Send to Ops <Icons.ArrowRight />
                </button>
            )}
        </div>
      </div>
    );
  };

  const renderReadOnlySalesFollowUp = (tabTitle: string) => (
    <div className="mt-8 border-t border-slate-100 pt-8">
      <h2 className="text-sm font-bold text-slate-500 pb-4 flex items-center gap-2"><Icons.Clipboard /> {tabTitle} Notes (Read-Only from Sales)</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-200/60">
        <div><p className={labelStyle}>Conversion Status</p><p className={readOnlyGridValue}>{lead.feedbackStatus || "Pending"}</p></div>
        <div><p className={labelStyle}>Last Call Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.lastCallDate)}</p></div>
        <div><p className={labelStyle}>Next Follow-up Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.followUpDate)}</p></div>
        <div className="md:col-span-3"><p className={labelStyle}>Follow-up Remarks</p><p className={readOnlyGridValue}>{lead.followUpRemarks || "-"}</p></div>
      </div>
    </div>
  );

  const masterLedger = [
    { name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: lead.testFeeVerifyStatus, collector: "Sales", receiptType: "Initial Test Receipt" },
    { name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: lead.reTestFeeVerifyStatus, collector: "Sales", receiptType: "Re-Test Receipt" },
    { name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: lead.saFeeVerifyStatus, collector: "Sales", receiptType: "Service Agreement Receipt" },
    { name: "Job Offer", amount: lead.jobOfferPending, date: lead.jobOfferPaymentDate, status: lead.jobOfferVerifyStatus, collector: "Ops", receiptType: "Job Offer Receipt" },
    { name: "Work Permit", amount: lead.workPermitPending, date: lead.workPermitPaymentDate, status: lead.workPermitVerifyStatus, collector: "Ops", receiptType: "Work Permit Receipt" },
    { name: "Insurance", amount: lead.insurancePending, date: lead.insurancePaymentDate, status: lead.insuranceVerifyStatus, collector: "Ops", receiptType: "Insurance Receipt" },
    { name: "School Fees", amount: lead.schoolFeesPending, date: lead.schoolFeesPaymentDate, status: lead.schoolFeesVerifyStatus, collector: "Ops", receiptType: "School Fees Receipt" },
    { name: "Flight Ticket", amount: lead.flightTicketPending, date: lead.flightTicketPaymentDate, status: lead.flightTicketVerifyStatus, collector: "Ops", receiptType: "Flight Ticket Receipt" },
    { name: "Other Ops Fee (Legacy)", amount: lead.otherPending, date: lead.otherPendingPaymentDate, status: lead.otherPendingVerifyStatus, collector: "Ops", receiptType: "Other Ops Receipt" },
    ...otherPayments.map((p: any) => ({ name: p.name, amount: p.amount, date: p.date, status: p.status, collector: "Ops", receiptType: `${p.name || "Custom"} Receipt` }))
  ].filter(item => item.amount);

  const lastInteractionTime = lead.updatedAt ? new Date(lead.updatedAt).getTime() : new Date().getTime();
  const daysStagnant = Math.floor((new Date().getTime() - lastInteractionTime) / (1000 * 3600 * 24));
  let slaBadge = <span className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> ACTIVE</span>;
  if (daysStagnant >= 7) slaBadge = <span className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm"><span className="text-blue-500">❄️</span> COLD ({daysStagnant}d)</span>;
  else if (daysStagnant >= 3) slaBadge = <span className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded border tracking-wider flex items-center gap-1 shadow-sm"><Icons.Alert /> WARM ({daysStagnant}d)</span>;

  const renderVerifyBadgeStatic = (status: string) => {
    const safeStatus = (status || "Unsubmitted").toLowerCase();
    if (safeStatus === "approved") return <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200"><Icons.Check /> Verified</span>;
    if (safeStatus === "pending") return <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 animate-pulse"><Icons.Clock /> Pending</span>;
    if (safeStatus === "rejected") return <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200"><Icons.Cross /> Rejected</span>;
    return <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">Unsubmitted</span>;
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 pt-4 relative">
      <Toaster position="bottom-right" reverseOrder={false} toastOptions={{ style: { fontSize: '14px', fontWeight: 'bold' } }} />

      {/* 🚀 THE MASSIVE GLOBAL ARCHIVE LOCK BANNER */}
      {isArchived && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl mb-8 flex items-center gap-5 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-slate-300 shrink-0">
            <Icons.Lock />
          </div>
          <div>
            <h2 className="text-white font-bold text-base tracking-tight">File is Archived (Read-Only)</h2>
            <p className="text-slate-400 text-sm mt-0.5 font-medium leading-snug">
              This candidate has been officially processed and archived. You can no longer edit this file.
            </p>
          </div>
        </div>
      )}

      {isDirty && !isArchived && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center justify-between gap-8 border border-slate-700/80 w-max">
            <span className="text-sm font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Unsaved changes detected.</span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => { formRef.current?.reset(); setIsDirty(false); }} className="text-xs font-bold text-slate-400 hover:text-white transition-colors">Discard</button>
              <button type="button" onClick={() => handleInlineSave()} disabled={loading} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-all active:scale-95">{loading ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}

      {previewDocUrl && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setPreviewDocUrl(null)}></div>
          <div className="w-full md:w-[600px] lg:w-[800px] bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 shadow-sm z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><Icons.Folder /> Document Preview</h3>
              <div className="flex items-center gap-3">
                <a href={previewDocUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md transition-colors">Open in New Tab</a>
                <button onClick={() => setPreviewDocUrl(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"><Icons.Cross /></button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200/50 p-4 lg:p-6 overflow-hidden">
              <iframe src={previewDocUrl} className="w-full h-full rounded-xl border border-slate-300 shadow-sm bg-white" />
            </div>
          </div>
        </div>
      )}

      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-lg flex items-center gap-2"><Icons.Folder /> Document Vault</h2>
              <button type="button" onClick={() => setIsVaultModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm"><Icons.Cross /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} defaultCategory={vaultDefaultCategory} defaultType={vaultDefaultType} onUploadSuccess={() => { setIsVaultModalOpen(false); router.refresh(); }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 gap-4 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 tracking-wider flex items-center gap-1">
              ID: {lead.id.slice(-6).toUpperCase()} <CopyAction text={lead.id} label="ID" />
            </span>
            <span className="bg-slate-50 text-slate-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
              <Icons.MapPin /> {lead.countryPreferred || "Unknown"}
            </span>
            {slaBadge}
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {lead.givenName} {lead.surname}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 group"><Icons.Phone /> <a href={`tel:${lead.callingNumber}`} className="hover:text-indigo-600 hover:underline">{lead.callingNumber}</a> <CopyAction text={lead.callingNumber} label="Phone" /></span>
            {lead.whatsappNumber && (
              <span className="flex items-center gap-1 text-emerald-600 group"><Icons.WhatsApp /> <a href={`https://wa.me/${lead.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline">{lead.whatsappNumber}</a> <CopyAction text={lead.whatsappNumber} label="WhatsApp" /></span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 text-slate-500 group"><Icons.Mail /> <a href={`mailto:${lead.email}`} className="hover:text-indigo-600 hover:underline">{lead.email}</a> <CopyAction text={lead.email} label="Email" /></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={isArchived ? "/hr/archived" : "/hr/verification"} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm">
            <Icons.ArrowLeft /> {isArchived ? "Back to Archived" : "Back to Queue"}
          </Link>
        </div>
      </div>

      <LeadStepper currentStatus={lead.caseStatus} />

      <form ref={formRef} onSubmit={(e) => handleInlineSave(e, false)}>
        <input type="hidden" name="caseStatus" value={currentRoute} />

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            
            <div className="flex space-x-8 border-b border-slate-200 overflow-x-auto custom-scrollbar mb-8">
              <button type="button" onClick={() => setCurrentTab("profile")} className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'profile' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.User /> Profile
              </button>
              <button type="button" onClick={() => setCurrentTab("documents")} className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'documents' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Folder /> Documents 
                {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full">{Object.keys(lead.documentFiles).length}</span>}
              </button>
              <button type="button" onClick={() => setCurrentTab("testing")} className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'testing' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Clipboard /> Assessments
              </button>
              <button type="button" onClick={() => setCurrentTab("sa")} className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'sa' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Handshake /> Agreement
              </button>
              <button type="button" onClick={() => setCurrentTab("hr")} className={`pb-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'hr' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Cog /> HR / Financials
              </button>
              <button type="button" onClick={() => setCurrentTab("ops")} className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'ops' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Building /> Operations
              </button>
              <button type="button" onClick={() => setCurrentTab("code95")} className={`pb-3 text-sm font-black border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${currentTab === 'code95' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
                <Icons.Check /> Code 95 & TRC
              </button>
            </div>

            <div className={currentTab === "profile" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Routing Information</h2>
                  {!isArchived && (
                    <button type="button" onClick={() => { if (isEditingProfile) handleInlineSave(); else setIsEditingProfile(true); }} disabled={loading} className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2 ${isEditingProfile ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                      {loading && isEditingProfile ? "Saving..." : isEditingProfile ? "Done Editing" : <><Icons.Edit /> Edit Data</>}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <EditableField label="Lead Source" name="leadSource" initialValue={lead.leadSource} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Category" name="category" initialValue={lead.category} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Preferred Country" name="countryPreferred" initialValue={lead.countryPreferred} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Slot Booking Date" name="slotBookingDate" type="date" initialValue={lead.slotBookingDate} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Test Date" name="testDate" type="date" initialValue={lead.testDate} disabled={isArchived} onChange={() => setIsDirty(true)} />
                </div>
              </div>
              <div className={sectionStyle}>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">Client Information</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <EditableField label="Full Name" name="givenName" initialValue={lead.givenName} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Father's Name" name="fatherName" initialValue={lead.fatherName} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Date of Birth" name="dob" type="date" initialValue={lead.dob} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Phone" name="callingNumber" initialValue={lead.callingNumber} disabled={isArchived} numericOnly={true} onChange={() => setIsDirty(true)} />
                  <EditableField label="WhatsApp" name="whatsappNumber" initialValue={lead.whatsappNumber} disabled={isArchived} numericOnly={true} onChange={() => setIsDirty(true)} />
                  <EditableField label="Email" name="email" initialValue={lead.email} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <div className="md:col-span-3">
                    <EditableField label="Nationality" name="nationality" initialValue={lead.nationality} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  </div>
                </div>
              </div>
              <div className={sectionStyle}>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6">Experience & History</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <EditableField label="Home Exp" name="experienceHome" type="number" initialValue={lead.experienceHome} disabled={isArchived} numericOnly={true} onChange={() => setIsDirty(true)} />
                  <EditableField label="GCC Exp" name="experienceGCC" type="number" initialValue={lead.experienceGCC} disabled={isArchived} numericOnly={true} onChange={() => setIsDirty(true)} />
                  <EditableField label="Previous Agency" name="previousAgency" initialValue={lead.previousAgency} disabled={isArchived} onChange={() => setIsDirty(true)} />
                  <EditableField label="Prev. Country" name="previousCountry" initialValue={lead.previousCountry} disabled={isArchived} onChange={() => setIsDirty(true)} />
                </div>
              </div>
              {renderReadOnlySalesFollowUp("Lead Profile")}
            </div>

            <div className={currentTab === "documents" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-4 mb-2 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">Core ID Checklist</h2>
                  {!isArchived && (
                    <button type="button" onClick={() => { if (isEditingDocs) handleInlineSave(); else setIsEditingDocs(true); }} disabled={loading} className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-2 ${isEditingDocs ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}>
                      {loading && isEditingDocs ? "Saving..." : isEditingDocs ? <><Icons.Check /> Done Editing</> : <><Icons.Edit /> Edit Dates & IDs</>}
                    </button>
                  )}
                </div>
                <div className="flex flex-col">
                  {renderDocRow("CV / RESUME", "Client", "CV / Resume", docs.resumeUploaded)}
                  {renderDocRow("PASSPORT", "Client", "Passport", docs.passportUploaded, "passportIssueDate", lead.passportIssueDate, "passportExpiry", lead.passportExpiry, "passportNum", lead.passportNum)}
                  {renderDocRow("DRIVING LICENCE", "Client", "Driving License", docs.dlUploaded, "dlIssueDate", lead.dlIssueDate, "dlExpiry", lead.dlExpiry, "dlNumber", lead.dlNumber)}
                  {renderDocRow("RESIDENT ID", "Client", "Emirates ID", docs.residentIdUploaded, "residentIdIssueDate", lead.residentIdIssueDate, "residentIdExp", lead.residentIdExp, "residentIdNum", lead.residentIdNum)}
                  {renderDocRow("TEST OR VIDEO", "Client", "Other Document", docs.videoUploaded)}
                </div>
              </div>
              <div className="mt-8 border-t border-slate-100 pt-8">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2"><Icons.Folder /> Complete Document Vault</h2>
                <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} defaultCategory={vaultDefaultCategory} defaultType={vaultDefaultType} onUploadSuccess={() => router.refresh()} />
              </div>
              {renderReadOnlySalesFollowUp("Documents")}
            </div>

            <div className={currentTab === "testing" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              {combinedHistory.length > 0 && (
                <div className={sectionStyle}>
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex justify-between items-center">
                    <span className="flex items-center gap-2"><Icons.Clipboard /> Exam Scores & History</span>
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Current Final Status</h3>
                        <span className={`text-[11px] font-bold px-3 py-1 rounded-md border shadow-sm ${lead.examinerStatus === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : (lead.examinerStatus === "Denied" || lead.examinerStatus === "Rejected") ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>{lead.examinerStatus?.toUpperCase() || "PENDING"}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center text-center">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">English Assessment</p>
                          <p className="text-4xl font-black text-slate-800 tracking-tight">{lead.englishScore !== null ? lead.englishScore : "-"}<span className="text-sm text-slate-400 font-medium ml-1">/10</span></p>
                          <p className={`text-sm font-bold mt-2 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-rose-600' : 'text-slate-500'}`}>{lead.englishTestResult || "Pending"}</p>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-200/60 shadow-sm flex flex-col items-center text-center">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                          <p className="text-4xl font-black text-slate-800 tracking-tight">{lead.drivingScore !== null ? lead.drivingScore : "-"}<span className="text-sm text-slate-400 font-medium ml-1">/10</span></p>
                          <p className={`text-sm font-bold mt-2 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-rose-600' : 'text-slate-500'}`}>{lead.yardTestResult || "Pending"}</p>
                        </div>
                      </div>
                      {lead.examinerRemarks && (
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Latest Examiner Remarks</p>
                          <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{lead.examinerRemarks}</p>
                        </div>
                      )}
                    </div>
                    <div className="pt-6 border-t border-slate-100">
                      <h3 className="text-[11px] font-bold text-slate-500 mb-4 uppercase tracking-wider">Testing History ({combinedHistory.length} Attempts)</h3>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {combinedHistory.map((test: any) => (
                          <div key={test.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${test.isMissed ? 'bg-amber-50/30 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div>
                              <p className={`text-sm font-bold ${test.isMissed ? 'text-amber-800' : 'text-slate-800'}`}>{test.attemptLabel} <span className={`font-medium text-[11px] ml-2 ${test.isMissed ? 'text-amber-600' : 'text-slate-400'}`}>({new Date(test.createdAt).toLocaleDateString("en-GB")})</span></p>
                              <p className="text-xs text-slate-500 mt-1 font-medium">English: <span className={`font-semibold ${test.isMissed ? 'text-amber-600' : 'text-slate-700'}`}>{test.englishScore !== "-" ? `${test.englishScore}/10` : "-"}</span> <span className="mx-2 text-slate-200">|</span> Yard: <span className={`font-semibold ${test.isMissed ? 'text-amber-600' : 'text-slate-700'}`}>{test.drivingScore !== "-" ? `${test.drivingScore}/10` : "-"}</span></p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider border shadow-sm ${test.isMissed ? 'bg-amber-50 text-amber-700 border-amber-200' : test.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>{test.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div className={sectionStyle}>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2"><Icons.Calendar /> Scheduling & Fees</span>
                </h2>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800">Initial Test Setup</h3>
                    {renderVerifyBadgeStatic(lead.testFeeVerifyStatus)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 shadow-sm">
                      <p className={labelStyle}>Test Date</p>
                      <input type="date" name="testDate" defaultValue={formatDate(lead.testDate)} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200/60 shadow-sm">
                      <div>
                        <p className={labelStyle}>Test Fees</p>
                        <input type="number" step="0.01" name="testFeesAmount" defaultValue={lead.testFeesAmount} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                      </div>
                      <div>
                        <p className={labelStyle}>Invoice No.</p>
                        <input type="text" name="invoiceNumber" defaultValue={lead.invoiceNumber} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                      </div>
                      <div className="col-span-2">
                        <p className={labelStyle}>Payment Date</p>
                        <input type="date" name="paymentDate" defaultValue={formatDate(lead.paymentDate)} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                      </div>
                      <div className="col-span-2">
                        <p className={labelStyle}>Payment Notes</p>
                        <input type="text" name="testFeeRemarks" defaultValue={lead.testFeeRemarks || ""} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>
                {lead.reTestDate && (
                  <div className="mb-8 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-rose-700">Attempt 2: Re-Test</h3>
                      {renderVerifyBadgeStatic(lead.reTestFeeVerifyStatus)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-rose-50/30 p-5 rounded-xl border border-rose-100 shadow-sm">
                        <p className={labelStyle}>Re-Test Date</p>
                        <input type="date" name="reTestDate" defaultValue={formatDate(lead.reTestDate)} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                      </div>
                      <div className="grid grid-cols-2 gap-6 bg-rose-50/30 p-5 rounded-xl border border-rose-100 shadow-sm">
                        <div>
                          <p className={labelStyle}>Re-Test Fee</p>
                          <input type="number" step="0.01" name="reTestFeesAmount" defaultValue={lead.reTestFeesAmount} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                        </div>
                        <div>
                          <p className={labelStyle}>Invoice No.</p>
                          <input type="text" name="reTestInvoiceNumber" defaultValue={lead.reTestInvoiceNumber} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                        </div>
                        <div className="col-span-2">
                          <p className={labelStyle}>Payment Date</p>
                          <input type="date" name="reTestPaymentDate" defaultValue={formatDate(lead.reTestPaymentDate)} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                        </div>
                        <div className="col-span-2">
                          <p className={labelStyle}>Payment Notes</p>
                          <input type="text" name="reTestFeeRemarks" defaultValue={lead.reTestFeeRemarks || ""} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {renderReadOnlySalesFollowUp("Testing")}
            </div>

            <div className={currentTab === "sa" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              <div className={sectionStyle}>
                <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Icons.Handshake /> Service Agreement Details</h3>
                  <div className="flex items-center gap-2">
                    {renderVerifyBadgeStatic(lead.saFeeVerifyStatus)}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200/60 shadow-sm">
                  <div>
                    <p className={labelStyle}>Agreement Fee</p>
                    <input type="number" step="0.01" name="serviceAgreementAmount" defaultValue={lead.serviceAgreementAmount} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                  <div>
                    <p className={labelStyle}>Total Deal Amount</p>
                    <input type="number" step="0.01" name="serviceAgreementTotal" defaultValue={lead.serviceAgreementTotal} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                  <div>
                    <p className={labelStyle}>Invoice No.</p>
                    <input type="text" name="serviceAgreementInvoice" defaultValue={lead.serviceAgreementInvoice} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                  <div>
                    <p className={labelStyle}>Payment Date</p>
                    <input type="date" name="serviceAgreementPaymentDate" defaultValue={formatDate(lead.serviceAgreementPaymentDate)} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                  <div className="col-span-2">
                    <p className={labelStyle}>Payment Notes</p>
                    <input type="text" name="saFeeRemarks" defaultValue={lead.saFeeRemarks || ""} disabled={isArchived} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                </div>
              </div>
              {renderReadOnlySalesFollowUp("Service Agreement")}
            </div>

            <div className={currentTab === "hr" ? "space-y-6 animate-in fade-in duration-300 block" : "hidden"}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-30 -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Deal Amount</p>
                  <p className="text-3xl font-black text-white tracking-tight">{totalDealAmount.toFixed(2)} <span className="text-sm font-medium text-slate-400">AED</span></p>
                </div>
                <div className="relative z-10 md:border-l border-slate-700 md:pl-6">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Collected</p>
                  <p className="text-3xl font-black text-emerald-400 tracking-tight">{totalCollectedAmount.toFixed(2)} <span className="text-sm font-medium text-emerald-700/50">AED</span></p>
                </div>
                <div className="relative z-10 md:border-l border-slate-700 md:pl-6">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Remaining Balance</p>
                  <p className="text-3xl font-black text-amber-400 tracking-tight">{remainingBalance.toFixed(2)} <span className="text-sm font-medium text-amber-700/50">AED</span></p>
                </div>
              </div>

              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Icons.Cog /> Financial Routing & Collections
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Files cannot be routed to Operations for collection until the required document is uploaded below.</p>
                </div>

                {isBlocked && !isArchived && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 flex items-center gap-3 animate-in slide-in-from-top-2">
                     <div className="text-amber-600"><Icons.Alert /></div>
                     <div>
                         <p className="text-sm font-bold text-amber-800">Action Required: Upload Document</p>
                         <p className="text-xs text-amber-700 font-medium">You must upload a document in the vault before you can route further items to Operations.</p>
                     </div>
                  </div>
                )}
                
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="w-full md:w-1/4">
                      <p className="text-sm font-bold text-slate-800">Service Agreement</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">Collected by Sales</p>
                    </div>
                    <div className="w-full md:w-1/4 pr-4">
                      <input type="text" readOnly value={`${totalCollectedAmount.toFixed(2)} AED`} className={lockedInputStyle} />
                      <input type="hidden" name="serviceAgreementPending" value={lead.serviceAgreementPending || ""} />
                    </div>
                    <div className="w-full md:w-1/4 flex gap-2 items-center">
                        <button type="button" onClick={() => openVaultPreFilled("HR Documents", "Service Agreement")} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm" disabled={isArchived}><Icons.Upload /> Upload</button>
                        {saDocUrl ? (
                            <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(saDocUrl); }} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Icons.Eye /> View</button>
                        ) : (
                            <button type="button" disabled className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg cursor-not-allowed flex items-center gap-1"><Icons.Eye /> View</button>
                        )}
                    </div>
                    <div className="w-full md:w-1/4 flex justify-end mt-4 md:mt-0">
                        {saDocUrl ? (
                           <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200"><Icons.Check /> Uploaded</span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-4 py-2 rounded-lg border border-rose-200 animate-pulse"><Icons.Alert /> Required</span>
                        )}
                    </div>
                  </div>

                  {renderRoutingRow("Job Offer", "Job Offer", "jobOfferPending", "Stage 2: Ops - Collect Job Offer Payment", lead.jobOfferVerifyStatus, lead.jobOfferPending)}
                  {renderRoutingRow("Work Permit", "Work Permit", "workPermitPending", "Stage 2: Ops - Collect WP Payment", lead.workPermitVerifyStatus, lead.workPermitPending)}
                  {renderRoutingRow("Insurance", "Insurance", "insurancePending", "Pending Payment 4 (Insurance)", lead.insuranceVerifyStatus, lead.insurancePending)}
                  {renderRoutingRow("School Fees", "School Fees", "schoolFeesPending", "School Fees Pending", lead.schoolFeesVerifyStatus, lead.schoolFeesPending)}
                  {renderRoutingRow("Flight Ticket", "Flight Ticket", "flightTicketPending", "Flight Ticket Pending", lead.flightTicketVerifyStatus, lead.flightTicketPending)}

                  <div className={`flex flex-col md:flex-row md:items-center justify-between p-5 transition-all ${isBlocked || isArchived ? 'opacity-50 grayscale bg-slate-50 pointer-events-none' : 'bg-white hover:bg-slate-50'}`}>
                    <div className="w-full md:w-1/4">
                      <p className="text-sm font-bold text-slate-800">Other / Misc <span className="text-[9px] text-slate-400 font-normal ml-1">(Legacy)</span></p>
                    </div>
                    <div className="w-full md:w-1/4 pr-4">
                      <input type="number" step="0.01" name="otherPending" defaultValue={lead.otherPending} onChange={() => setIsDirty(true)}
                        className={isApproved(lead.otherPendingVerifyStatus) || isBlocked || isArchived ? lockedInputStyle : inputStyle} placeholder="0.00" 
                        readOnly={isApproved(lead.otherPendingVerifyStatus) || isBlocked || isArchived} />
                    </div>
                    <div className="w-full md:w-1/4 flex gap-2 items-center">
                        <button type="button" onClick={() => openVaultPreFilled("HR Documents", "Other Misc")} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm" disabled={isBlocked || isArchived}><Icons.Upload /> Upload</button>
                        {getLatestDocUrl("Other Misc", true) ? (
                            <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(getLatestDocUrl("Other Misc", true)); }} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Icons.Eye /> View</button>
                        ) : (
                            <button type="button" disabled className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg cursor-not-allowed flex items-center gap-1"><Icons.Eye /> View</button>
                        )}
                    </div>
                    <div className="w-full md:w-1/4 flex justify-end mt-4 md:mt-0">
                      {isApproved(lead.otherPendingVerifyStatus) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200"><Icons.Check /> Paid & Approved</span>
                      ) : lead.otherPendingVerifyStatus === "Pending" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 animate-pulse"><Icons.Clock /> Ops Pending</span>
                      ) : (
                        <button type="button" onClick={() => handleRouteToOps(currentRoute, getLatestDocUrl("Other Misc", true), "otherPending")} disabled={isBlocked || isArchived} className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg transition-all shadow-sm active:scale-95 w-full md:w-auto">
                            Send to Ops <Icons.ArrowRight />
                        </button>
                      )}
                    </div>
                  </div>

                  {customPayments.map((p: any) => {
                    const approved = isApproved(p.status);
                    const docType = p.name || "Custom Fee";
                    const docUrl = getLatestDocUrl(docType, true);

                    return (
                      <div key={p.id} className={`flex flex-col md:flex-row md:items-center justify-between p-5 transition-all border-l-4 border-l-indigo-500 ${isBlocked || isArchived ? 'opacity-50 grayscale bg-slate-50 pointer-events-none' : 'bg-indigo-50/30 hover:bg-indigo-50/50'}`}>
                        <input type="hidden" name="customPaymentIds" value={p.id} />
                        <div className="w-full md:w-1/4 pr-4">
                          <input type="text" name={`customName_${p.id}`} defaultValue={p.name} placeholder="Fee Name (e.g. Fine)" className={approved || isBlocked || isArchived ? lockedInputStyle : inputStyle} required readOnly={approved || isBlocked || isArchived} onChange={() => setIsDirty(true)} />
                        </div>
                        <div className="w-full md:w-1/4 pr-4">
                          <input type="number" step="0.01" name={`customAmount_${p.id}`} defaultValue={p.amount} className={approved || isBlocked || isArchived ? lockedInputStyle : inputStyle} placeholder="0.00 AED" required readOnly={approved || isBlocked || isArchived} onChange={() => setIsDirty(true)} />
                        </div>
                        <div className="w-full md:w-1/4 flex gap-2 items-center">
                            <button type="button" onClick={() => openVaultPreFilled("HR Documents", docType)} className="text-xs font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-2 rounded-lg transition-colors flex items-center gap-1 shadow-sm" disabled={isBlocked || !p.name || isArchived}><Icons.Upload /> Upload</button>
                            {docUrl ? (
                                <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(docUrl); }} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Icons.Eye /> View</button>
                            ) : (
                                <button type="button" disabled className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg cursor-not-allowed flex items-center gap-1"><Icons.Eye /> View</button>
                            )}
                        </div>
                        <div className="w-full md:w-1/4 flex justify-end items-center gap-3 mt-4 md:mt-0">
                          {approved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200"><Icons.Check /> Paid & Approved</span>
                          ) : p.status === "Pending" ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 animate-pulse"><Icons.Clock /> Ops Pending</span>
                          ) : (
                              <>
                                <button type="button" onClick={() => handleRouteToOps("Stage 2 (Ops & HR)", docUrl, `customAmount_${p.id}`)} disabled={isBlocked || !p.name || isArchived} className="inline-flex items-center justify-center gap-2 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 w-full md:w-auto">
                                    Send to Ops <Icons.ArrowRight />
                                </button>
                                <button type="button" onClick={() => removeCustomPayment(p.id)} disabled={isArchived} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-md transition-colors disabled:opacity-50"><Icons.Cross /></button>
                              </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="p-5 bg-slate-50 text-center border-t border-slate-200">
                    <button type="button" onClick={addCustomPayment} disabled={isBlocked || isArchived} className={`text-sm font-bold transition-colors ${isBlocked || isArchived ? 'text-slate-400 cursor-not-allowed' : 'text-indigo-600 hover:text-indigo-800'}`}>
                      + Add Custom Fee Route
                    </button>
                  </div>

                </div>
              </div>

              <div className={sectionStyle}>
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex items-center gap-2"><Icons.Clipboard /> Master Collection Ledger</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4 font-bold">Payment Item</th>
                        <th className="py-3 px-4 font-bold">Amount</th>
                        <th className="py-3 px-4 font-bold">Date</th>
                        <th className="py-3 px-4 font-bold">Collector</th>
                        <th className="py-3 px-4 font-bold text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {masterLedger.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 px-4 text-center text-sm font-medium text-slate-400 bg-slate-50/50">No payments collected yet.</td></tr>
                      ) : (
                        masterLedger.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-slate-800">{item.name}</td>
                            <td className="py-4 px-4 text-sm font-bold text-emerald-600">{item.amount} AED</td>
                            <td className="py-4 px-4 text-xs font-medium text-slate-600">{formatDisplayDate(item.date)}</td>
                            <td className="py-4 px-4"><span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded shadow-sm">{item.collector}</span></td>
                            <td className="py-4 px-4 text-right flex justify-end items-center gap-3">
                              {renderVerifyBadgeStatic(item.status)}
                              {getLatestDocUrl(item.receiptType, true) && (
                                <button type="button" onClick={(e) => { e.preventDefault(); setPreviewDocUrl(getLatestDocUrl(item.receiptType, true)); }} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                  <Icons.Eye />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={sectionStyle}>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Icons.Edit /> HR Case Notes & Follow-ups
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                  <div>
                    <label className={labelStyle}>Last HR Action Date</label>
                    <input type="date" name="lastEmailDate" disabled={isArchived} defaultValue={formatDate(lead.lastEmailDate)} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Next HR Follow-Up</label>
                    <input type="date" name="hrNextFollowUpDate" disabled={isArchived} defaultValue={formatDate(lead.hrNextFollowUpDate)} onChange={() => setIsDirty(true)} className={inputStyle} />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Internal HR Notes</label>
                  <MacroTextarea name="hrRemarks" disabled={isArchived} initialValue={lead.hrRemarks || ""} placeholder="Add private follow-up notes or internal HR remarks... (Press '/' for macros)" onChange={() => setIsDirty(true)} />
                </div>
              </div>
            </div>

            {/* TAB 6: OPERATIONS (READ ONLY) */}
            <div className={currentTab === "ops" ? "space-y-6 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              <div className={sectionStyle}>
                <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Icons.Building /> Operations Ledger</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded shadow-sm"><Icons.Lock /> Read-Only</span>
                </div>
                <div>
                  <label className={labelStyle}>Total Collected by Ops (All Time)</label>
                  <div className="w-full md:w-1/3 p-4 bg-emerald-50 text-emerald-900 text-xl font-black border border-emerald-200 rounded-xl shadow-sm">
                    {lead.totalPayment ? `${lead.totalPayment} AED` : "0.00 AED"}
                  </div>
                </div>
              </div>

              <div className={sectionStyle}>
                <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2"><Icons.Clipboard /> Operations Remarks</h3>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded shadow-sm"><Icons.Lock /> Read-Only</span>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200/60 min-h-[100px]">
                  <p className="text-sm text-slate-700 whitespace-pre-wrap font-medium">
                    {lead.opsRemarks || "No remarks provided by Operations yet."}
                  </p>
                </div>
              </div>
            </div>

            {/* 🚀 NEW TAB 7: CODE 95 & TRC FINAL DEPLOYMENT */}
            <div className={currentTab === "code95" ? "space-y-6 animate-in fade-in duration-300 block mt-4" : "hidden"}>
              <div className="bg-slate-900 text-white p-8 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-amber-500"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500 rounded-full blur-[120px] opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
                
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 mb-6 shadow-lg z-10">
                   <div className="scale-150 text-amber-400"><Icons.Check /></div>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4 z-10">Finalize Client Profile</h2>
                <p className="text-slate-400 font-medium max-w-lg mx-auto mb-10 z-10">
                  By executing this transfer, you are confirming that all HR deployment and operations are complete. This will permanently archive the file and send it directly to the Examiner Queue for Code 95 & TRC Deployment.
                </p>

                <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 rounded-2xl p-6 mb-10 z-10 text-left">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate</span>
                     <span className="text-sm font-black text-white">{lead.givenName} {lead.surname}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ID</span>
                     <span className="text-sm font-black text-white">{lead.id.slice(-6).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Ops Revenue</span>
                     <span className="text-lg font-black text-emerald-400">{lead.totalPayment ? `${lead.totalPayment} AED` : "0.00 AED"}</span>
                  </div>
                </div>

                {!isArchived ? (
                  <button 
                    type="button"
                    onClick={handleTransferToCode95}
                    disabled={loading}
                    className="z-10 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {loading ? "Deploying..." : "Transfer to Examiner (Code 95 & TRC)"}
                  </button>
                ) : (
                  <button type="button" disabled className="z-10 bg-slate-800 text-slate-500 font-black text-sm uppercase tracking-wider px-8 py-4 rounded-xl border border-slate-700 cursor-not-allowed flex items-center gap-3">
                    <Icons.Lock /> File Already Transferred
                  </button>
                )}
              </div>
            </div>

          </div>
          
          {/* TIMELINE COLUMN */}
          <div className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 flex items-center gap-2">
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