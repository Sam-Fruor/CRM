// src/app/(dashboard)/examiner/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import GradeForm from "./GradeForm";

export default async function ExaminerProfileView({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session || !["EXAMINER", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  
  // Fetch the lead AND their complete testing history
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: {
      testEvaluations: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!lead) redirect("/examiner");

  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";
  const labelStyle = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";
  const valueStyle = "text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100";

  return (
    <div className="max-w-7xl mx-auto pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Candidate: {lead.givenName} {lead.surname}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            ID: <span className="font-bold text-slate-700">{lead.id.slice(-6).toUpperCase()}</span> | 
            Category: <span className="font-bold text-blue-600 ml-1">{lead.category}</span>
          </p>
        </div>
        <Link 
          href="/examiner"
          className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          Back to Queue
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: READ-ONLY DATA */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Candidate Details */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Candidate Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className={labelStyle}>Full Name</p><p className={valueStyle}>{lead.givenName} {lead.surname}</p></div>
              <div><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality}</p></div>
              <div><p className={labelStyle}>Date of Birth</p><p className={valueStyle}>{lead.dob ? new Date(lead.dob).toLocaleDateString() : "N/A"}</p></div>
              <div><p className={labelStyle}>Phone</p><p className={valueStyle}>{lead.callingNumber}</p></div>
              <div><p className={labelStyle}>Home Exp (Yrs)</p><p className={valueStyle}>{lead.experienceHome || "0"}</p></div>
              <div><p className={labelStyle}>GCC Exp (Yrs)</p><p className={valueStyle}>{lead.experienceGCC || "0"}</p></div>
            </div>
          </div>

          {/* Documents & IDs */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Provided Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className={labelStyle}>Passport Number</p>
                <p className={valueStyle}>{lead.passportNum || "Not Provided"}</p>
              </div>
              <div>
                <p className={labelStyle}>Driving License Number</p>
                <p className={valueStyle}>{lead.dlNumber || "Not Provided"}</p>
              </div>
            </div>
          </div>

          {/* 🛑 TEST ATTEMPT HISTORY */}
          <div className="bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-700 mb-6 text-white">
            <h2 className="text-lg font-bold border-b border-slate-600 pb-3 mb-4 flex items-center gap-2">
              📋 Past Evaluation History
            </h2>
            
            {lead.testEvaluations.length === 0 ? (
              <p className="text-sm text-slate-400 italic">This is the candidate's first test attempt.</p>
            ) : (
              <div className="space-y-4">
                {lead.testEvaluations.map((test) => (
                  <div key={test.id} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                        test.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {test.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm bg-slate-800/50 p-3 rounded border border-slate-600">
                      <div>
                        <p className="text-slate-400 text-xs uppercase">English</p>
                        <p className="font-bold">{test.englishScore}/10 <span className="text-slate-400 font-normal">({test.englishTestResult})</span></p>
                      </div>
                      <div>
                        <p className="text-slate-400 text-xs uppercase">Driving</p>
                        <p className="font-bold">{test.drivingScore}/10 <span className="text-slate-400 font-normal">({test.yardTestResult})</span></p>
                      </div>
                    </div>

                    {test.remarks && (
                      <p className="text-sm text-slate-300">
                        <span className="font-semibold text-slate-400">Remarks:</span> {test.remarks}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: GRADING FORM */}
        <div className="lg:col-span-1">
          {/* 👇 This is the fix! Passing the whole lead object. */}
          <GradeForm lead={lead} />
        </div>

      </div>
    </div>
  );
}