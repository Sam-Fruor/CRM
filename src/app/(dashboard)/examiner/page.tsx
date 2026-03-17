// src/app/(dashboard)/examiner/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ExaminerDashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["EXAMINER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "pending";

  // 1. Fetch ALL Pending Leads
  const pendingLeads = await prisma.lead.findMany({
    where: { 
      // ✅ FIX: Explicitly include nulls (new clients) AND rejected (re-test clients)
      OR: [
        { examinerStatus: null },
        { examinerStatus: "" },
        { examinerStatus: "Pending" },
        { examinerStatus: "Rejected" },
        { examinerStatus: "Denied" }
      ]
    },
    include: { testEvaluations: true }
  });

  // 2. Fetch HISTORY (Every test ever submitted)
  const historyLogs = await prisma.testEvaluation.findMany({
    include: { lead: true }, 
    orderBy: { createdAt: "desc" }
  });

  // 3. ENHANCE LEADS WITH ACTIVE TEST DATA
  const processedLeads = pendingLeads.map(lead => {
    const evalsCount = lead.testEvaluations?.length || 0;
    let activeDate = null;
    let attemptName = "Initial Test";

    // Safely parse the dynamic JSON ledger
    let customPayments: any[] = [];
    try {
      if (lead.otherPayments) {
        customPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse(lead.otherPayments as string);
      }
    } catch (e) {
      console.error("Failed to parse otherPayments for lead", lead.id);
    }

    if (evalsCount === 0) {
      attemptName = "Initial Test";
      activeDate = lead.testDate;
      // Check if there is an active Reschedule overriding the Initial Test
      const reschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === 1 && p.testDate);
      if (reschedules.length > 0) {
        activeDate = reschedules[reschedules.length - 1].testDate;
        attemptName = "Initial Test (Rescheduled)";
      }
    } else if (evalsCount === 1) {
      attemptName = "Re-Test (Attempt 2)";
      activeDate = lead.reTestDate;
      // Check if there is an active Reschedule overriding Attempt 2
      const reschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === 2 && p.testDate);
      if (reschedules.length > 0) {
        activeDate = reschedules[reschedules.length - 1].testDate;
        attemptName = "Re-Test (Attempt 2 - Rescheduled)";
      }
    } else {
      const attemptNum = evalsCount + 1;
      attemptName = `Re-Test (Attempt ${attemptNum})`;
      // Find the Attempt 3+ row
      const retestRow = customPayments.find(p => p.isAutoRetest && p.attempt === attemptNum);
      if (retestRow && retestRow.testDate) activeDate = retestRow.testDate;

      // Check if there is an active Reschedule overriding Attempt 3+
      const reschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === attemptNum && p.testDate);
      if (reschedules.length > 0) {
        activeDate = reschedules[reschedules.length - 1].testDate;
        attemptName = `Re-Test (Attempt ${attemptNum} - Rescheduled)`;
      }
    }

    return {
      ...lead,
      activeTestDate: activeDate,
      activeAttemptName: attemptName
    };
  });

  // ⏱️ DATE MATH: Split Processed Leads into "Today" and "Upcoming"
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Filter out people with NO active date, then sort
  const scheduledLeads = processedLeads.filter(l => l.activeTestDate).sort((a, b) => new Date(a.activeTestDate as string).getTime() - new Date(b.activeTestDate as string).getTime());

  // "Today's Roster" includes tests scheduled for today, AND any tests from yesterday that were missed
  const todaysRoster = scheduledLeads.filter(l => new Date(l.activeTestDate as string) <= endOfToday);
  
  // "Upcoming" includes tests in the future
  const upcomingRoster = scheduledLeads.filter(l => new Date(l.activeTestDate as string) > endOfToday);

  // A reusable component for the tables so we don't write the exact same code twice!
  const RosterTable = ({ leads, emptyMessage }: { leads: any[], emptyMessage: string }) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
            <th className="p-4">Candidate Details</th>
            <th className="p-4">Test Date & Attempt</th>
            <th className="p-4">Category</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-medium">{emptyMessage}</td></tr>
          ) : (
            leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                  <p className="text-xs text-slate-500">ID: {lead.id.slice(-6).toUpperCase()} | {lead.nationality}</p>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                    new Date(lead.activeTestDate) <= endOfToday 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {new Date(lead.activeTestDate).toLocaleDateString()}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1.5 font-bold uppercase">{lead.activeAttemptName}</p>
                </td>
                <td className="p-4 font-medium text-slate-700">{lead.category}</td>
                <td className="p-4 text-right">
                  <Link 
                    href={`/examiner/${lead.id}`} 
                    className="text-purple-600 hover:text-purple-800 font-bold text-sm bg-purple-50 px-4 py-2 rounded-lg transition-colors border border-purple-100"
                  >
                    Evaluate
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Examiner Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Evaluate candidates and review your past testing history.</p>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-slate-200">
        <Link 
          href="?tab=pending" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'pending' 
              ? 'border-purple-600 text-purple-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Pending Queue ({todaysRoster.length + upcomingRoster.length})
        </Link>
        <Link 
          href="?tab=history" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'history' 
              ? 'border-slate-800 text-slate-800' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          Evaluation History
        </Link>
      </div>

      {/* CONTENT: PENDING QUEUE */}
      {activeTab === "pending" && (
        <div className="space-y-8">
          
          {/* 🔥 TODAY's ROSTER */}
          <div>
            <h2 className="text-lg font-bold text-amber-600 flex items-center gap-2 mb-4">
              🔥 Today's Roster & Action Required
            </h2>
            <RosterTable 
              leads={todaysRoster} 
              emptyMessage="No candidates are scheduled for testing today." 
            />
          </div>

          {/* 📅 UPCOMING TESTS */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              📅 Upcoming Candidates
            </h2>
            <RosterTable 
              leads={upcomingRoster} 
              emptyMessage="No upcoming candidates in the queue." 
            />
          </div>

        </div>
      )}

      {/* CONTENT: EVALUATION HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white text-xs uppercase tracking-wider font-bold">
                <th className="p-4">Date</th>
                <th className="p-4">Candidate</th>
                <th className="p-4">English Score</th>
                <th className="p-4">Driving Score</th>
                <th className="p-4">Final Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyLogs.length === 0 ? (
                <tr><td colSpan={5} className="p-12 text-center text-slate-500 font-medium">No testing history found.</td></tr>
              ) : (
                historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-600">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{log.lead.givenName} {log.lead.surname}</p>
                      <Link href={`/examiner/${log.lead.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                        View Profile
                      </Link>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-bold">{log.englishScore || 0}/10</span>
                      <p className="text-xs text-slate-500">{log.englishTestResult}</p>
                    </td>
                    <td className="p-4 text-sm">
                      <span className="font-bold">{log.drivingScore || 0}/10</span>
                      <p className="text-xs text-slate-500">{log.yardTestResult}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        log.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}