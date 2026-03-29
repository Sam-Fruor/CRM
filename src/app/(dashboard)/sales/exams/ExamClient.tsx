// src/app/(dashboard)/sales/exams/ExamClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateSalesProcessing } from "@/app/actions/salesActions";
import toast, { Toaster } from "react-hot-toast";

// --- ENTERPRISE ICONS ---
const Icons = {
  Target: () => <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  CheckCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Wallet: () => <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Refresh: () => <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Filter: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  SortAsc: () => <svg className="w-3 h-3 inline ml-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>,
  SortDesc: () => <svg className="w-3 h-3 inline ml-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>,
  Alert: () => <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>,
  Cross: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  WhatsApp: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.016-.967-.259-.099-.447-.149-.635.149-.188.297-.755.967-.924 1.166-.17.198-.34.223-.637.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.652-2.059-.17-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.635-1.534-.87-2.1-.228-.548-.46-.474-.635-.482-.17-.008-.364-.009-.563-.009-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  EmptyState: () => <svg className="w-12 h-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  UserIcon: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Loading: () => <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
};

// --- HELPER TO GET INITIALS ---
const getInitials = (first: string, last: string) => {
  return `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}`;
};

// --- DATE FORMATTER FOR INPUTS ---
const formatDateForInput = (dateString: string | null) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split('T')[0];
};

