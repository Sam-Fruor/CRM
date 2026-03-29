// src/app/(dashboard)/sales/missing-docs/MissingDocsClient.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DocumentVault from "@/components/DocumentVault";
import toast, { Toaster } from "react-hot-toast";

// --- ENTERPRISE ICONS ---
const Icons = {
  FolderOpen: () => <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>,
  AlertCircle: () => <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  WhatsApp: () => <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.016-.967-.259-.099-.447-.149-.635.149-.188.297-.755.967-.924 1.166-.17.198-.34.223-.637.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.652-2.059-.17-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.635-1.534-.87-2.1-.228-.548-.46-.474-.635-.482-.17-.008-.364-.009-.563-.009-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Clock: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  UserIcon: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Cross: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

// --- HELPERS ---
const getInitials = (first: string, last: string) => {
  return `${(first?.[0] || "").toUpperCase()}${(last?.[0] || "").toUpperCase()}`;
};

const getStagnationDays = (updatedAt: Date) => {
  const diffTime = Math.abs(new Date().getTime() - new Date(updatedAt).getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export default function MissingDocsClient({ initialLeads }: { initialLeads: any[] }) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);

  // 🔍 INSTANT SEARCH ENGINE
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return initialLeads;
    const q = searchQuery.toLowerCase();
    return initialLeads.filter(l => 
      (l.givenName?.toLowerCase() || "").includes(q) ||
      (l.surname?.toLowerCase() || "").includes(q) ||
      (l.callingNumber || "").includes(q) ||
      (l.id || "").toLowerCase().includes(q)
    );
  }, [searchQuery, initialLeads]);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 pt-4 relative">
      <Toaster position="bottom-right" />

      {/* 🚀 THE QUICK UPLOAD MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-slate-900 font-black text-lg flex items-center gap-2">
                  <Icons.FolderOpen /> Document Vault
                </h2>
                <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-wider">
                  Client: {selectedLead.givenName} {selectedLead.surname}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedLead(null)} 
                className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm"
              >
                <Icons.Cross />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar">
              {/* Tells the agent exactly what is missing right inside the vault */}
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl">
                <p className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2">Currently Missing:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedLead.missingList?.map((doc: string) => (
                    <span key={doc} className="bg-white border border-rose-200 text-rose-700 px-2 py-1 rounded shadow-sm text-[10px] font-black tracking-wider uppercase">
                      {doc}
                    </span>
                  ))}
                </div>
              </div>

              <DocumentVault 
                leadId={selectedLead.id} 
                existingDocs={selectedLead.documentFiles} 
                defaultCategory="Client" 
                defaultType="" 
                onUploadSuccess={() => { 
                  toast.success("Document uploaded successfully!");
                  setSelectedLead(null); 
                  router.refresh(); 
                }} 
              />
            </div>
          </div>
        </div>
      )}
      
      {/* 🚀 ENTERPRISE HEADER */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
            <Icons.FolderOpen />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Missing Documents Queue</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Active clients pending required paperwork to proceed.
            </p>
          </div>
        </div>
        
        {/* KPI WIDGET */}
        <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-xl shadow-inner flex items-center gap-3 shrink-0">
          <Icons.AlertCircle />
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Action Items</p>
            <p className="text-xl font-black text-rose-900 leading-none">{filteredLeads.length}</p>
          </div>
        </div>
      </div>

      {/* 🔍 INSTANT SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center">
        <div className="relative w-full focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-lg transition-all">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icons.Search />
          </div>
          <input 
            type="text" 
            placeholder="Search candidates by name, phone, or ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 outline-none focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* 📄 DYNAMIC DATA TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in duration-300">
        <div className="p-5 bg-slate-50/80 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2.5">
            📋 Document Chase List
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Client Details</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Stagnation</th>
                <th className="p-4">Currently Missing</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm text-2xl">
                        🎉
                      </div>
                      <h3 className="text-slate-800 font-bold text-lg">All Caught Up!</h3>
                      <p className="text-slate-500 font-medium mt-1 text-sm">No clients are currently missing documents based on your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const daysWaiting = getStagnationDays(lead.updatedAt);
                  
                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shadow-sm shrink-0 border border-slate-200">
                            {getInitials(lead.givenName || "", lead.surname || "")}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              {lead.givenName} {lead.surname}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                              ID: {lead.id.slice(-6)}
                            </p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
                            <Icons.Phone /> {lead.callingNumber}
                          </p>
                          {lead.whatsappNumber && (
                            <p className="flex items-center gap-2 text-xs font-medium text-emerald-600">
                              <Icons.WhatsApp /> {lead.whatsappNumber}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${
                          daysWaiting > 5 ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                          daysWaiting > 2 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          <Icons.Clock /> Waiting {daysWaiting} Days
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                          {lead.missingList?.map((doc: string) => (
                            <span key={doc} className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase shadow-sm">
                              {doc}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          {/* Open Full Profile Button */}
                          <Link 
                            href={`/sales/${lead.id}?tab=documents`}
                            title="Open Full Profile"
                            className="inline-flex items-center justify-center w-9 h-9 bg-white border border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 rounded-lg transition-all shadow-sm"
                          >
                            <Icons.UserIcon />
                          </Link>
                          
                          {/* Quick Upload Button */}
                          <button 
                            onClick={() => setSelectedLead(lead)}
                            className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md shadow-indigo-600/20 transition-all active:scale-95"
                          >
                            <Icons.Upload /> Quick Upload
                          </button>
                        </div>
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