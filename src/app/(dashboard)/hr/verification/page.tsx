// src/app/(dashboard)/hr/verification/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import LiveSearch from "@/components/LiveSearch";

export default async function HRVerificationQueue({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // Determine which tab is currently active and get search term
  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams.view || "action";
  const searchTerm = resolvedSearchParams.search || "";

  // 🛡️ SECURITY: Branch Isolation Filter
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
  
  // 🔍 BUILD SEARCH QUERY
  const searchQuery = searchTerm ? {
    OR: [
      { givenName: { contains: searchTerm, mode: "insensitive" as const } },
      { surname: { contains: searchTerm, mode: "insensitive" as const } },
      { id: { contains: searchTerm, mode: "insensitive" as const } },
      { passportNum: { contains: searchTerm, mode: "insensitive" as const } },
    ]
  } : {};

  // Fetch the entire queue WITH the search query applied
  const fullQueue = await prisma.lead.findMany({
    where: { 
      caseStatus: { in: parallelStage2Statuses },
      ...branchFilter,
      ...searchQuery
    },
    orderBy: { updatedAt: "desc" }
  });

  // SPLIT THE QUEUE INTO TWO CATEGORIES
  const waitingOnOpsQueue = fullQueue.filter(lead => waitingOnOpsStatuses.includes(lead.caseStatus));
  const hrActionQueue = fullQueue.filter(lead => !waitingOnOpsStatuses.includes(lead.caseStatus));

  // Helper for tab URLs to preserve search state
  const searchParamString = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Verification Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your active files. 
            <span className="font-bold text-blue-600 ml-1">
              ({session.user.branch === "MASTER" ? "All Branches" : session.user.branch.replace("_", " ")})
            </span>
          </p>
        </div>
        
        {/* UNIVERSAL SEARCH COMPONENT */}
        <LiveSearch placeholder="Search candidate name, ID..." />
      </div>

      {/* 🔘 TAB NAVIGATION BUTTONS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2">
        <Link 
          href={`?view=action${searchParamString}`} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentView === 'action' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚡ HR Action Required
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            currentView === 'action' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {hrActionQueue.length}
          </span>
        </Link>
        
        <Link 
          href={`?view=waiting${searchParamString}`} 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentView === 'waiting' 
              ? 'border-slate-800 text-slate-800' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏳ Waiting on Operations
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            currentView === 'waiting' ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500'
          }`}>
            {waitingOnOpsQueue.length}
          </span>
        </Link>
      </div>

      {/* 📄 DYNAMIC CONTENT AREA */}
      <div className="mt-4">
        {currentView === "action" ? (

          /* ============================================== */
          /* 🔴 SECTION 1: HR ACTION REQUIRED (TAB 1)       */
          /* ============================================== */
          <div className="space-y-6">
            
            {(() => {
              // 🧠 Filter for files where Next Follow-Up is Today or Earlier!
              const today = new Date();
              today.setHours(23, 59, 59, 999); // End of today
              
              const followUpsDue = hrActionQueue.filter(lead => 
                lead.hrNextFollowUpDate && new Date(lead.hrNextFollowUpDate) <= today
              );

              // Remove them from the standard queue so they don't show up twice
              const standardQueue = hrActionQueue.filter(lead => 
                !lead.hrNextFollowUpDate || new Date(lead.hrNextFollowUpDate) > today
              );

              return (
                <>
                  {/* ONLY SHOW THIS TABLE IF THERE ARE FOLLOW-UPS DUE */}
                  {followUpsDue.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border-2 border-orange-300 overflow-hidden animate-in fade-in duration-300">
                      <div className="p-4 bg-orange-50 border-b border-orange-200 flex justify-between items-center">
                        <h2 className="font-bold text-orange-900 flex items-center gap-2">
                          🔔 Action Required: Follow-Ups Due
                        </h2>
                        <span className="text-xs font-bold bg-orange-200 text-orange-800 px-3 py-1 rounded-full uppercase tracking-wider">
                          {followUpsDue.length} Scheduled
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-orange-200 text-xs text-orange-700 uppercase tracking-wider bg-orange-50/50">
                              <th className="p-4 font-semibold">Candidate</th>
                              <th className="p-4 font-semibold">Current Case Status</th>
                              <th className="p-4 font-semibold">Follow-Up Date</th>
                              <th className="p-4 font-semibold text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-orange-100">
                            {followUpsDue.map((lead) => (
                              <tr key={lead.id} className="hover:bg-orange-50 transition-colors bg-white">
                                <td className="p-4">
                                  <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">ID: {lead.id.slice(-6).toUpperCase()}</p>
                                </td>
                                <td className="p-4">
                                  <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                                    {lead.caseStatus}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100 text-xs">
                                    {new Date(lead.hrNextFollowUpDate!).toLocaleDateString("en-GB")}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <Link 
                                    href={`/hr/${lead.id}?tab=details`}
                                    className="px-5 py-2 bg-orange-500 text-white hover:bg-orange-600 text-sm font-bold rounded-lg shadow-sm transition-colors inline-block"
                                  >
                                    Execute Follow-Up
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
          
                  {/* STANDARD HR ACTION REQUIRED */}
                  <div className="bg-white rounded-xl shadow-sm border-2 border-blue-200 overflow-hidden animate-in fade-in duration-300">
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                      <h2 className="font-bold text-blue-900 flex items-center gap-2">
                        ⚡ Priority Processing Queue
                      </h2>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-white">
                            <th className="p-4 font-semibold">Candidate</th>
                            <th className="p-4 font-semibold">Category</th>
                            {session.user.branch === "MASTER" && <th className="p-4 font-semibold">Branch</th>}
                            <th className="p-4 font-semibold">Current Case Status</th>
                            <th className="p-4 font-semibold">Last Updated</th>
                            <th className="p-4 font-semibold text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {standardQueue.length === 0 ? (
                            <tr>
                              <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                  <span className="text-4xl mb-4">{searchTerm ? "🕵️‍♂️" : "🎉"}</span>
                                  <h3 className="text-slate-700 font-bold text-lg">
                                    {searchTerm ? "No matches found" : "You're all caught up!"}
                                  </h3>
                                  <p className="text-slate-500 mt-1">
                                    {searchTerm ? "Try searching by a different name or ID." : "No standard files currently require direct HR action."}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            standardQueue.map((lead) => (
                              <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors bg-white">
                                <td className="p-4">
                                  <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                                  <p className="text-xs text-slate-500 mt-0.5">ID: {lead.id.slice(-6).toUpperCase()}</p>
                                </td>
                                <td className="p-4 font-medium text-slate-600 text-sm">{lead.category}</td>
                                {session.user.branch === "MASTER" && (
                                  <td className="p-4">
                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-500">
                                      {lead.branch.replace("BRANCH_", "")}
                                    </span>
                                  </td>
                                )}
                                <td className="p-4">
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                                    lead.caseStatus.includes("Visa") ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                  }`}>
                                    {lead.caseStatus}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500 font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</td>
                                <td className="p-4 text-right">
                                  <Link 
                                    href={`/hr/${lead.id}?tab=details`}
                                    className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold rounded-lg shadow-sm transition-colors inline-block"
                                  >
                                    Verify & Process
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

          /* ============================================== */
          /* ⏳ SECTION 2: WAITING ON OPERATIONS (TAB 2)    */
          /* ============================================== */
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                ⏳ Delegated to Operations
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wider bg-white">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Category</th>
                    {session.user.branch === "MASTER" && <th className="p-4 font-semibold">Branch</th>}
                    <th className="p-4 font-semibold">Pending Ops Task</th>
                    <th className="p-4 font-semibold">Delegated On</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {waitingOnOpsQueue.length === 0 ? (
                    <tr>
                      <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-4xl mb-4">{searchTerm ? "🕵️‍♂️" : "🎉"}</span>
                          <h3 className="text-slate-700 font-bold text-lg">
                            {searchTerm ? "No matches found" : "Operations is all caught up!"}
                          </h3>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    waitingOnOpsQueue.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors bg-white">
                        <td className="p-4">
                          <p className="font-bold text-slate-600">{lead.givenName} {lead.surname}</p>
                          <p className="text-xs text-slate-400 mt-0.5">ID: {lead.id.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="p-4 font-medium text-slate-500 text-sm">{lead.category}</td>
                        {session.user.branch === "MASTER" && (
                          <td className="p-4">
                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 border border-slate-200 rounded text-slate-400">
                              {lead.branch.replace("BRANCH_", "")}
                            </span>
                          </td>
                        )}
                        <td className="p-4">
                          <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {lead.caseStatus}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-400 font-medium">{new Date(lead.updatedAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <Link 
                            href={`/hr/${lead.id}?tab=details`}
                            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-emerald-600 text-sm font-bold rounded-lg transition-colors inline-block"
                          >
                            Monitor File
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