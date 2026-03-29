// src/app/(dashboard)/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

// 🎨 ENTERPRISE ICONS
const Icons = {
  Users: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Target: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  Calendar: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clock: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ban: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  Bolt: ({ className }: { className?: string }) => <svg className={className || "w-5 h-5 text-amber-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  AlertCircle: ({ className }: { className?: string }) => <svg className={className || "w-5 h-5 text-rose-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Phone: ({ className }: { className?: string }) => <svg className={className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  ArrowRight: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  CheckCircle: ({ className }: { className?: string }) => <svg className={className || "w-8 h-8 text-emerald-500"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  FolderOpen: ({ className }: { className?: string }) => <svg className={className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>,
  Wallet: ({ className }: { className?: string }) => <svg className={className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
};

export default async function SalesDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };

  // Fetch all leads for this branch
  const leads = await prisma.lead.findMany({
    where: branchCondition,
  });

  // 📊 CALCULATE METRICS
  const totalLeads = leads.length;
  const notResponding = leads.filter(l => l.feedbackStatus === "Not Responding").length;
  const notInterested = leads.filter(l => l.feedbackStatus === "Not Interested").length;
  const notEligible = leads.filter(l => l.feedbackStatus === "Not Eligible" || l.feedbackStatus === "Others").length;
  const slotBookings = leads.filter(l => l.feedbackStatus === "Converted").length; 
  const nextTest = leads.filter(l => l.feedbackStatus === "Client is for Next Test").length;

  // ⚡ SMART FOLLOW-UPS CALCULATION
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); 
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); 

  // 1. LEFT TRIAGE: URGENT FOLLOW-UPS
  const activeFollowUps = leads.filter(l => l.caseStatus === "Stage 1 Under Process" && l.followUpDate !== null);
  const dueOrOverdue = activeFollowUps
    .filter(l => new Date(l.followUpDate!) <= todayEnd)
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());
  const followUpsDue = dueOrOverdue.slice(0, 5); // Just grab the top 5 most urgent

  // 2. RIGHT TRIAGE: BLOCKED DEALS (Missing Docs or Pending Payment)
  const blockedDeals = leads.map(lead => {
    // Only care about active Stage 1 leads
    if (lead.caseStatus !== "Stage 1 Under Process") return null;

    const docs = (lead.documentStatus as any) || {};
    const missing = [];
    if (!docs.resumeUploaded) missing.push("CV");
    if (!docs.dlUploaded) missing.push("License");
    if (!docs.residentIdUploaded) missing.push("Resident ID");
    if (!docs.passportUploaded) missing.push("Passport");
    if (!docs.videoUploaded) missing.push("Video");

    // They are pending payment if they passed the exam but haven't signed SA
    const isPendingPayment = lead.examinerStatus === "Approved";

    if (missing.length > 0 || isPendingPayment) {
      return {
        ...lead,
        blockReason: isPendingPayment ? "Pending Payment" : `Missing ${missing.length} Doc(s)`,
        isPendingPayment,
        missing
      };
    }
    return null;
  })
  .filter(Boolean)
  .sort((a, b) => new Date(a!.updatedAt).getTime() - new Date(b!.updatedAt).getTime()) // Sort by oldest updated (waiting longest)
  .slice(0, 5); // Grab top 5

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 pt-2 relative">
      
      {/* 🚀 PAGE HEADER */}
      <div className="mb-6 border-b border-slate-200 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Command Center</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Overview of your pipeline, conversions, and urgent tasks.</p>
        </div>
        <div className="hidden sm:flex gap-3">
          <Link href="/sales/form" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all active:scale-95">
            + New Lead
          </Link>
        </div>
      </div>

      {/* 🚀 METRICS GRID - CLICKABLE & INTERACTIVE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <Link href="/sales/leads" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-indigo-600 transition-colors text-[11px] font-bold uppercase tracking-wider">Total Leads</h3>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md"><Icons.Users /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</p>
        </Link>

        <Link href="/sales/leads?filter=converted" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-emerald-600 transition-colors text-[11px] font-bold uppercase tracking-wider">Bookings</h3>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><Icons.Target /></div>
          </div>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">{slotBookings}</p>
        </Link>

        <Link href="/sales/exams" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-purple-300 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-purple-600 transition-colors text-[11px] font-bold uppercase tracking-wider">Next Test</h3>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md"><Icons.Calendar /></div>
          </div>
          <p className="text-3xl font-black text-purple-700 tracking-tight">{nextTest}</p>
        </Link>

        <Link href="/sales/leads" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-amber-300 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-amber-600 transition-colors text-[11px] font-bold uppercase tracking-wider">No Reply</h3>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md"><Icons.Clock /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notResponding}</p>
        </Link>

        <Link href="/sales/leads?filter=rejected" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-rose-300 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-rose-600 transition-colors text-[11px] font-bold uppercase tracking-wider">Declined</h3>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md"><Icons.XCircle /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notInterested}</p>
        </Link>

        <Link href="/sales/leads?filter=rejected" className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-slate-400 transition-all duration-200 flex flex-col justify-between cursor-pointer">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 group-hover:text-slate-700 transition-colors text-[11px] font-bold uppercase tracking-wider">Ineligible</h3>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md"><Icons.Ban /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notEligible}</p>
        </Link>

      </div>

      {/* 🚀 THE TRIAGE SPLIT-VIEW (Action vs. Blocked) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 pt-4">
        
        {/* 🔥 LEFT: URGENT FOLLOW-UPS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-amber-100 bg-amber-50/30 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
              <Icons.Bolt /> Urgent Follow-Ups
            </h2>
            {followUpsDue.length > 0 && (
              <Link href="/sales/leads" className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 transition-colors bg-amber-100/50 px-2.5 py-1 rounded-md">
                View All
              </Link>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {followUpsDue.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <Icons.CheckCircle />
                <h3 className="text-sm text-slate-800 font-bold mt-3">Inbox Zero!</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium">No overdue or urgent calls pending.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {followUpsDue.map((lead) => {
                  const leadDate = new Date(lead.followUpDate!);
                  const isOverdue = leadDate < todayStart;
                  
                  return (
                    <li key={lead.id} className="p-4 hover:bg-slate-50/80 transition-colors group relative">
                      <Link href={`/sales/${lead.id}`} className="absolute inset-0 z-10"></Link>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${isOverdue ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{lead.givenName} {lead.surname}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                              <span className="flex items-center gap-1"><Icons.Phone /> {lead.callingNumber}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`}></span>
                            {isOverdue ? 'Overdue' : 'Due Today'}
                          </span>
                          <p className="text-[10px] font-medium text-slate-400 mt-1">
                            {leadDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* 🛑 RIGHT: BLOCKED DEALS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-rose-100 bg-rose-50/30 flex justify-between items-center shrink-0">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
              <Icons.AlertCircle /> Blocked Deals
            </h2>
            {blockedDeals.length > 0 && (
              <Link href="/sales/missing-docs" className="text-[11px] font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 transition-colors bg-rose-100/50 px-2.5 py-1 rounded-md">
                Unblock Queue
              </Link>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {blockedDeals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                <Icons.CheckCircle />
                <h3 className="text-sm text-slate-800 font-bold mt-3">Pipeline is Flowing!</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium">No clients are stuck on docs or payments.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {blockedDeals.map((lead: any) => {
                  const daysStuck = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 3600 * 24));
                  
                  return (
                    <li key={lead.id} className="p-4 hover:bg-slate-50/80 transition-colors group relative">
                      {/* Routes directly to the tab needed to fix the block */}
                      <Link href={`/sales/${lead.id}?tab=${lead.isPendingPayment ? 'sa' : 'documents'}`} className="absolute inset-0 z-10"></Link>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border ${lead.isPendingPayment ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 group-hover:text-rose-600 transition-colors">{lead.givenName} {lead.surname}</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                              {lead.isPendingPayment ? <Icons.Wallet /> : <Icons.FolderOpen />} 
                              {lead.blockReason}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                            daysStuck > 5 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-slate-50 text-slate-600 border-slate-200/60'
                          }`}>
                            Stuck {daysStuck} Days
                          </span>
                          <p className="text-[10px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center justify-end gap-1">
                            Fix Issue <Icons.ArrowRight />
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}