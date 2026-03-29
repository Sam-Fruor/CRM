// src/app/(dashboard)/examiner/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

// --- ENTERPRISE ICONS ---
const Icons = {
  BadgeCheck: () => <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  ClipboardList: () => <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 002-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Clock: () => <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Calendar: () => <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Users: () => <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
};

// --- HELPER FUNCTIONS FOR DATE BLOCKS ---
const getDayOfWeek = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", { weekday: 'short' });
};
const getDayNumber = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", { day: 'numeric' });
};
const getMonthStr = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", { month: 'short' });
};
// Forces a clean YYYY-MM-DD string avoiding timezone offset issues
const toLocalISODate = (d: Date | string) => {
  const date = new Date(d);
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
};

export default async function ExaminerDashboardPage({ searchParams }: { searchParams: Promise<{ tab?: string, date?: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["EXAMINER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await searchParams;
  const activeTab = resolvedParams.tab || "pending";
  const filterDateStr = resolvedParams.date; 

  // 1. Fetch ALL Pending Leads
  const pendingLeads = await prisma.lead.findMany({
    where: { 
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
      const reschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === 1 && p.testDate);
      if (reschedules.length > 0) {
        activeDate = reschedules[reschedules.length - 1].testDate;
        attemptName = "Initial Test (Rescheduled)";
      }
    } else if (evalsCount === 1) {
      attemptName = "Re-Test (Attempt 2)";
      activeDate = lead.reTestDate;
      const reschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === 2 && p.testDate);
      if (reschedules.length > 0) {
        activeDate = reschedules[reschedules.length - 1].testDate;
        attemptName = "Re-Test (Attempt 2 - Rescheduled)";
      }
    } else {
      const attemptNum = evalsCount + 1;
      attemptName = `Re-Test (Attempt ${attemptNum})`;
      const retestRow = customPayments.find(p => p.isAutoRetest && p.attempt === attemptNum);
      if (retestRow && retestRow.testDate) activeDate = retestRow.testDate;

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

  // ⏱️ BASE DATE MATH 
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const todayStr = toLocalISODate(now);

  // Filter out candidates with NO date, sort chronologically
  const scheduledLeads = processedLeads.filter(l => l.activeTestDate).sort((a, b) => new Date(a.activeTestDate as string).getTime() - new Date(b.activeTestDate as string).getTime());

  // ==========================================
  // 🧱 DATE BLOCK AGGREGATION LOGIC
  // ==========================================
  // Group scheduled leads by their exact date to build the UI blocks
  const dateGroups = scheduledLeads.reduce((acc, lead) => {
    const dateStr = toLocalISODate(lead.activeTestDate as string);
    if (!acc[dateStr]) acc[dateStr] = 0;
    acc[dateStr]++;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array, optionally filter out deep past, sort ascending, limit to next 14 active days
  const upcomingDateBlocks = Object.entries(dateGroups)
    // We optionally keep past dates here if you want examiners to see overdue files.
    // If you strictly want future/today only, uncomment the filter below:
    // .filter(item => new Date(item.date) >= new Date(todayStr)) 
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 14); // Keep UI clean by showing up to 14 active blocks


  // ==========================================
  // 📊 STAT METRICS
  // ==========================================
  const totalPendingTests = scheduledLeads.length;
  const testsTodayCount = scheduledLeads.filter(l => new Date(l.activeTestDate as string) <= endOfToday).length;
  const totalEvaluationsDone = historyLogs.length;


  // ==========================================
  // 🧮 APPLY SELECTED DATE FILTER TO ROSTER
  // ==========================================
  let displayRoster: any[] = [];
  let isFilteredView = !!filterDateStr;

  if (isFilteredView) {
    const targetStart = new Date(filterDateStr!);
    targetStart.setHours(0,0,0,0);
    const targetEnd = new Date(filterDateStr!);
    targetEnd.setHours(23,59,59,999);

    displayRoster = scheduledLeads.filter(l => {
      const d = new Date(l.activeTestDate as string);
      return d >= targetStart && d <= targetEnd;
    });
  }

  // Used only when NO specific date block is clicked (The default split view)
  const todaysRoster = scheduledLeads.filter(l => new Date(l.activeTestDate as string) <= endOfToday);
  const upcomingRoster = scheduledLeads.filter(l => new Date(l.activeTestDate as string) > endOfToday);

  // --- REUSABLE ROSTER TABLE COMPONENT ---
  const RosterTable = ({ leads, emptyMessage }: { leads: any[], emptyMessage: string }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
              <th className="p-4 pl-6">Candidate Details</th>
              <th className="p-4">Test Date & Attempt</th>
              <th className="p-4">Category</th>
              <th className="p-4 pr-6 text-right">Action Required</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                      <Icons.ClipboardList />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No candidates scheduled</h3>
                    <p className="text-slate-500 text-xs mt-1 font-medium">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const leadDate = new Date(lead.activeTestDate);
                const isOverdueOrToday = leadDate <= endOfToday;

                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs shadow-sm shrink-0 border border-purple-100">
                          {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">{lead.givenName} {lead.surname}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                            ID: {lead.id.slice(-6)} <span className="mx-1">•</span> {lead.nationality || "N/A"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                        isOverdueOrToday ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {isOverdueOrToday && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                        {leadDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1.5 font-bold uppercase tracking-wider">{lead.activeAttemptName}</p>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wider uppercase border border-slate-200">
                        {lead.category || "Pending"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <Link 
                        href={`/examiner/${lead.id}`} 
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-md shadow-purple-600/20 transition-all active:scale-95 group-hover:shadow-lg"
                      >
                        Evaluate <Icons.ArrowRight />
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
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 pt-4 relative">
      
      {/* 🚀 ENTERPRISE HEADER WITH QUICK STATS */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col lg:flex-row lg:justify-between lg:items-center gap-8">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0 border border-purple-100 shadow-sm">
            <Icons.ClipboardList />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examiner Command Center</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Manage your testing roster, score candidates, and log evaluations.
            </p>
          </div>
        </div>

        {/* 📊 KPI WIDGETS */}
        <div className="flex flex-wrap gap-4 shrink-0">
          <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Icons.Clock /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tests Today</p>
              <p className="text-xl font-black text-slate-900 leading-none">{testsTodayCount}</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><Icons.Users /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Roster</p>
              <p className="text-xl font-black text-slate-900 leading-none">{totalPendingTests}</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><Icons.BadgeCheck /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluations</p>
              <p className="text-xl font-black text-slate-900 leading-none">{totalEvaluationsDone}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🚀 SLEEK UNDERLINE TABS */}
      <div className="flex space-x-8 border-b border-slate-200 overflow-x-auto custom-scrollbar">
        <Link 
          href="?tab=pending" 
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'pending' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.Clock /> Pending Queue
        </Link>
        <Link 
          href="?tab=history" 
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'history' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Icons.ClipboardList /> Evaluation History
        </Link>
      </div>

      {/* ================================================== */}
      {/* 📑 TAB 1: PENDING QUEUE                            */}
      {/* ================================================== */}
      {activeTab === "pending" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          
          {/* 📅 INTERACTIVE DATE BLOCKS TIMELINE */}
          {upcomingDateBlocks.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Filter by Exam Date</p>
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar snap-x">
                
                {/* The "All / Clear" Block */}
                <Link 
                  href="?tab=pending" 
                  className={`snap-start shrink-0 min-w-[110px] flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                    !filterDateStr 
                      ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30 -translate-y-1' 
                      : 'bg-white border-slate-200 text-slate-500 hover:border-purple-300 hover:shadow-md'
                  }`}
                >
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${!filterDateStr ? 'text-purple-200' : 'text-slate-400'}`}>Show</span>
                  <span className="text-2xl font-black my-1">ALL</span>
                  <span className={`text-[10px] font-bold ${!filterDateStr ? 'text-white' : 'text-slate-400'}`}>Upcoming</span>
                </Link>

                {/* Map out the Unique Dates */}
                {upcomingDateBlocks.map((block) => {
                  const isSelected = filterDateStr === block.date;
                  const isPast = new Date(block.date) < new Date(todayStr);
                  const isToday = block.date === todayStr;

                  return (
                    <Link 
                      key={block.date}
                      href={`?tab=pending&date=${block.date}`} 
                      className={`snap-start shrink-0 min-w-[110px] flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/30 -translate-y-1' 
                          : isPast 
                            ? 'bg-rose-50/50 border-rose-100 text-rose-800 hover:border-rose-300 hover:shadow-md hover:bg-white' 
                            : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-purple-200' : isPast ? 'text-rose-400' : 'text-slate-400'}`}>
                        {isToday ? "Today" : getDayOfWeek(block.date)}
                      </span>
                      <span className="text-3xl font-black my-1 leading-none">{getDayNumber(block.date)}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-purple-100' : isPast ? 'text-rose-400' : 'text-slate-400'}`}>
                        {getMonthStr(block.date)}
                      </span>
                      <span className={`mt-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isSelected 
                          ? 'bg-purple-500/50 border-purple-400/50 text-white' 
                          : isPast 
                            ? 'bg-rose-100 border-rose-200 text-rose-700' 
                            : 'bg-purple-50 border-purple-100 text-purple-700'
                      }`}>
                        {block.count} {block.count === 1 ? 'Exam' : 'Exams'}
                      </span>
                    </Link>
                  );
                })}

              </div>
            </div>
          )}

          {/* TABLE DISPLAY AREA */}
          {isFilteredView ? (
            /* 📅 EXPLICIT FILTERED DATE VIEW */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-200 shadow-sm">
                  <Icons.Calendar />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  Roster for {new Date(filterDateStr!).toLocaleDateString("en-GB", { day: 'numeric', month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <RosterTable 
                leads={displayRoster} 
                emptyMessage={`No candidates are scheduled for testing on ${new Date(filterDateStr!).toLocaleDateString("en-GB")}.`} 
              />
            </div>
          ) : (
            /* 🔥 NORMAL SPLIT VIEW (TODAY vs UPCOMING) */
            <>
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
                    <Icons.Clock />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Today's Roster & Action Required</h2>
                    <p className="text-xs text-slate-500 font-medium">Includes tests scheduled for today and any overdue/missed tests.</p>
                  </div>
                </div>
                <RosterTable 
                  leads={todaysRoster} 
                  emptyMessage="No candidates are scheduled for testing today." 
                />
              </div>

              <div className="pt-4 border-t border-slate-200 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                    <Icons.Calendar />
                  </div>
                  <h2 className="text-lg font-black text-slate-900">Upcoming Candidates</h2>
                </div>
                <RosterTable 
                  leads={upcomingRoster} 
                  emptyMessage="No upcoming candidates in the queue." 
                />
              </div>
            </>
          )}

        </div>
      )}

      {/* ================================================== */}
      {/* 📑 TAB 2: EVALUATION HISTORY                       */}
      {/* ================================================== */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800 text-white text-[10px] uppercase tracking-wider font-bold">
                  <th className="p-4 pl-6">Evaluation Date</th>
                  <th className="p-4">Candidate</th>
                  <th className="p-4">English Score</th>
                  <th className="p-4">Driving Score</th>
                  <th className="p-4 pr-6 text-right">Final Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                          <Icons.ClipboardList />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No history found</h3>
                        <p className="text-slate-500 text-xs mt-1 font-medium">You have not submitted any evaluations yet.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4 pl-6 text-sm font-bold text-slate-600">
                        {new Date(log.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        <p className="text-[10px] font-medium text-slate-400 uppercase mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                          {log.lead.givenName} {log.lead.surname}
                        </p>
                        <Link 
                          href={`/examiner/${log.lead.id}`} 
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors mt-0.5 flex items-center gap-1"
                        >
                          View Full Profile <Icons.ArrowRight />
                        </Link>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-lg text-slate-800">{log.englishScore || "-"}</span>
                        <span className="text-xs text-slate-400 font-medium">/10</span>
                        <p className={`text-[10px] font-bold uppercase mt-0.5 ${log.englishTestResult === 'Passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.englishTestResult}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="font-black text-lg text-slate-800">{log.drivingScore || "-"}</span>
                        <span className="text-xs text-slate-400 font-medium">/10</span>
                        <p className={`text-[10px] font-bold uppercase mt-0.5 ${log.yardTestResult === 'Passed' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {log.yardTestResult}
                        </p>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <span className={`inline-flex px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md border shadow-sm ${
                          log.status === "Approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
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
        </div>
      )}

    </div>
  );
}