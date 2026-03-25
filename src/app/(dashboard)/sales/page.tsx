// src/app/(dashboard)/sales/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

// 🎨 ENTERPRISE ICONS (Crisp, proportional, minimalist)
const Icons = {
  Users: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Target: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  Calendar: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Clock: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  XCircle: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Ban: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
  Bolt: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Phone: ({ className }: { className?: string }) => <svg className={className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  ArrowRight: ({ className }: { className?: string }) => <svg className={className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  CheckCircle: ({ className }: { className?: string }) => <svg className={className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
  todayStart.setHours(0, 0, 0, 0); // Start of today (for overdue calculation)
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999); // End of today

  // 1. Get all active leads that have a follow-up date
  const activeFollowUps = leads.filter(l => 
    l.caseStatus === "Stage 1 Under Process" && 
    l.followUpDate !== null
  );

  // 2. Separate them into Due/Overdue vs Upcoming
  const dueOrOverdue = activeFollowUps
    .filter(l => new Date(l.followUpDate!) <= todayEnd)
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());

  const upcoming = activeFollowUps
    .filter(l => new Date(l.followUpDate!) > todayEnd)
    .sort((a, b) => new Date(a.followUpDate!).getTime() - new Date(b.followUpDate!).getTime());

  // 3. Combine them (Due/Overdue first, then fill remaining slots with Upcoming)
  const followUpsDue = [...dueOrOverdue, ...upcoming].slice(0, 5); 

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 pt-2 relative">
      
      {/* 🚀 PAGE HEADER */}
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Dashboard</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Overview of your pipeline, conversions, and pending tasks.</p>
      </div>

      {/* 🚀 METRICS GRID - HIGH DENSITY ENTERPRISE STYLE */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Total Leads</h3>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md"><Icons.Users /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{totalLeads}</p>
        </div>

        {/* Total Slot Bookings */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Bookings</h3>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md"><Icons.Target /></div>
          </div>
          <p className="text-3xl font-black text-emerald-700 tracking-tight">{slotBookings}</p>
        </div>

        {/* Next Test Clients */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Next Test</h3>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md"><Icons.Calendar /></div>
          </div>
          <p className="text-3xl font-black text-purple-700 tracking-tight">{nextTest}</p>
        </div>

        {/* Not Responding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">No Reply</h3>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md"><Icons.Clock /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notResponding}</p>
        </div>

        {/* Not Interested */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Declined</h3>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-md"><Icons.XCircle /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notInterested}</p>
        </div>

        {/* Not Eligible / Others */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-400 transition-all duration-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">Ineligible</h3>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md"><Icons.Ban /></div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{notEligible}</p>
        </div>

      </div>

      {/* 🚀 ACTION REQUIRED: FOLLOW-UPS WIDGET */}
      <div className="mt-8 pt-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                <span className="text-indigo-500"><Icons.Bolt /></span> Action Required
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">Pending and upcoming follow-ups for your pipeline.</p>
            </div>
            {followUpsDue.length > 0 && (
              <Link href="/sales/leads" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-md hover:bg-indigo-50">
                View Workspace <Icons.ArrowRight />
              </Link>
            )}
          </div>

          {/* List */}
          {followUpsDue.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-50 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                <Icons.CheckCircle />
              </div>
              <h3 className="text-sm text-slate-800 font-bold">You're all caught up!</h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">No pending follow-ups scheduled.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {followUpsDue.map((lead) => {
                const leadDate = new Date(lead.followUpDate!);
                const isOverdue = leadDate < todayStart;
                const isUpcoming = leadDate > todayEnd;
                
                return (
                  <li key={lead.id} className="px-6 py-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                    
                    <div className="flex items-center gap-4">
                      {/* Professional Small Avatar */}
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs border border-slate-200 shrink-0">
                        {lead.givenName.charAt(0)}{lead.surname.charAt(0)}
                      </div>
                      
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-slate-900">{lead.givenName} {lead.surname}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-medium">
                          <span className="flex items-center gap-1"><Icons.Phone /> {lead.callingNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span>{lead.category === 'Pending' ? 'No Category' : lead.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
                      <div className="flex flex-col items-start sm:items-end">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                          isUpcoming ? 'bg-slate-50 text-slate-600 border-slate-200/60' :
                          'bg-amber-50 text-amber-700 border-amber-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isOverdue ? 'bg-rose-500 animate-pulse' : 
                            isUpcoming ? 'bg-slate-400' : 
                            'bg-amber-500'
                          }`}></span>
                          {isOverdue ? 'Overdue' : isUpcoming ? 'Upcoming' : 'Due Today'}
                        </span>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                          {leadDate.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      
                      <Link 
                        href={`/sales/${lead.id}`}
                        className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-indigo-800"
                      >
                        Open Profile <Icons.ArrowRight />
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