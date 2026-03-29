// src/app/(dashboard)/hr/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🎨 ENTERPRISE ICONS
const Icons = {
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Briefcase: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Document: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Payment: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  CheckBadge: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  FolderOpen: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>,
  Archive: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  ArrowRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Phone: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
};

export default async function HRDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const allLeads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" }
  });

  // 📊 CALCULATE HR METRICS
  const activeStage2 = allLeads.filter(l => l.caseStatus.includes("Stage 2") || l.caseStatus.includes("Pending Payment") || l.caseStatus.includes("Letter Pending") || l.caseStatus.includes("Under Process")).length;
  const jobOfferPending = allLeads.filter(l => l.caseStatus === "Job Offer Letter Pending" || l.caseStatus === "Signed Job Offer Letter Pending" || l.caseStatus === "Stage 2: HR - Waiting for Job Offer").length;
  const workPermitPending = allLeads.filter(l => l.caseStatus === "Work Permit Under Process" || l.caseStatus === "Signed Work Permit Pending" || l.caseStatus === "Stage 2: HR - Waiting for Work Permit").length;
  const visaApproved = allLeads.filter(l => l.caseStatus === "Visa Approved").length;
  const visaRejected = allLeads.filter(l => l.caseStatus === "Visa Rejected").length;
  const droppedOff = allLeads.filter(l => l.caseStatus === "Not Interested/Dropped Off" || l.caseStatus === "Client Not Enrolled").length;

  // Payment Pending Clients
  const paymentPending = allLeads.filter(l => 
    (l.serviceAgreementPending ?? 0) > 0 || 
    (l.jobOfferPending ?? 0) > 0 || 
    (l.workPermitPending ?? 0) > 0 || 
    (l.insurancePending ?? 0) > 0 || 
    (l.schoolFeesPending ?? 0) > 0 || 
    (l.flightTicketPending ?? 0) > 0
  ).length;

  // ⚡ CALCULATE FOLLOW-UPS DUE
  const today = new Date();
  today.setHours(23, 59, 59, 999); 

  const followUpsDue = allLeads.filter(l => 
    l.hrNextFollowUpDate && new Date(l.hrNextFollowUpDate) <= today
  ).sort((a, b) => new Date(a.hrNextFollowUpDate!).getTime() - new Date(b.hrNextFollowUpDate!).getTime());

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-4 relative">
      
      {/* 🚀 ENTERPRISE HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-100 tracking-wider">
              HUMAN RESOURCES
            </span>
            <span className="text-slate-400 text-xs font-medium">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {greeting}, {session.user.name?.split(' ')[0] || 'Team'}! 👋
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Manage Stage 2 processing, verify documents, and track active visas.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <Link 
            href="/hr/payments" 
            className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-md text-xs font-bold transition-all shadow-sm"
          >
            <Icons.Payment /> Verify Payments
          </Link>
          <Link 
            href="/hr/verification" 
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Icons.FolderOpen /> Open HR Database
          </Link>
        </div>
      </div>

      {/* 📊 TOP PIPELINE STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Icons.Users /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100"><Icons.Users /></div>
            <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider">Active HR Cases</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{activeStage2}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Icons.CheckBadge /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100"><Icons.CheckBadge /></div>
            <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider">Visas Approved</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{visaApproved}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Icons.Archive /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200"><Icons.Archive /></div>
            <h3 className="text-slate-600 text-xs font-bold uppercase tracking-wider">Dropped / Archived</h3>
          </div>
          <p className="text-3xl font-black text-slate-800 tracking-tight">{droppedOff}</p>
        </div>
      </div>

      {/* 📥 ACTION QUEUES GRID */}
      <h2 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mt-8 mb-4">Pending Action Queues</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/hr/leads?filter=job_offer" className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-purple-50 text-purple-600 p-2 rounded border border-purple-100"><Icons.Briefcase /></div>
            <span className="text-xl font-bold text-slate-800">{jobOfferPending}</span>
          </div>
          <h3 className="text-slate-600 text-[11px] font-bold uppercase tracking-wider group-hover:text-purple-700 transition-colors">Job Offer Pending</h3>
        </Link>

        <Link href="/hr/leads?filter=work_permit" className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-amber-50 text-amber-600 p-2 rounded border border-amber-100"><Icons.Document /></div>
            <span className="text-xl font-bold text-slate-800">{workPermitPending}</span>
          </div>
          <h3 className="text-slate-600 text-[11px] font-bold uppercase tracking-wider group-hover:text-amber-700 transition-colors">Work Permit Pending</h3>
        </Link>

        <Link href="/hr/payments" className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded border border-indigo-100"><Icons.Payment /></div>
            <span className="text-xl font-bold text-slate-800">{paymentPending}</span>
          </div>
          <h3 className="text-slate-600 text-[11px] font-bold uppercase tracking-wider group-hover:text-indigo-700 transition-colors">Payments to Verify</h3>
        </Link>

        <Link href="/hr/leads?filter=rejected" className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="bg-rose-50 text-rose-600 p-2 rounded border border-rose-100"><Icons.XCircle /></div>
            <span className="text-xl font-bold text-slate-800">{visaRejected}</span>
          </div>
          <h3 className="text-slate-600 text-[11px] font-bold uppercase tracking-wider group-hover:text-rose-700 transition-colors">Visas Rejected</h3>
        </Link>
      </div>

      {/* ⚡ ACTION REQUIRED (FOLLOW-UPS) */}
      <div className="mt-8">
        <div className="flex justify-between items-end mb-4 border-b border-slate-200 pb-2">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="text-amber-500">⚡</span> Priority Follow-ups
          </h2>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {followUpsDue.length} Tasks Pending
          </span>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {followUpsDue.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-100">
                <Icons.CheckBadge />
              </div>
              <h3 className="text-slate-800 font-bold text-sm">Inbox Zero!</h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">No pending follow-ups scheduled for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    <th className="py-3 px-4 w-1/3">Candidate</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4 text-center">Urgency</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {followUpsDue.map((lead) => {
                    const isOverdue = new Date(lead.hrNextFollowUpDate!) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors group">
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

                        <td className="p-4 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {lead.caseStatus}
                          </span>
                        </td>

                        <td className="p-4 align-middle text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                            isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <Icons.Clock /> {isOverdue ? 'Overdue' : 'Due Today'}
                          </span>
                        </td>

                        <td className="p-4 text-right align-middle">
                          <Link 
                            href={`/hr/${lead.id}?tab=hr`} 
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-white font-semibold text-xs bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 hover:border-indigo-600 px-3 py-1.5 rounded-md transition-all shadow-sm"
                          >
                            Open File <Icons.ArrowRight />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}