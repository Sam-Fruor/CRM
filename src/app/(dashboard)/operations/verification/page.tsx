// src/app/(dashboard)/operations/verification/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import LiveSearch from "@/components/LiveSearch";

// 🚀 Forces Next.js to NEVER cache this page, fixing the broken tabs!
export const dynamic = "force-dynamic"; 

export default async function OpsVerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "action"; // 'action' or 'waiting'
  const searchQuery = resolvedSearchParams.search || ""; 

  const branchFilter = session.user.branch === "MASTER" 
    ? {} 
    : { branch: session.user.branch as any };

  // 🔍 SMART SEARCH FILTER
  const searchFilter = searchQuery ? {
    OR: [
      { givenName: { contains: searchQuery, mode: "insensitive" as Prisma.QueryMode } },
      { surname: { contains: searchQuery, mode: "insensitive" as Prisma.QueryMode } },
      { id: { contains: searchQuery, mode: "insensitive" as Prisma.QueryMode } },
    ]
  } : {};

  // 🛑 STAGE 1 EXCLUSION LIST: Operations should never see these!
  const excludedStatuses = [
    "Not Interested/Dropped Off", 
    "Client Not Enrolled", 
    "Stage 1 Under Process", 
    "Pending Payment 1 (Service Agreement)"
  ];

  // 🚀 BULLETPROOF FETCH: Grabs ALL active Stage 2+ leads matching the search.
  const opsLeads = await prisma.lead.findMany({
    where: {
      AND: [
        branchFilter,
        searchQuery ? searchFilter : {},
        { caseStatus: { notIn: excludedStatuses } } // 👈 Block Stage 1 and Dropped Leads
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  // Smart Bucketing Arrays
  const actionRequired: any[] = [];
  const waitingOnHR: any[] = [];

  // Sort every payment for every lead
  opsLeads.forEach(lead => {
    let hasActiveOpsTask = false;

    // Helper function to reliably check specific payment types
    const checkPayment = (amountField: string, statusField: string, typeName: string) => {
      const amount = parseFloat(lead[amountField]);
      const status = lead[statusField];
      
      // Only trigger if HR has assigned an amount greater than 0
      if (amount && amount > 0) {
        if (status === "Unsubmitted" || status === "Rejected") {
          actionRequired.push({ lead, type: typeName, amount, status });
          hasActiveOpsTask = true;
        } else if (status === "Pending") {
          waitingOnHR.push({ lead, type: typeName, amount, status });
          hasActiveOpsTask = true;
        }
      }
    };

    checkPayment('jobOfferPending', 'jobOfferVerifyStatus', 'Job Offer');
    checkPayment('workPermitPending', 'workPermitVerifyStatus', 'Work Permit');
    checkPayment('insurancePending', 'insuranceVerifyStatus', 'Insurance');
    checkPayment('schoolFeesPending', 'schoolFeesVerifyStatus', 'School Fees');
    checkPayment('flightTicketPending', 'flightTicketVerifyStatus', 'Flight Ticket');
    checkPayment('otherPending', 'otherPendingVerifyStatus', 'Other / Misc');

    // Safely check dynamic 'otherPayments' array for custom payments
    if (lead.otherPayments) {
      let customPayments: any[] = [];
      try {
        customPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse(lead.otherPayments as any);
      } catch (e) {}

      customPayments.forEach((p: any) => {
        const amt = parseFloat(p.amount);
        if (amt && amt > 0) {
          if (p.status === "Unsubmitted" || p.status === "Rejected") {
            actionRequired.push({ lead, type: p.name || "Misc Payment", amount: amt, status: p.status });
            hasActiveOpsTask = true;
          } else if (p.status === "Pending") {
            waitingOnHR.push({ lead, type: p.name || "Misc Payment", amount: amt, status: p.status });
            hasActiveOpsTask = true;
          }
        }
      });
    }

    // 🚀 NO ACTIVE TASKS LOGIC: If they are in Stage 2 but have no assigned payments, 
    // throw them into "Waiting on HR" so Operations can easily find them!
    if (!hasActiveOpsTask) {
      waitingOnHR.push({ lead, type: "Pending Assignment", amount: 0, status: "No Active Task" });
    }
  });

  const currentList = activeTab === "action" ? actionRequired : waitingOnHR;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER & LIVE SEARCH */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">🛡️ Operations Verification Hub</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track payments assigned by HR. Upload receipts for pending collections and monitor items awaiting HR approval.
          </p>
        </div>
        
        <div className="shrink-0">
          <LiveSearch placeholder="Search name or ID..." />
        </div>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2 bg-white pt-2 rounded-t-xl shadow-sm">
        <Link 
          href={`?tab=action${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'action' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⚡ Action Required
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'action' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
            {actionRequired.length}
          </span>
        </Link>
        <Link 
          href={`?tab=waiting${searchQuery ? `&search=${searchQuery}` : ''}`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'waiting' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏳ Waiting on HR
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'waiting' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
            {waitingOnHR.length}
          </span>
        </Link>
      </div>

      {/* CONTENT AREA */}
      {currentList.length === 0 ? (
        <div className="bg-white p-16 rounded-b-xl border border-t-0 border-slate-200 text-center flex flex-col items-center shadow-sm animate-in fade-in">
          <span className="text-5xl mb-4">{activeTab === 'action' ? '🎉' : '☕'}</span>
          <h2 className="text-xl font-bold text-slate-700">
            {searchQuery 
              ? "No matching records found." 
              : activeTab === 'action' ? "All caught up!" : "Nothing waiting!"}
          </h2>
          <p className="text-slate-500 mt-2">
            {searchQuery 
              ? `We couldn't find any ${activeTab === 'action' ? 'pending' : 'waiting'} items matching "${searchQuery}".`
              : activeTab === 'action' 
                ? "You have collected and submitted all payments currently assigned by HR." 
                : "HR has processed all of your submitted receipts. No items are pending approval."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-b-xl shadow-sm border border-t-0 border-slate-200 overflow-hidden animate-in fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Collection Task</th>
                <th className="p-4 font-semibold">Amount to Collect</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.map((req, idx) => (
                <tr key={idx} className={`transition-colors bg-white ${activeTab === 'action' ? 'hover:bg-emerald-50/50' : 'hover:bg-amber-50/50'}`}>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{req.lead.givenName} {req.lead.surname}</p>
                    <p className="text-xs text-slate-500 mt-0.5 mb-2">ID: {req.lead.id.slice(-6).toUpperCase()}</p>
                    <Link href={`/operations/${req.lead.id}?tab=profile`} className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                      ↗️ View Full Profile
                    </Link>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      activeTab === 'action' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 font-black text-slate-800 text-lg">
                    {req.amount > 0 ? `${req.amount.toFixed(2)} AED` : <span className="text-slate-400 font-medium text-sm">-</span>}
                  </td>
                  <td className="p-4">
                    {req.status === "Unsubmitted" && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">Unsubmitted</span>}
                    {req.status === "Rejected" && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">❌ Rejected by HR</span>}
                    {req.status === "Pending" && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200 animate-pulse">⏳ Pending HR Review</span>}
                    {req.status === "No Active Task" && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">HR to Assign</span>}
                  </td>
                  <td className="p-4 text-right">
                    <Link 
                      href={`/operations/${req.lead.id}?tab=ops`} 
                      className={`text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-transform hover:scale-105 inline-block ${
                        activeTab === 'action' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {activeTab === 'action' ? "Collect & Submit ➔" : "View File ↗️"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}