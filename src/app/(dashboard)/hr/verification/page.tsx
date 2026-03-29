// src/app/(dashboard)/hr/verification/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import LiveSearch from "@/components/LiveSearch";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🎨 ENTERPRISE ICONS
const Icons = {
  Search: () => <svg className="w-10 h-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  ArrowRight: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Clock: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  CheckBadge: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

export default async function HRVerificationQueue({ searchParams }: { searchParams: Promise<{ view?: string; search?: string }>; }) {
  const session = await getServerSession(authOptions);

  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams.view || "action";
  const searchTerm = resolvedSearchParams.search || "";

  const branchFilter = session.user.branch === "MASTER" 
    ? {} 
    : { branch: session.user.branch as any };

  const parallelStage2Statuses = [
    "Stage 2 (Ops & HR)", "Stage 2 Under Process", "Stage 2: Ops - Welcome & Docs",
    "Stage 2: HR - Waiting for Job Offer", "Stage 2: Ops - Collect Job Offer Payment",
    "Stage 2: HR - Waiting for Work Permit", "Stage 2: Ops - Collect WP Payment",
    "Job Offer Letter Pending", "Signed Job Offer Letter Pending", "Pending Payment 1 (Service Agreement)",
    "Pending Payment 2 (Job Offer Letter)", "Work Permit Under Process", "Signed Work Permit Pending", 
    "Pending Payment 3 (Work Permit)", "Pending Payment 4 (Insurance)", "Visa Appointment Pending", 
    "Visa Status Under process", "School Fees Pending", "Flight Ticket Pending", "Visa Approved", "Visa Rejected"
  ];

  const waitingOnOpsStatuses = [
    "Stage 2: Ops - Welcome & Docs", 
    "Stage 2: Ops - Collect Job Offer Payment", 
    "Stage 2: Ops - Collect WP Payment",
    "Pending Payment 1 (Service Agreement)",
    "Pending Payment 2 (Job Offer Letter)",
    "Pending Payment 3 (Work Permit)",
    "Pending Payment 4 (Insurance)",
    "School Fees Pending",
    "Flight Ticket Pending"
  ];
  
  const searchQuery = searchTerm ? {
    OR: [
      { givenName: { contains: searchTerm, mode: "insensitive" as const } },
      { surname: { contains: searchTerm, mode: "insensitive" as const } },
      { id: { contains: searchTerm, mode: "insensitive" as const } },
      { passportNum: { contains: searchTerm, mode: "insensitive" as const } },
    ]
  } : {};

  const fullQueue = await prisma.lead.findMany({
    where: { 
      caseStatus: { in: parallelStage2Statuses },
      ...branchFilter,
      ...searchQuery
    },
    orderBy: { updatedAt: "desc" }
  });

  const waitingOnOpsQueue = fullQueue.filter(lead => waitingOnOpsStatuses.includes(lead.caseStatus));
  const hrActionQueue = fullQueue.filter(lead => !waitingOnOpsStatuses.includes(lead.caseStatus));

  const searchParamString = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 relative">
      
      {/* 🚀 HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HR Verification Queue</h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Manage your active files. 
            <span className="font-bold text-indigo-600 ml-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px] tracking-wider uppercase">
              {session.user.branch === "MASTER" ? "All Branches" : session.user.branch.replace("_", " ")}
            </span>
          </p>
        </div>
        
        <div className="shrink-0 w-full md:w-auto">
          <LiveSearch placeholder="Search name, ID..." />
        </div>
      </div>

      {/* 📑 ENTERPRISE SEGMENTED FILTER TABS */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <Link 
          href={`?view=action${searchParamString}`} 
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            currentView === 'action' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          ⚡ HR Action Required
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentView === 'action' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
            {hrActionQueue.length}
          </span>
        </Link>
        
        <Link 
          href={`?view=waiting${searchParamString}`} 
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            currentView === 'waiting' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          ⏳ Waiting on Operations
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${currentView === 'waiting' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'}`}>
            {waitingOnOpsQueue.length}
          </span>
        </Link>
      </div>

      {/* 📄 DYNAMIC CONTENT AREA */}
      <div className="mt-4">
        {currentView === "action" ? (

          /* 🔴 SECTION 1: HR ACTION REQUIRED */
          <div className="space-y-8">
            
            {(() => {
              const today = new Date();
              today.setHours(23, 59, 59, 999); 
              
              const followUpsDue = hrActionQueue.filter(lead => lead.hrNextFollowUpDate && new Date(lead.hrNextFollowUpDate) <= today);
              const standardQueue = hrActionQueue.filter(lead => !lead.hrNextFollowUpDate || new Date(lead.hrNextFollowUpDate) > today);

              return (
                <>
                  {followUpsDue.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-rose-200 overflow-hidden animate-in fade-in duration-300 relative">
                      <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                      <div className="p-4 bg-rose-50/50 border-b border-rose-100 flex justify-between items-center">
                        <h2 className="font-bold text-rose-900 flex items-center gap-2 text-sm"><Icons.Alert /> Action Required: Follow-Ups Due</h2>
                        <span className="text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 px-2 py-1 rounded shadow-sm uppercase tracking-wider">{followUpsDue.length} Scheduled</span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-rose-100 text-[10px] text-rose-700/70 uppercase tracking-widest font-bold bg-white">
                              <th className="p-4 w-1/3">Candidate</th>
                              <th className="p-4">Contact Info</th>
                              <th className="p-4">Current Status</th>
                              <th className="p-4 text-center">Urgency</th>
                              <th className="p-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-50">
                            {followUpsDue.map((lead) => {
                              const isOverdue = new Date(lead.hrNextFollowUpDate!) < new Date(new Date().setHours(0,0,0,0));
                              return (
                                <tr key={lead.id} className="hover:bg-rose-50/30 transition-colors bg-white group">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-rose-200">
                                        {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <p className="font-bold text-slate-900 text-sm tracking-tight">{lead.givenName} {lead.surname}</p>
                                        </div>
                                        <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
                                          {lead.id.slice(-6).toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">
                                    <div className="flex flex-col gap-1">
                                      <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Icons.Phone /> {lead.callingNumber}</p>
                                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{lead.category}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 align-middle">
                                    <span className="inline-flex items-center gap-1.5 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[10px]">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {lead.caseStatus}
                                    </span>
                                  </td>
                                  <td className="p-4 align-middle text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                                      isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                      <Icons.Clock /> {isOverdue ? 'Overdue' : 'Due Today'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right align-middle">
                                    <Link href={`/hr/${lead.id}?tab=hr`} className="inline-flex items-center gap-1 text-white hover:text-white font-semibold text-xs bg-rose-600 hover:bg-rose-700 border border-rose-700 px-3 py-1.5 rounded-md transition-all shadow-sm">
                                      Execute Follow-Up <Icons.ArrowRight />
                                    </Link>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
          
                  <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
                    <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
                      <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">⚡ Priority Processing Queue</h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            <th className="p-4 w-1/3">Candidate</th>
                            <th className="p-4">Contact Info</th>
                            {session.user.branch === "MASTER" && <th className="p-4">Branch</th>}
                            <th className="p-4">Current Status</th>
                            <th className="p-4">Last Updated</th>
                            <th className="p-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {standardQueue.length === 0 ? (
                            <tr>
                              <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                                <div className="flex flex-col items-center justify-center text-slate-400">
                                  <Icons.Search />
                                  <h3 className="text-slate-600 font-bold text-sm mt-3">{searchTerm ? "No matches found" : "You're all caught up!"}</h3>
                                  <p className="text-xs font-medium mt-1">{searchTerm ? "Try searching by a different name or ID." : "No standard files currently require direct HR action."}</p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            standardQueue.map((lead) => (
                              <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors bg-white group">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                                      {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <p className="font-bold text-slate-900 text-sm tracking-tight">{lead.givenName} {lead.surname}</p>
                                      </div>
                                      <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
                                        {lead.id.slice(-6).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 align-middle">
                                  <div className="flex flex-col gap-1">
                                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Icons.Phone /> {lead.callingNumber}</p>
                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{lead.category}</p>
                                  </div>
                                </td>
                                {session.user.branch === "MASTER" && (
                                  <td className="p-4 align-middle">
                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 tracking-wider">
                                      {lead.branch.replace("BRANCH_", "")}
                                    </span>
                                  </td>
                                )}
                                <td className="p-4 align-middle">
                                  <span className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border text-[10px] ${
                                    lead.caseStatus.includes("Visa") 
                                      ? "bg-purple-50 text-purple-700 border-purple-200" 
                                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${lead.caseStatus.includes("Visa") ? "bg-purple-500" : "bg-indigo-500"}`}></span> 
                                    {lead.caseStatus}
                                  </span>
                                </td>
                                <td className="p-4 align-middle text-xs text-slate-500 font-medium">
                                  {new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="p-4 text-right align-middle">
                                  <Link href={`/hr/${lead.id}?tab=hr`} className="inline-flex items-center gap-1 text-indigo-600 hover:text-white font-semibold text-xs bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 px-3 py-1.5 rounded-md transition-all shadow-sm">
                                    Verify & Process <Icons.ArrowRight />
                                  </Link>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

        ) : (

          /* ⏳ SECTION 2: WAITING ON OPERATIONS */
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm">⏳ Delegated to Operations</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <th className="p-4 w-1/3">Candidate</th>
                    <th className="p-4">Contact Info</th>
                    {session.user.branch === "MASTER" && <th className="p-4">Branch</th>}
                    <th className="p-4">Pending Ops Task</th>
                    <th className="p-4">Delegated On</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingOnOpsQueue.length === 0 ? (
                    <tr>
                      <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Icons.CheckBadge />
                          <h3 className="text-slate-600 font-bold text-sm mt-3">{searchTerm ? "No matches found" : "Operations is all caught up!"}</h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    waitingOnOpsQueue.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors bg-white group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                              {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <p className="font-bold text-slate-900 text-sm tracking-tight">{lead.givenName} {lead.surname}</p>
                              </div>
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200 tracking-wider">
                                {lead.id.slice(-6).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><Icons.Phone /> {lead.callingNumber}</p>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide truncate max-w-[150px]">{lead.category}</p>
                          </div>
                        </td>
                        {session.user.branch === "MASTER" && (
                          <td className="p-4 align-middle">
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 tracking-wider">
                              {lead.branch.replace("BRANCH_", "")}
                            </span>
                          </td>
                        )}
                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded border text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> {lead.caseStatus}
                          </span>
                        </td>
                        <td className="p-4 align-middle text-xs text-slate-500 font-medium">
                          {new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-4 text-right align-middle">
                          <Link href={`/hr/${lead.id}?tab=hr`} className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-700 font-semibold text-xs bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 px-3 py-1.5 rounded-md transition-all shadow-sm">
                            Monitor File <Icons.ArrowRight />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        )}
      </div>
    </div>
  );
}