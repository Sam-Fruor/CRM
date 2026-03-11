// src/app/(dashboard)/sales/missing-docs/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MissingDocsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  // 1. Fetch leads for this branch
  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };
  const allLeads = await prisma.lead.findMany({
    where: branchCondition,
    orderBy: { updatedAt: "desc" }, // Show most recently updated first
  });

  // 2. Smart Filter: Find active leads with missing documents
  const missingDocsQueue = allLeads.map(lead => {
    const docs = (lead.documentStatus as any) || {};
    const missing = [];
    
    // Check our core 5 requirements
    if (!docs.resumeUploaded) missing.push("CV/Resume");
    if (!docs.dlUploaded) missing.push("Driving Licence");
    if (!docs.residentIdUploaded) missing.push("Resident ID");
    if (!docs.passportUploaded) missing.push("Passport");
    if (!docs.videoUploaded) missing.push("Driving Video");

    return { ...lead, missingList: missing };
  }).filter(lead => 
    lead.missingList.length > 0 && 
    !["Not Interested", "Not Eligible"].includes(lead.feedbackStatus || "") &&
    lead.caseStatus === "Stage 1 Under Process"
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Missing Documents Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Active clients who are missing required paperwork. Chase these up to proceed!
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
          {missingDocsQueue.length} Action Items
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Client Name</th>
                <th className="p-4 font-semibold">Contact Details</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Currently Missing</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {missingDocsQueue.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
                    <h3 className="text-slate-800 font-bold text-lg">All caught up!</h3>
                    <p className="text-slate-500 mt-1">Every active client has all their documents uploaded.</p>
                  </td>
                </tr>
              ) : (
                missingDocsQueue.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ID: {lead.id.slice(-6).toUpperCase()}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-slate-700">📞 {lead.callingNumber}</p>
                      {lead.whatsappNumber && (
                        <p className="text-xs text-green-600 font-medium mt-0.5">💬 WhatsApp: {lead.whatsappNumber}</p>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                        lead.feedbackStatus === 'Converted' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {lead.feedbackStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5">
                        {lead.missingList.map(doc => (
                          <span key={doc} className="bg-red-50 border border-red-100 text-red-600 px-2 py-0.5 rounded text-xs font-semibold">
                            {doc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link 
                        href={`/sales/${lead.id}/edit`}
                        className="text-white bg-slate-800 hover:bg-slate-700 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                      >
                        Upload Docs
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