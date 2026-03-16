// src/app/(dashboard)/sales/exams/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SalesExamCenter({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const currentView = resolvedSearchParams.view || "passed";

  // 🛡️ SECURITY: Branch Isolation
  const branchFilter = session.user.branch === "MASTER" ? {} : { branch: session.user.branch as any };

  // Fetch all leads currently in Stage 1 that are dealing with exams
  const activeExamLeads = await prisma.lead.findMany({
    where: {
      caseStatus: "Stage 1 Under Process",
      ...branchFilter
    },
    orderBy: { testDate: "asc" }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 🗂️ SPLIT THE DATA INTO OUR THREE CATEGORIES
  const passedLeads = activeExamLeads.filter(lead => lead.examinerStatus === "Approved");
  const failedLeads = activeExamLeads.filter(lead => lead.examinerStatus === "Rejected");
  
  // "Upcoming" includes anyone who hasn't been graded yet (Future scheduled + Missed/Pending)
const upcomingLeads = activeExamLeads.filter(lead => 
    lead.testDate !== null && 
    (!lead.examinerStatus || lead.examinerStatus === "Pending")
  );
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">🎯 Exam Command Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage test rosters, record re-test fees, and collect Service Agreement payments.
        </p>
      </div>

      {/* 🔘 TAB NAVIGATION BUTTONS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2">
        <Link 
          href="?view=passed" 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentView === 'passed' 
              ? 'border-emerald-600 text-emerald-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ✅ Passed (Ready for Payment)
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            currentView === 'passed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {passedLeads.length}
          </span>
        </Link>
        
        <Link 
          href="?view=failed" 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentView === 'failed' 
              ? 'border-red-600 text-red-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ❌ Failed (Re-Test Required)
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            currentView === 'failed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {failedLeads.length}
          </span>
        </Link>

        <Link 
          href="?view=upcoming" 
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            currentView === 'upcoming' 
              ? 'border-blue-600 text-blue-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📅 Upcoming & Pending
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            currentView === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {upcomingLeads.length}
          </span>
        </Link>
      </div>

      {/* 📄 DYNAMIC CONTENT AREA */}
      <div className="mt-4">
        
        {/* ============================================== */}
        {/* ✅ TAB 1: PASSED (COLLECT SERVICE AGREEMENT)   */}
        {/* ============================================== */}
        {currentView === "passed" && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-emerald-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex justify-between items-center">
              <h2 className="font-bold text-emerald-900 flex items-center gap-2">
                💰 Collect Service Agreement Payments
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-white">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Test Date</th>
                    <th className="p-4 font-semibold">Scores</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {passedLeads.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No passed candidates waiting for payment collection.</td></tr>
                  ) : (
                    passedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-emerald-50/30 transition-colors bg-white">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{lead.callingNumber}</p>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600">
                          {lead.testDate ? new Date(lead.testDate).toLocaleDateString("en-GB") : "N/A"}
                        </td>
                        <td className="p-4">
                          <p className="text-[11px] font-bold text-emerald-700">ENG: {lead.englishScore}/10 | YARD: {lead.drivingScore}/10</p>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/sales/${lead.id}`} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                            Collect Fee & Transfer ➔
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

        {/* ============================================== */}
        {/* ❌ TAB 2: FAILED (COLLECT RE-TEST FEE)         */}
        {/* ============================================== */}
        {currentView === "failed" && (
          <div className="bg-white rounded-xl shadow-sm border-2 border-red-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
              <h2 className="font-bold text-red-900 flex items-center gap-2">
                🔄 Re-Test Fee Collection Required
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-white">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Failed Date</th>
                    <th className="p-4 font-semibold">Scores</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {failedLeads.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No candidates require re-test scheduling.</td></tr>
                  ) : (
                    failedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-red-50/30 transition-colors bg-white">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{lead.callingNumber}</p>
                        </td>
                        <td className="p-4 text-sm font-medium text-slate-600">
                          {lead.testDate ? new Date(lead.testDate).toLocaleDateString("en-GB") : "N/A"}
                        </td>
                        <td className="p-4">
                          <p className="text-[11px] font-bold text-red-600">ENG: {lead.englishScore}/10 | YARD: {lead.drivingScore}/10</p>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/sales/${lead.id}`} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm transition-colors">
                            Log Re-Test Fee ↺
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

        {/* ============================================== */}
        {/* 📅 TAB 3: UPCOMING & PENDING GRADES            */}
        {/* ============================================== */}
        {currentView === "upcoming" && (
          <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-700 flex items-center gap-2">
                📅 Upcoming Scheduled Tests
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-400 uppercase tracking-wider bg-white">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Category</th>
                    <th className="p-4 font-semibold">Phone</th>
                    <th className="p-4 font-semibold">Scheduled Date</th>
                    <th className="p-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {upcomingLeads.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">No upcoming tests currently scheduled.</td></tr>
                  ) : (
                    upcomingLeads.map((lead) => {
                      const isToday = lead.testDate && new Date(lead.testDate).toDateString() === today.toDateString();
                      const isPast = lead.testDate && new Date(lead.testDate) < today;

                      return (
                        <tr key={lead.id} className="hover:bg-slate-50 transition-colors bg-white">
                          <td className="p-4">
                            <p className="font-bold text-slate-600">{lead.givenName} {lead.surname}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-500 text-sm">{lead.category}</td>
                          <td className="p-4 font-medium text-slate-500 text-sm">{lead.callingNumber}</td>
                          <td className="p-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              isToday ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                              isPast ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {isToday ? "TODAY" : isPast ? `Pending Examiner (${new Date(lead.testDate!).toLocaleDateString("en-GB")})` : new Date(lead.testDate!).toLocaleDateString("en-GB")}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link href={`/sales/${lead.id}/edit`} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm transition-colors">
                              Manage Schedule
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
        )}

      </div>
    </div>
  );
}