export default function ExamClient({ initialLeads }: { initialLeads: any[] }) {
  const router = useRouter();

  // 🗂️ STATE: Navigation, Search, & Sort
  const [currentView, setCurrentView] = useState<"passed" | "failed" | "upcoming">("passed");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'testDate', direction: 'asc' });

  // ⚡ STATE: Quick-Peek Drawer
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  
  // ✍️ STATE: Inline Editing (Upcoming Tab)
  const [quickTestDate, setQuickTestDate] = useState("");
  const [quickRemarks, setQuickRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 🧮 PRE-PROCESSING: Data Categorization
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const passedLeads = initialLeads.filter(lead => lead.examinerStatus === "Approved");
  const failedLeads = initialLeads.filter(lead => lead.examinerStatus === "Rejected");
  const upcomingLeads = initialLeads.filter(lead => lead.testDate !== null && (!lead.examinerStatus || lead.examinerStatus === "Pending"));

  const getTargetLeads = () => {
    if (currentView === "passed") return passedLeads;
    if (currentView === "failed") return failedLeads;
    return upcomingLeads;
  };

  // 🔍 SMART FILTER & SORT ENGINE
  const filteredAndSortedLeads = useMemo(() => {
    let result = getTargetLeads();

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        (l.givenName?.toLowerCase() || "").includes(q) ||
        (l.surname?.toLowerCase() || "").includes(q) ||
        (l.callingNumber || "").includes(q) ||
        (l.id || "").toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(l => l.category === categoryFilter);
    }

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === 'testDate') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      if (sortConfig.key === 'englishScore' || sortConfig.key === 'drivingScore') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [currentView, searchQuery, categoryFilter, sortConfig, initialLeads]);

  // 🛡️ HYDRATION FIX: Safely derive and alphabetically sort unique categories.
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(initialLeads.map(l => l.category).filter(Boolean))).sort();
  }, [initialLeads]);

  // ⏱️ SLA AGING CALCULATOR
  const getSLA = (updatedAt: string) => {
    const daysInStatus = Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 3600 * 24));
    if (daysInStatus >= 3) {
      return <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black tracking-wider border border-rose-200 animate-pulse"><Icons.Alert /> {daysInStatus}D STAGNANT</span>;
    }
    return null;
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'asc' ? <Icons.SortAsc /> : <Icons.SortDesc />;
  };

  // 🚀 ACTION: Save Quick Peek Updates
  const handleQuickSave = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("testDate", quickTestDate);
      formData.append("salesRemarks", quickRemarks);
      
      await updateSalesProcessing(selectedLead.id, formData);
      
      toast.success("Schedule & Remarks updated successfully!");
      router.refresh();
      setSelectedLead(null); // Close the drawer upon success
    } catch (e) {
      toast.error("Failed to update lead.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🚀 PROGRESS BAR RENDERING
  const renderProgressBar = (score: any, status: string) => {
    if (score === null || score === "-") return null;
    const num = parseFloat(score);
    if (isNaN(num)) return null;
    const percentage = Math.min(100, Math.max(0, (num / 10) * 100));
    const colorClass = status === 'Passed' ? 'bg-emerald-500' : status === 'Failed' ? 'bg-rose-500' : 'bg-indigo-500';
    return (
      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden shadow-inner">
        <div className={`h-full ${colorClass} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 pt-4 relative">
      <Toaster position="bottom-right" />

      {/* 🚀 QUICK-PEEK DRAWER (SLIDE OUT PANEL) */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex-1 cursor-pointer" onClick={() => setSelectedLead(null)}></div>
          <div className="w-full md:w-[450px] bg-slate-50 h-full shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300 border-l border-slate-200">
            
            {/* Drawer Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-start shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
              <div>
                <p className="text-[10px] font-bold text-indigo-600 tracking-wider uppercase mb-1">ID: {selectedLead.id.slice(-6)}</p>
                <h2 className="text-xl font-black text-slate-900">{selectedLead.givenName} {selectedLead.surname}</h2>
                <div className="flex gap-2 mt-2">
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">{selectedLead.category}</span>
                  {currentView === 'passed' && getSLA(selectedLead.updatedAt)}
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                <Icons.Cross />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              
              {/* Contact Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Contact Info</h3>
                <div className="space-y-3">
                  <p className="flex items-center gap-3 text-sm font-medium text-slate-700"><Icons.Phone /> <a href={`tel:${selectedLead.callingNumber}`} className="hover:text-indigo-600">{selectedLead.callingNumber}</a></p>
                  {selectedLead.whatsappNumber && <p className="flex items-center gap-3 text-sm font-medium text-emerald-600"><Icons.WhatsApp /> <a href={`https://wa.me/${selectedLead.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hover:underline">{selectedLead.whatsappNumber}</a></p>}
                </div>
              </div>

              {/* ⚡ THE QUICK SCHEDULE FORM (Only for Upcoming) */}
              {currentView === 'upcoming' && (
                <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm shadow-indigo-100/50">
                  <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2"><Icons.Calendar /> Quick Scheduler</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Schedule Test Date</label>
                      <input 
                        type="date" 
                        value={quickTestDate} 
                        onChange={(e) => setQuickTestDate(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">Sales / Instructor Remarks</label>
                      <textarea 
                        value={quickRemarks} 
                        onChange={(e) => setQuickRemarks(e.target.value)} 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                        placeholder="Add quick notes..."
                        rows={3}
                      ></textarea>
                    </div>
                    <button 
                      onClick={handleQuickSave} 
                      disabled={isSaving} 
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSaving ? <><Icons.Loading /> Saving...</> : <><Icons.Save /> Save Updates</>}
                    </button>
                  </div>
                </div>
              )}

              {/* Exam Results Card (Only for Passed/Failed) */}
              {currentView !== 'upcoming' && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Latest Exam Scores</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">English</p>
                      <p className="text-2xl font-black text-slate-800">{selectedLead.englishScore || "-"}<span className="text-xs text-slate-400">/10</span></p>
                      {renderProgressBar(selectedLead.englishScore, selectedLead.englishTestResult)}
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Yard</p>
                      <p className="text-2xl font-black text-slate-800">{selectedLead.drivingScore || "-"}<span className="text-xs text-slate-400">/10</span></p>
                      {renderProgressBar(selectedLead.drivingScore, selectedLead.yardTestResult)}
                    </div>
                  </div>
                  {selectedLead.examinerRemarks && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1">Examiner Note</p>
                      <p className="text-xs text-amber-900 font-medium italic">{selectedLead.examinerRemarks}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sales Notes Display (Read-Only) */}
              {currentView !== 'upcoming' && (
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Sales Remarks</h3>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedLead.salesRemarks || "No remarks saved."}</p>
                </div>
              )}

            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-3">
              {currentView !== 'upcoming' && (
                <Link 
                  href={`/sales/${selectedLead.id}?tab=${currentView === 'passed' ? 'sa' : 'testing'}`} 
                  className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${currentView === 'passed' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'}`}
                >
                  Proceed to {currentView === 'passed' ? 'Agreement Payment' : 'Log Re-Test Fee'} <Icons.ChevronRight />
                </Link>
              )}
              
              {/* Only show "Open Full Profile" if we are NOT in the Passed tab */}
              {currentView !== 'passed' && (
                <Link 
                  href={`/sales/${selectedLead.id}?tab=testing`} 
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Icons.UserIcon /> Open Full Profile
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🚀 ENTERPRISE HEADER */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
            <Icons.Target />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Exam Command Center</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Manage test rosters, record re-test fees, and collect Service Agreement payments.
            </p>
          </div>
        </div>
      </div>

      {/* 🔘 SEGMENTED CONTROL TABS */}
      <div className="bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/60 inline-flex flex-wrap gap-1 shadow-inner">
        <button onClick={() => { setCurrentView('passed'); setSearchQuery(""); setCategoryFilter(""); }} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2.5 ${currentView === 'passed' ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/50 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}>
          <Icons.CheckCircle /> Passed (Ready for Payment)
          <span className={`px-2 py-0.5 rounded-md text-[10px] ml-1 ${currentView === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>{passedLeads.length}</span>
        </button>
        <button onClick={() => { setCurrentView('failed'); setSearchQuery(""); setCategoryFilter(""); }} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2.5 ${currentView === 'failed' ? 'bg-white text-rose-700 shadow-sm border border-slate-200/50 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}>
          <Icons.XCircle /> Failed (Re-Test Required)
          <span className={`px-2 py-0.5 rounded-md text-[10px] ml-1 ${currentView === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-600'}`}>{failedLeads.length}</span>
        </button>
        <button onClick={() => { setCurrentView('upcoming'); setSearchQuery(""); setCategoryFilter(""); }} className={`px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2.5 ${currentView === 'upcoming' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50 ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}>
          <Icons.Calendar /> Upcoming & Pending
          <span className={`px-2 py-0.5 rounded-md text-[10px] ml-1 ${currentView === 'upcoming' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'}`}>{upcomingLeads.length}</span>
        </button>
      </div>

      {/* 🔍 ADVANCED SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-lg transition-all">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icons.Search />
          </div>
          <input 
            type="text" 
            placeholder="Search by name, phone, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:bg-white transition-colors"
          />
        </div>
        <div className="w-full md:w-64 flex items-center gap-2">
          <div className="text-slate-400"><Icons.Filter /></div>
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(cat => <option key={cat as string} value={cat as string}>{cat as string}</option>)}
          </select>
        </div>
      </div>

      {/* 📄 DYNAMIC DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in duration-300">
        <div className={`p-5 border-b border-slate-100 flex justify-between items-center ${currentView === 'passed' ? 'bg-emerald-50/50' : currentView === 'failed' ? 'bg-rose-50/50' : 'bg-indigo-50/50'}`}>
          <h2 className={`font-bold flex items-center gap-2.5 ${currentView === 'passed' ? 'text-emerald-900' : currentView === 'failed' ? 'text-rose-900' : 'text-indigo-900'}`}>
            {currentView === 'passed' ? <><Icons.Wallet /> Collect Service Agreement Payments</> : 
             currentView === 'failed' ? <><Icons.Refresh /> Log Re-Test Fees</> : 
             <><Icons.Calendar /> Test Roster</>}
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Candidate Details</th>
                
                {/* Clickable Sort Headers */}
                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('testDate')}>
                  {currentView === 'upcoming' ? 'Scheduled Date' : 'Test Date'} <SortIcon columnKey="testDate" />
                </th>
                
                {currentView !== 'upcoming' && (
                  <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort('englishScore')}>
                    Exam Scores <SortIcon columnKey="englishScore" />
                  </th>
                )}
                
                {currentView === 'upcoming' && <th className="p-4">Category</th>}
                <th className="p-4 pr-6 text-right">Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Icons.EmptyState />
                      <p className="text-slate-500 font-semibold text-sm">No candidates match this criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedLeads.map((lead) => {
                  const isToday = currentView === 'upcoming' && lead.testDate && new Date(lead.testDate).toDateString() === today.toDateString();
                  const isPast = currentView === 'upcoming' && lead.testDate && new Date(lead.testDate) < today;

                  return (
                    <tr 
                      key={lead.id} 
                      onClick={() => {
                        setSelectedLead(lead);
                        setQuickTestDate(formatDateForInput(lead.testDate));
                        setQuickRemarks(lead.salesRemarks || "");
                      }}
                      className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    >
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm shrink-0 border ${currentView === 'passed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : currentView === 'failed' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                            {getInitials(lead.givenName || "", lead.surname || "")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              {lead.givenName} {lead.surname}
                              {currentView === 'passed' && getSLA(lead.updatedAt)}
                            </p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">{lead.callingNumber}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                          isToday ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' : 
                          isPast ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          <Icons.Calendar />
                          {isToday ? "TODAY" : isPast ? `Pending Grade (${new Date(lead.testDate!).toLocaleDateString("en-GB")})` : (lead.testDate ? new Date(lead.testDate).toLocaleDateString("en-GB") : "N/A")}
                        </span>
                      </td>

                      {currentView !== 'upcoming' && (
                        <td className="p-4">
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 border rounded text-[10px] font-bold tracking-wider ${currentView === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              ENG: {lead.englishScore}/10
                            </span>
                            <span className={`px-2 py-1 border rounded text-[10px] font-bold tracking-wider ${currentView === 'passed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                              YRD: {lead.drivingScore}/10
                            </span>
                          </div>
                        </td>
                      )}

                      {currentView === 'upcoming' && (
                        <td className="p-4">
                          <span className="inline-flex px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider border border-slate-200 uppercase">
                            {lead.category}
                          </span>
                        </td>
                      )}

                      <td className="p-4 pr-6 text-right">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-300 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 text-xs font-bold rounded-lg shadow-sm transition-all group-hover:shadow-md">
                          Quick Peek <Icons.ChevronRight />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}