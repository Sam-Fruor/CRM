// src/app/(dashboard)/hr/verification/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HRVerificationQueue() {
  const session = await getServerSession(authOptions);

  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // 🛡️ SECURITY: Branch Isolation Filter
  // If they are MASTER/ADMIN, they see all. Otherwise, lock to their specific branch.
  const branchFilter = session.user.branch === "MASTER" 
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
  
  // Fetch the queue WITH the branch filter applied
  const hrQueue = await prisma.lead.findMany({
    where: { 
      caseStatus: { in: parallelStage2Statuses },
      ...branchFilter // 👈 INJECTS THE SECURITY RULE HERE
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">HR Verification Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Files waiting for your review. 
            <span className="font-bold text-blue-600 ml-1">
              ({session.user.branch === "MASTER" ? "All Branches" : session.user.branch.replace("_", " ")})
            </span>
          </p>
        </div>
        <span className="text-sm font-bold bg-blue-100 text-blue-700 px-4 py-2 rounded-lg">
          {hrQueue.length} Active Files
        </span>
      </div>

      {/* THE QUEUE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Candidate</th>
                <th className="p-4 font-semibold">Category</th>
                {session.user.branch === "MASTER" && <th className="p-4 font-semibold">Branch</th>}
                <th className="p-4 font-semibold">Current Case Status</th>
                <th className="p-4 font-semibold">Last Updated</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hrQueue.length === 0 ? (
                <tr>
                  <td colSpan={session.user.branch === "MASTER" ? 6 : 5} className="p-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-5xl mb-4">🛡️</span>
                      <h3 className="text-slate-700 font-bold text-xl">Queue is Clear!</h3>
                      <p className="text-slate-500 mt-2">No files currently require HR verification for your branch.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                hrQueue.map((lead) => {
                  let badgeColor = "bg-slate-100 text-slate-700";
                  if (lead.caseStatus.includes("Payment") || lead.caseStatus.includes("Collect") || lead.caseStatus.includes("Fees")) {
                    badgeColor = "bg-emerald-100 text-emerald-700"; 
                  } else if (lead.caseStatus.includes("Pending") || lead.caseStatus.includes("Process") || lead.caseStatus.includes("Waiting")) {
                    badgeColor = "bg-blue-100 text-blue-700"; 
                  } else if (lead.caseStatus.includes("Visa")) {
                    badgeColor = "bg-purple-100 text-purple-700"; 
                  }

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
                      <td className="p-4 text-sm text-slate-500 font-medium">
                        {new Date(lead.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Link 
                          href={`/hr/${lead.id}?tab=details`}
                          className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 text-sm font-bold rounded-lg shadow-sm transition-colors inline-block"
                        >
                          Verify & Process
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