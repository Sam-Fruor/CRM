// src/app/(dashboard)/hr/payments/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import PaymentApprovalClient from "./PaymentApprovalClient";
import { Prisma } from "@prisma/client";

export default async function VerifyPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "pending";

  const branchFilter = session.user.branch === "MASTER" 
    ? {} 
    : { branch: session.user.branch as any };

  // Fetch leads that have ANY payment interaction
  const allPaymentLeads = await prisma.lead.findMany({
    where: {
      ...branchFilter,
      OR: [
        { testFeeVerifyStatus: { not: "Unsubmitted" } },
        { reTestFeeVerifyStatus: { not: "Unsubmitted" } },
        { saFeeVerifyStatus: { not: "Unsubmitted" } },
        // ✅ FIX: Safely check the JSON column in Prisma
        { otherPayments: { not: Prisma.JsonNull } }
      ]
    },
    orderBy: { updatedAt: "desc" }
  });

  // Extract specific transaction requests for the tables cleanly
  const pendingRequests: any[] = [];
  const historyRequests: any[] = [];

  allPaymentLeads.forEach(lead => {
    // 1. Initial Test
    if (lead.testFeeVerifyStatus === "Pending") {
      pendingRequests.push({ lead, type: "TEST", name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: "Pending" });
    } else if (lead.testFeeVerifyStatus === "Approved" || lead.testFeeVerifyStatus === "Rejected") {
      historyRequests.push({ lead, type: "TEST", name: "Initial Test Fee", amount: lead.testFeesAmount, date: lead.paymentDate, status: lead.testFeeVerifyStatus, inv: lead.invoiceNumber, reason: lead.testFeeRejectReason });
    }

    // 2. Re-Test
    if (lead.reTestFeeVerifyStatus === "Pending") {
      pendingRequests.push({ lead, type: "RETEST", name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: "Pending" });
    } else if (lead.reTestFeeVerifyStatus === "Approved" || lead.reTestFeeVerifyStatus === "Rejected") {
      historyRequests.push({ lead, type: "RETEST", name: "Re-Test Fee", amount: lead.reTestFeesAmount, date: lead.reTestPaymentDate, status: lead.reTestFeeVerifyStatus, inv: lead.reTestInvoiceNumber, reason: lead.reTestFeeRejectReason });
    }

    // 3. Service Agreement
    if (lead.saFeeVerifyStatus === "Pending") {
      pendingRequests.push({ lead, type: "SA", name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: "Pending" });
    } else if (lead.saFeeVerifyStatus === "Approved" || lead.saFeeVerifyStatus === "Rejected") {
      historyRequests.push({ lead, type: "SA", name: "Service Agreement", amount: lead.serviceAgreementAmount, date: lead.serviceAgreementPaymentDate, status: lead.saFeeVerifyStatus, inv: lead.serviceAgreementInvoice, reason: lead.saFeeRejectReason });
    }

    // 4. ✅ FIX: Custom / Dynamic Payments (Fines, Reschedules, Attempt 3+)
    if (lead.otherPayments) {
      let customPayments: any[] = [];
      try {
        customPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse(lead.otherPayments as any);
      } catch (e) {}

      customPayments.forEach((p: any) => {
        if (p.status === "Pending") {
          pendingRequests.push({ lead, type: p.id, name: p.name || "Misc Payment", amount: p.amount, date: p.date, status: "Pending" });
        } else if (p.status === "Approved" || p.status === "Rejected") {
          historyRequests.push({ lead, type: p.id, name: p.name || "Misc Payment", amount: p.amount, date: p.date, status: p.status, inv: p.invoice, reason: p.rejectReason });
        }
      });
    }
  });

  // Safe formatting helpers for the tables
  const formatAmount = (amt: any) => (amt !== null && amt !== undefined && amt !== "") ? `${amt} AED` : null;
  const formatDate = (date: any) => date ? new Date(date).toLocaleDateString("en-GB") : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800">💰 Payment Verification Center</h1>
        <p className="text-slate-500 text-sm mt-1">
          Review and approve payments submitted by Sales. Exams cannot be scheduled until you issue an Invoice No. and approve.
        </p>
      </div>

      {/* TABS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2">
        <Link 
          href="?tab=pending" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏳ Pending Approval
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            {pendingRequests.length}
          </span>
        </Link>
        <Link 
          href="?tab=history" 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'history' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📜 Verification History
        </Link>
      </div>

      {/* CONTENT AREA */}
      {activeTab === "pending" ? (
        pendingRequests.length === 0 ? (
          <div className="bg-white p-16 rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm animate-in fade-in">
            <span className="text-5xl mb-4">🎉</span>
            <h2 className="text-xl font-bold text-slate-700">All Payments Verified!</h2>
            <p className="text-slate-500 mt-2">There are no pending payments waiting for your approval right now.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="p-4 font-semibold">Candidate</th>
                  <th className="p-4 font-semibold">Payment Type</th>
                  <th className="p-4 font-semibold">Amount Logged</th>
                  <th className="p-4 font-semibold">Payment Date</th>
                  <th className="p-4 font-semibold text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRequests.map((req) => (
                  <tr key={`${req.lead.id}-${req.type}`} className="hover:bg-blue-50/50 transition-colors bg-white">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{req.lead.givenName} {req.lead.surname}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {req.lead.id.slice(-6).toUpperCase()} • {req.lead.branch.replace("BRANCH_", "")}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">{req.name}</span>
                    </td>
                    <td className="p-4 font-black text-slate-800">
                      {formatAmount(req.amount) || <span className="text-red-500 font-bold text-xs uppercase bg-red-50 px-2 py-1 rounded">Missing</span>}
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {formatDate(req.date) || <span className="text-red-500 font-bold text-xs uppercase bg-red-50 px-2 py-1 rounded">Missing</span>}
                    </td>
                    <td className="p-4 text-right">
                      <PaymentApprovalClient leadId={req.lead.id} paymentType={req.type as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Payment Type</th>
                <th className="p-4 font-semibold">Amount & Invoice</th>
                <th className="p-4 font-semibold">Result</th>
                <th className="p-4 font-semibold text-right">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyRequests.map((req) => (
                <tr key={`${req.lead.id}-${req.type}`} className="hover:bg-slate-50 transition-colors bg-white">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{req.lead.givenName} {req.lead.surname}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {req.lead.id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">{req.name}</span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{formatAmount(req.amount) || "No Amount"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{req.inv ? `INV: ${req.inv}` : "No Invoice Generated"}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${
                      req.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'Rejected' && req.reason && (
                      <div className="text-xs font-bold text-red-600 bg-red-50 p-2 rounded inline-block text-left max-w-[250px]">
                        <span className="block text-[9px] uppercase tracking-wider text-red-400 mb-0.5">Rejection Reason</span>
                        <span className="whitespace-normal leading-tight">{req.reason}</span>
                      </div>
                    )}
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