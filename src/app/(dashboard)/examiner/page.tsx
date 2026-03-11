// src/app/(dashboard)/examiner/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ExaminerDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !["EXAMINER", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  // Fetch ALL leads that have a test date scheduled, regardless of Branch
  const testQueue = await prisma.lead.findMany({
    where: {
      testDate: { not: null },
    },
    orderBy: { testDate: "asc" },
  });

  const pendingTests = testQueue.filter(l => l.examinerStatus === null || l.examinerStatus === "Pending");
  const completedTests = testQueue.filter(l => l.examinerStatus === "Approved" || l.examinerStatus === "Denied");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="bg-slate-900 p-8 rounded-xl shadow-md text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Examiner Master Queue</h1>
          <p className="text-slate-400 text-sm mt-1">Review upcoming tests broadcasted from all branches.</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-purple-400">{pendingTests.length}</p>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">Pending Tests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h2 className="font-bold text-slate-800">Upcoming Scheduled Tests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider">
                <th className="p-4 font-semibold">Test Date</th>
                <th className="p-4 font-semibold">Client Details</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingTests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No tests are currently scheduled.</td>
                </tr>
              ) : (
                pendingTests.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <span className="font-bold text-slate-800">
                        {new Date(lead.testDate!).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                      <p className="text-xs text-slate-500">Passport: {lead.passportNum || "N/A"}</p>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-700">
                      {lead.category === 'Others' ? lead.categoryOther : lead.category}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">
                        {lead.branch.replace("BRANCH_", "Branch ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/examiner/${lead.id}`}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
                      >
                        Enter Scores
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}