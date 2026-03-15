// src/app/(dashboard)/operations/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OperationsDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // 🛡️ Branch Isolation
  const branchFilter =
    session.user.branch === "MASTER"
      ? {}
      : { branch: session.user.branch as any };

  const parallelStage2Statuses = [
    "Stage 2 (Ops & HR)",
    "Stage 2 Under Process",
    "Stage 2: Ops - Welcome & Docs",
    "Stage 2: HR - Waiting for Job Offer",
    "Stage 2: Ops - Collect Job Offer Payment",
    "Stage 2: HR - Waiting for Work Permit",
    "Stage 2: Ops - Collect WP Payment",
    "Job Offer Letter Pending",
    "Signed Job Offer Letter Pending",
    "Pending Payment 1 (Service Agreement)",
    "Pending Payment 2 (Job Offer Letter)",
    "Work Permit Under Process",
    "Signed Work Permit Pending",
    "Pending Payment 3 (Work Permit)",
    "Pending Payment 4 (Insurance)",
    "Visa Appointment Pending",
    "Visa Status Under process",
    "School Fees Pending",
    "Flight Ticket Pending"
  ];

  // 📥 Operations Queue
  const opsQueue = await prisma.lead.findMany({
    where: {
      caseStatus: { in: parallelStage2Statuses },
      ...branchFilter
    },
    orderBy: { updatedAt: "desc" }
  });

  // 🚨 RED ZONE - Expiring Documents
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  const expiringDocs = await prisma.lead.findMany({
    where: {
      caseStatus: { in: parallelStage2Statuses },
      ...branchFilter,
      OR: [
        { passportExpiry: { lte: sixtyDaysFromNow, gte: new Date() } },
        { residentIdExp: { lte: sixtyDaysFromNow, gte: new Date() } }
      ]
    },
    select: {
      id: true,
      givenName: true,
      surname: true,
      passportExpiry: true,
      residentIdExp: true
    }
  });

  // 📊 Metrics
  const totalInQueue = opsQueue.length;
  const welcomeEmailsPending = opsQueue.filter(
    (l) => l.caseStatus === "Stage 2: Ops - Welcome & Docs"
  ).length;

  const paymentsToCollect = opsQueue.filter(
    (l) => l.caseStatus.includes("Collect") || l.caseStatus.includes("Payment")
  ).length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">

      {/* HEADER */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Operations Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Process welcome emails, track client arrivals, and collect payments.
            <span className="font-bold text-indigo-600 ml-1">
              ({session.user.branch === "MASTER"
                ? "All Branches"
                : session.user.branch.replace("_", " ")})
            </span>
          </p>
        </div>
      </div>

      {/* 🚨 RED ZONE */}
      {expiringDocs.length > 0 && (
        <div className="bg-red-50 border-2 border-red-500 p-5 rounded-xl shadow-sm">
          <h2 className="text-red-800 font-bold text-lg flex items-center gap-2 mb-3">
            ⚠️ URGENT: Expiring Documents ({expiringDocs.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringDocs.map((doc) => (
              <Link
                key={doc.id}
                href={`/operations/${doc.id}?tab=details`}
                className="bg-white p-3 rounded-lg border border-red-200 shadow-sm hover:border-red-400 transition-colors"
              >
                <p className="font-bold text-slate-800">
                  {doc.givenName} {doc.surname}
                </p>

                {doc.passportExpiry &&
                  new Date(doc.passportExpiry) <= sixtyDaysFromNow && (
                    <p className="text-xs text-red-600 font-bold mt-1">
                      Passport Exp:{" "}
                      {new Date(doc.passportExpiry).toLocaleDateString()}
                    </p>
                  )}

                {doc.residentIdExp &&
                  new Date(doc.residentIdExp) <= sixtyDaysFromNow && (
                    <p className="text-xs text-orange-600 font-bold mt-1">
                      ID Exp:{" "}
                      {new Date(doc.residentIdExp).toLocaleDateString()}
                    </p>
                  )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-slate-800">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Total Ops Queue
          </h3>
          <p className="text-3xl font-black text-slate-800 mt-2">
            {totalInQueue}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Welcome Emails to Send
          </h3>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {welcomeEmailsPending}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
            Payments to Collect
          </h3>
          <p className="text-3xl font-bold text-emerald-600 mt-2">
            {paymentsToCollect}
          </p>
        </div>
      </div>

       {/* OPS ACTION BOARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            ⚡ Operations Action Required
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-white">
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Category</th>
                {session.user.branch === "MASTER" && <th className="p-4 font-semibold">Branch</th>}
                <th className="p-4 font-semibold">Current Ops Task</th>
                <th className="p-4 font-semibold">Amounts Due</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opsQueue.length === 0 ? (
                <tr>
                  <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-5xl mb-4">🚀</span>
                      <h3 className="text-slate-700 font-bold text-xl">Queue is Empty!</h3>
                      <p className="text-slate-500 mt-2">No files currently require Operations processing for your branch.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                opsQueue.map((lead) => {
                  let badgeColor = "bg-slate-100 text-slate-700";
                  if (lead.caseStatus === "Stage 2: Ops - Welcome & Docs") {
                    badgeColor = "bg-indigo-100 text-indigo-700";
                  } else if (lead.caseStatus.includes("Collect") || lead.caseStatus.includes("Payment")) {
                    badgeColor = "bg-emerald-100 text-emerald-700";
                  }

                  const pendingTotal = 
                    (lead.serviceAgreementPending || 0) + 
                    (lead.jobOfferPending || 0) + 
                    (lead.workPermitPending || 0) + 
                    (lead.insurancePending || 0) + 
                    (lead.schoolFeesPending || 0) + 
                    (lead.flightTicketPending || 0);

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50 transition-colors bg-white">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                        <p className="text-xs text-slate-500 mt-0.5">ID: {lead.id.slice(-6).toUpperCase()}</p>
                      </td>
                      <td className="p-4 font-medium text-slate-600 text-sm">
                        {lead.category}
                      </td>
                      {/* Show Branch label if logged in as Admin/Master */}
                      {session.user.branch === "MASTER" && (
                        <td className="p-4">
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-500">
                            {lead.branch.replace("BRANCH_", "")}
                          </span>
                        </td>
                      )}
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${badgeColor}`}>
                          {lead.caseStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        {pendingTotal > 0 ? (
                          <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-100">
                            ${pendingTotal} Due
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm font-medium">Cleared</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/operations/${lead.id}?tab=details`}
                          className="px-5 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 text-sm font-bold rounded-lg shadow-sm transition-colors"
                        >
                          Process File
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

    </div>
  );
}