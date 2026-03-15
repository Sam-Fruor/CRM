// src/app/(dashboard)/sales/leads/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import LiveSearch from "./LiveSearch";
import Link from "next/link";

export default async function LeadsWorkspacePage({ searchParams }: { searchParams: Promise<{ filter?: string, search?: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const currentFilter = resolvedParams.filter || "active";
  const searchQuery = resolvedParams.search || "";

  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };
  const allLeads = await prisma.lead.findMany({
    where: branchCondition,
    orderBy: { updatedAt: "desc" },
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
      (l.id || "").toLowerCase().includes(q) // 👈 Changed to includes() so partial IDs work!
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* HEADER & ADD BUTTON */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Leads Database</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and update all client files in Stage 1.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          {/* 🔍 THE LIVE SEARCH BAR */}
          <LiveSearch currentFilter={currentFilter} initialSearch={searchQuery} />

          <Link href="/sales/form" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm whitespace-nowrap">
            + Add New Lead
          </Link>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto">
        {/* ... (Keep your exact existing tab links here) ... */}
        <Link href={`?filter=active&search=${searchQuery}`} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Active Leads</Link>
        <Link href={`?filter=converted&search=${searchQuery}`} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'converted' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Converted (Booked)</Link>
        <Link href={`?filter=rejected&search=${searchQuery}`} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'rejected' ? 'border-red-600 text-red-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Rejected / Not Eligible</Link>
        <Link href={`?filter=archive&search=${searchQuery}`} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'archive' ? 'border-purple-600 text-purple-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Archive (Transferred)</Link>
        <Link href={`?filter=all&search=${searchQuery}`} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${currentFilter === 'all' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>All Leads</Link>
      </div>

      {/* LEADS TABLE */}
      {/* ... (Keep your exact existing table code here) ... */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* ... table headers ... */}
            <tbody className="divide-y divide-slate-100">
              {displayLeads.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500">No leads found.</td></tr>
              ) : (
                displayLeads.map((lead) => (
                  // ... your exact existing rows
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                      <p className="text-xs text-slate-500">ID: {lead.id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700">{lead.callingNumber}</p>
                      <p className="text-xs text-slate-500">{lead.nationality}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700`}>
                        {lead.feedbackStatus || 'Pending Update'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold text-slate-500">{lead.caseStatus}</span>
                    </td>
                    <td className="p-4 text-right">
                      <Link href={`/sales/${lead.id}`} className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-md">View Profile</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}