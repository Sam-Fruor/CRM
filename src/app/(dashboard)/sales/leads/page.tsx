// src/app/(dashboard)/sales/leads/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LiveSearch from "./LiveSearch";
import Link from "next/link";

// 🎨 ENTERPRISE ICONS
const Icons = {
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  SortAsc: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>,
  SortDesc: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>,
  User: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Mail: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  Globe: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  Message: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  ArrowRight: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
};

export default async function LeadsWorkspacePage({ 
  searchParams 
}: { 
  searchParams: Promise<{ filter?: string, search?: string, sort?: string }> 
}) {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentFilter = resolvedParams.filter || "active";
  const searchQuery = resolvedParams.search || "";
  const sortOrder = resolvedParams.sort === "asc" ? "asc" : "desc"; // Default to newest first

  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };
  
  // 🚀 Fetch with dynamic sorting applied directly to DB
  const allLeads = await prisma.lead.findMany({
    where: branchCondition,
    orderBy: { updatedAt: sortOrder },
  });

  let displayLeads = allLeads;
  
  // 1. Apply Tab Filters
  if (currentFilter === "active") {
    displayLeads = allLeads.filter(l => l.caseStatus === "Stage 1 Under Process" && !["Not Interested", "Not Eligible", "Converted"].includes(l.feedbackStatus || ""));
  } else if (currentFilter === "converted") {
    displayLeads = allLeads.filter(l => l.caseStatus === "Stage 1 Under Process" && l.feedbackStatus === "Converted");
  } else if (currentFilter === "rejected") {
    displayLeads = allLeads.filter(l => l.caseStatus === "Stage 1 Under Process" && ["Not Interested", "Not Eligible"].includes(l.feedbackStatus || ""));
  } else if (currentFilter === "archive") {
    displayLeads = allLeads.filter(l => l.caseStatus !== "Stage 1 Under Process");
  }

  // 2. Apply Search Filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayLeads = displayLeads.filter(l => 
      (l.givenName || "").toLowerCase().includes(q) || 
      (l.surname || "").toLowerCase().includes(q) || 
      (l.callingNumber || "").includes(q) || 
      (l.email || "").toLowerCase().includes(q) ||
      (l.id || "").toLowerCase().includes(q) // 👈 Supports partial ID search
    );
  }

  const toggleSortOrder = sortOrder === "desc" ? "asc" : "desc";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 relative">
      
      {/* 🚀 HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Leads</h1>
          <p className="text-slate-500 font-medium mt-1">Manage, search, and update all client files.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          {/* 🔍 THE LIVE SEARCH BAR */}
          <div className="flex-grow md:flex-none">
            <LiveSearch currentFilter={currentFilter} initialSearch={searchQuery} />
          </div>

          {/* 🔄 SORT TOGGLE BUTTON */}
          <Link 
            href={`?filter=${currentFilter}&search=${searchQuery}&sort=${toggleSortOrder}`} 
            className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm"
            title={`Currently sorting ${sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}`}
          >
            {sortOrder === "desc" ? <><Icons.SortDesc /> Newest</> : <><Icons.SortAsc /> Oldest</>}
          </Link>

          <Link 
            href="/sales/form" 
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-black transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 whitespace-nowrap"
          >
            <Icons.Plus /> Add New Lead
          </Link>
        </div>
      </div>

      {/* 📑 ENTERPRISE SEGMENTED FILTER TABS */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto custom-scrollbar pb-1">
        <Link 
          href={`?filter=active&search=${searchQuery}&sort=${sortOrder}`} 
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'active' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Active Leads
        </Link>
        <Link 
          href={`?filter=converted&search=${searchQuery}&sort=${sortOrder}`} 
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'converted' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Converted (Booked)
        </Link>
        <Link 
          href={`?filter=rejected&search=${searchQuery}&sort=${sortOrder}`} 
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'rejected' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Rejected / Not Eligible
        </Link>
        <Link 
          href={`?filter=archive&search=${searchQuery}&sort=${sortOrder}`} 
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'archive' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Archive (Transferred)
        </Link>
        <Link 
          href={`?filter=all&search=${searchQuery}&sort=${sortOrder}`} 
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'all' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          All Leads
        </Link>
      </div>

      {/* 📊 ENTERPRISE LEADS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-widest font-black">
                <th className="py-4 px-5 w-1/4">Candidate Identity</th>
                <th className="py-4 px-5">Contact & Source</th>
                <th className="py-4 px-5">Current Status</th>
                <th className="py-4 px-5 w-1/4">Latest Remarks</th>
                <th className="py-4 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayLeads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.Search />
                      <p className="mt-3 text-sm font-bold text-slate-600">No leads found in this view.</p>
                      <p className="text-xs font-medium mt-1">Try clearing your search or switching tabs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayLeads.map((lead) => {
                  const latestRemark = lead.followUpRemarks || lead.salesRemarks || "No recent remarks.";
                  const isConverted = lead.feedbackStatus === "Converted";
                  const isRejected = ["Not Interested", "Not Eligible"].includes(lead.feedbackStatus || "");

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
                      
                      {/* 1. Candidate Identity (ID, Name, Email) */}
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 tracking-widest">
                            {lead.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                        <p className="font-black text-slate-900 text-sm tracking-tight">{lead.givenName} {lead.surname}</p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                          <Icons.Mail /> {lead.email || "No Email"}
                        </div>
                      </td>

                      {/* 2. Contact & Source */}
                      <td className="p-5 align-middle">
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><Icons.Phone /> {lead.callingNumber}</p>
                          <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-2 uppercase tracking-wide"><Icons.Globe /> {lead.leadSource || "Unknown Source"}</p>
                        </div>
                      </td>

                      {/* 3. Current Status */}
                      <td className="p-5 align-middle">
                        <div className="flex flex-col gap-2 items-start">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md border shadow-sm ${
                            isConverted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            isRejected ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            {lead.feedbackStatus || 'Pending Status'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">{lead.caseStatus}</span>
                        </div>
                      </td>

                      {/* 4. Latest Remarks */}
                      <td className="p-5 align-middle max-w-[200px]">
                        <div className="flex items-start gap-2 text-slate-600">
                          <div className="mt-0.5"><Icons.Message /></div>
                          <p className="text-xs font-medium truncate w-full" title={latestRemark}>
                            {latestRemark}
                          </p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 ml-5">
                          Updated: {new Date(lead.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* 5. Action */}
                      <td className="p-5 text-right align-middle">
                        <Link 
                          href={`/sales/${lead.id}`} 
                          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-white font-bold text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-600 hover:border-indigo-600 px-4 py-2.5 rounded-lg transition-all shadow-sm group-hover:shadow-md"
                        >
                          View Profile <Icons.ArrowRight />
                        </Link>
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