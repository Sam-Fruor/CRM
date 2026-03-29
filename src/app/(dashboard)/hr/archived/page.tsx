// src/app/(dashboard)/hr/archived/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const Icons = {
  BadgeCheck: () => (
    <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  Search: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
};

export default async function HRArchivedLeads() {
  const session = await getServerSession(authOptions);
  
  if (!session || !["HR", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // Fetch only leads that have been officially archived / transferred out
  const archivedLeads = await prisma.lead.findMany({
    where: {
      caseStatus: "Transferred to Examiner"
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 border border-slate-200">
            <Icons.BadgeCheck />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Archived Files</h1>
            <p className="text-slate-500 font-medium text-sm mt-1">Read-only files that have been officially transferred to the Examiner.</p>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Total Archived</p>
          <p className="text-xl font-black text-slate-900 text-center leading-none mt-1">{archivedLeads.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider font-bold text-slate-500">
                <th className="p-5 pl-6">ID & Name</th>
                <th className="p-5">Category</th>
                <th className="p-5">Transfer Date</th>
                <th className="p-5 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {archivedLeads.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Icons.Search />
                      <p className="mt-3 font-medium text-sm">No archived files found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                archivedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-5 pl-6">
                      <p className="font-bold text-slate-900">{lead.givenName} {lead.surname}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">ID: {lead.id.slice(-6)}</p>
                    </td>
                    <td className="p-5 font-medium text-slate-600 text-sm">
                      {lead.category}
                    </td>
                    <td className="p-5 text-xs font-bold text-slate-500">
                      {new Date(lead.updatedAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-5 pr-6 text-right">
                      <Link 
                        href={`/hr/${lead.id}`} 
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors border border-slate-200"
                      >
                        <Icons.Eye /> View
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