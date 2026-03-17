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

  const evalsCount = lead.testEvaluations.length;
  let currentAttemptTarget = 1;
  let currentAttemptName = "Initial Test (Attempt 1)";

  let customPayments: any[] = [];
  try {
    if (lead.otherPayments) customPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse(lead.otherPayments as string);
  } catch (e) {}

  // 🛑 INJECT NO-SHOWS INTO CANDIDATE HISTORY
  let combinedHistory = lead.testEvaluations.map(t => ({ ...t, isMissed: false }));

  const resched1 = customPayments.find(p => p.isAutoReschedule && p.attempt === 1 && p.testDate);
  if (resched1 && lead.testDate) combinedHistory.push({ id: 'noshow-1', createdAt: new Date(lead.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);

  const resched2 = customPayments.find(p => p.isAutoReschedule && p.attempt === 2 && p.testDate);
  if (resched2 && lead.reTestDate) combinedHistory.push({ id: 'noshow-2', createdAt: new Date(lead.reTestDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);

  customPayments.filter(p => p.isAutoReschedule && p.attempt > 2 && p.testDate).forEach(resched => {
    const orig = customPayments.find(p => p.isAutoRetest && p.attempt === resched.attempt);
    if (orig && orig.testDate) combinedHistory.push({ id: `noshow-${resched.attempt}`, createdAt: new Date(orig.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  });

  // Sort candidate history
  combinedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Detect Attempt Number
  const attempt3Plus = customPayments.filter(p => p.isAutoRetest && p.testDate);
  if (attempt3Plus.length > 0) {
    const highestAttempt = Math.max(...attempt3Plus.map(p => p.attempt));
    currentAttemptTarget = highestAttempt;
    currentAttemptName = `Re-Test (Attempt ${highestAttempt})`;
  } else if (lead.reTestDate) {
    currentAttemptTarget = 2;
    currentAttemptName = "Re-Test (Attempt 2)";
  } else if (lead.testDate) {
    currentAttemptTarget = 1;
    currentAttemptName = "Initial Test (Attempt 1)";
  }

  const activeReschedules = customPayments.filter(p => p.isAutoReschedule && p.attempt === currentAttemptTarget && p.testDate);
  if (activeReschedules.length > 0) currentAttemptName += " - Rescheduled";

  const isEditMode = evalsCount >= currentAttemptTarget;

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
          
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Candidate Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><p className={labelStyle}>Full Name</p><p className={valueStyle}>{lead.givenName} {lead.surname}</p></div>
              <div><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality}</p></div>
              <div><p className={labelStyle}>Date of Birth</p><p className={valueStyle}>{lead.dob ? new Date(lead.dob).toLocaleDateString("en-GB") : "N/A"}</p></div>
              <div><p className={labelStyle}>Phone</p><p className={valueStyle}>{lead.callingNumber}</p></div>
              <div><p className={labelStyle}>Home Exp (Yrs)</p><p className={valueStyle}>{lead.experienceHome || "0"}</p></div>
              <div><p className={labelStyle}>GCC Exp (Yrs)</p><p className={valueStyle}>{lead.experienceGCC || "0"}</p></div>
            </div>
          </div>

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
            
            {combinedHistory.length === 0 ? (
              <p className="text-sm text-slate-400 italic">This is the candidate's first test attempt.</p>
            ) : (
              <div className="space-y-4">
                {combinedHistory.map((test: any, index: number) => (
                  <div key={test.id} className={`p-4 rounded-lg border ${test.isMissed ? 'bg-orange-900/30 border-orange-800/50' : 'bg-slate-700/50 border-slate-600'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full border ${
                        test.isMissed ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                        test.status === "Approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                      }`}>
                        {test.status}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(test.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>

                    <div className={`grid grid-cols-2 gap-4 mb-3 text-sm p-3 rounded border ${test.isMissed ? 'bg-orange-950/40 border-orange-800/30' : 'bg-slate-800/50 border-slate-600'}`}>
                      <div>
                        <p className={`text-xs uppercase ${test.isMissed ? 'text-orange-500/70' : 'text-slate-400'}`}>English</p>
                        <p className={`font-bold ${test.isMissed ? 'text-orange-400' : 'text-white'}`}>
                          {test.englishScore !== "-" ? `${test.englishScore}/10` : "-"} <span className={`font-normal ${test.isMissed ? 'text-orange-500' : 'text-slate-400'}`}>({test.englishTestResult})</span>
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs uppercase ${test.isMissed ? 'text-orange-500/70' : 'text-slate-400'}`}>Driving</p>
                        <p className={`font-bold ${test.isMissed ? 'text-orange-400' : 'text-white'}`}>
                          {test.drivingScore !== "-" ? `${test.drivingScore}/10` : "-"} <span className={`font-normal ${test.isMissed ? 'text-orange-500' : 'text-slate-400'}`}>({test.yardTestResult})</span>
                        </p>
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
          <GradeForm lead={lead} attemptName={currentAttemptName} isEditMode={isEditMode} />
        </div>

      </div>
    </div>
  );
}