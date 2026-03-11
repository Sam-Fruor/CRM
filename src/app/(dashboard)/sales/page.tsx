// src/app/(dashboard)/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

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

  // ⚡ CALCULATE FOLLOW-UPS DUE
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of day for accurate comparison

  const followUpsDue = leads
    .filter(l => 
      l.caseStatus === "Stage 1 Under Process" && // Only show active Sales leads
      l.followUpDate !== null && 
      new Date(l.followUpDate) <= today // Due today or overdue
    )
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime()) // Oldest first
    .slice(0, 5); // Show top 5 to keep dashboard clean

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* METRICS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Leads</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{totalLeads}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Slot Bookings</h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">{slotBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-purple-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Next Test Clients</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{nextTest}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-orange-400">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Not Responding</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{notResponding}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-red-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Not Interested</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{notInterested}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-400">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">Not Eligible / Others</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">{notEligible}</p>
        </div>
      </div>

      {/* ACTION REQUIRED: FOLLOW-UPS WIDGET */}
      <div>
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">⚡ Action Required</h2>
            <p className="text-sm text-slate-500">Clients scheduled for a follow-up today or earlier.</p>
          </div>
          {followUpsDue.length > 0 && (
            <Link href="/sales/leads" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              View All Leads →
            </Link>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {followUpsDue.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 text-2xl">
                ✓
              </div>
              <h3 className="text-slate-700 font-bold">You're all caught up!</h3>
              <p className="text-slate-500 text-sm mt-1">No pending follow-ups scheduled for today.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {followUpsDue.map((lead) => {
                const isOverdue = new Date(lead.followUpDate!) < new Date(new Date().setHours(0,0,0,0));
                
                return (
                  <li key={lead.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          📞 {lead.callingNumber} • {lead.category === 'Pending' ? 'Category Not Set' : lead.category}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {isOverdue ? 'Overdue' : 'Due Today'}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(lead.followUpDate!).toLocaleDateString()}
                        </p>
                      </div>
                      <Link 
                        href={`/sales/${lead.id}`}
                        className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold rounded-lg shadow-sm transition-colors"
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