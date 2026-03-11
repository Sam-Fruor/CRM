// src/app/(dashboard)/examiner/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import GradeForm from "./GradeForm";

export default async function GradingSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!lead) redirect("/examiner");

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      <div className="flex items-center gap-4 mb-6">
        <Link href="/examiner" className="text-slate-400 hover:text-purple-600 transition-colors">
          ← Back to Queue
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Official Grading Sheet</h1>
      </div>

      {/* READ-ONLY CLIENT INFO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Candidate Profile</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div><p className="text-xs text-slate-500 mb-1">Full Name</p><p className="font-bold text-slate-800">{lead.givenName} {lead.surname}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Category</p><p className="font-bold text-slate-800">{lead.category}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Nationality</p><p className="font-bold text-slate-800">{lead.nationality}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Passport No.</p><p className="font-bold text-slate-800">{lead.passportNum || "Not Provided"}</p></div>
          <div><p className="text-xs text-slate-500 mb-1">GCC Exp</p><p className="font-bold text-slate-800">{lead.experienceGCC || 0} Years</p></div>
          <div><p className="text-xs text-slate-500 mb-1">Test Date</p><p className="font-bold text-purple-600">{lead.testDate ? new Date(lead.testDate).toLocaleDateString() : "N/A"}</p></div>
        </div>
      </div>

      {/* THE INTERACTIVE GRADING FORM */}
      <GradeForm lead={lead} />

    </div>
  );
}