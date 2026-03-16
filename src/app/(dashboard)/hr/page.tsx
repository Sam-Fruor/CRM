// src/app/(dashboard)/hr/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HRDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const allLeads = await prisma.lead.findMany({
    orderBy: { updatedAt: "desc" }
  });

  // 📊 CALCULATE YOUR CUSTOM HR METRICS
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
);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">HR & Documentation Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Manage stage 2 processing, verify documents, and track visas.</p>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Total Active Cases</h3>
          <p className="text-2xl font-black text-slate-800 mt-1">{activeStage2}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Job Offer Pending</h3>
          <p className="text-2xl font-bold text-purple-600 mt-1">{jobOfferPending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Work Permit Pending</h3>
          <p className="text-2xl font-bold text-amber-500 mt-1">{workPermitPending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Payment Pending</h3>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{paymentPending}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-green-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Visa Approved</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">{visaApproved}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Visa Rejected</h3>
          <p className="text-2xl font-bold text-red-600 mt-1">{visaRejected}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Pending Documents</h3>
          <p className="text-2xl font-bold text-slate-600 mt-1">Review</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Dropped Off</h3>
          <p className="text-2xl font-bold text-slate-800 mt-1">{droppedOff}</p>
        </div>
      </div>

      {/* ⚡ ACTION REQUIRED (FOLLOW-UPS) - NOW FULL WIDTH */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">⚡ Action Required</h2>
            <p className="text-sm text-slate-500">Clients scheduled for a follow-up today or earlier.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {followUpsDue.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 text-3xl">
                ✓
              </div>
              <h3 className="text-slate-800 font-bold text-lg">You're all caught up!</h3>
              <p className="text-slate-500 mt-1">No pending follow-ups scheduled for today.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {followUpsDue.map((lead) => {
                const isOverdue = new Date(lead.followUpDate!) < new Date(new Date().setHours(0,0,0,0));
                return (
                  <li key={lead.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
                        {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          📞 {lead.callingNumber} • <span className="font-medium text-slate-600">{lead.category}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Due Today'}
                        </span>
                      </div>
                      <Link 
                        href={`/hr/${lead.id}?tab=details`}
                        className="px-5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-lg shadow-sm transition-colors"
                      >
                        Open File
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}