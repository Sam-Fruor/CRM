// src/app/(dashboard)/examiner/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import GradeForm from "./GradeForm";

// --- ENTERPRISE ICONS ---
const Icons = {
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  User: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  MapPin: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Phone: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  WhatsApp: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.016-.967-.259-.099-.447-.149-.635.149-.188.297-.755.967-.924 1.166-.17.198-.34.223-.637.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.652-2.059-.17-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.635-1.534-.87-2.1-.228-.548-.46-.474-.635-.482-.17-.008-.364-.009-.563-.009-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  Mail: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Folder: () => <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  History: () => <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Check: () => <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Alert: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
};

// --- HELPER FORMATTING FUNCTIONS ---
const formatDisplayDate = (dateString?: string | null | Date) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
};

// 🚀 STRICT SERVER SIDE DOCUMENT PARSER (Exact Match Logic from Sales)
const getDocumentUrl = (filesObj: any, expectedType: string) => {
  if (!filesObj) return null;
  
  let parsedFiles = filesObj;
  if (typeof parsedFiles === 'string') { 
    try { parsedFiles = JSON.parse(parsedFiles); } catch(e) { parsedFiles = {}; } 
  }
  if (typeof parsedFiles === 'string') { 
    try { parsedFiles = JSON.parse(parsedFiles); } catch(e) { parsedFiles = {}; } 
  }

  // Convert the JSON object map to a simple array
  const filesArray = Array.isArray(parsedFiles) ? parsedFiles : Object.values(parsedFiles);
  
  // EXACT match against the documentType strings saved by the Document Vault
  const matchingFiles = filesArray.filter((f: any) => f?.documentType === expectedType);
  
  if (matchingFiles.length > 0) {
    // Return the URL of the most recently uploaded file of this type
    return matchingFiles[matchingFiles.length - 1].url;
  }
  
  return null;
};


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

  // Parse document status flags to match Sales exactly
  let docsStatus = lead.documentStatus as Record<string, boolean> || {};
  if (typeof docsStatus === 'string') {
    try { docsStatus = JSON.parse(docsStatus); } catch(e) { docsStatus = {}; }
  }

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

  // --- REUSABLE UI COMPONENTS ---
  const sectionStyle = "bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/80 mb-6";
  const labelStyle = "text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block";
  const valueStyle = "text-sm font-semibold text-slate-900 bg-slate-50/80 px-4 py-3 rounded-xl border border-slate-100 min-h-[44px] flex items-center";

  const DataField = ({ label, value }: { label: string, value: string | number | null | undefined }) => (
    <div>
      <p className={labelStyle}>{label}</p>
      <div className={valueStyle}>{value || "—"}</div>
    </div>
  );

  const DocRow = ({ title, docType, isUploadedFlag }: { title: string, docType: string, isUploadedFlag?: boolean }) => {
    // 🚀 STIRCT MATCH ONLY!
    const url = getDocumentUrl(lead.documentFiles, docType);
    
    // Logic: If there is a URL, it is 100% real. If no URL but flag is true, it is a "Ghost" file (error from Sales)
    const isActuallyUploaded = !!url;
    const isGhost = !url && !!isUploadedFlag;

    return (
      <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-purple-200 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-sm ${
            isActuallyUploaded ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 
            isGhost ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-white border-slate-200 text-slate-400'
          }`}>
            {isActuallyUploaded ? <Icons.Check /> : isGhost ? <Icons.Alert /> : <Icons.Cross />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{title}</p>
            <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
              isActuallyUploaded ? 'text-emerald-600' : isGhost ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {isActuallyUploaded ? "Uploaded" : isGhost ? "No File Attached" : "Missing"}
            </p>
          </div>
        </div>
        {url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Icons.Eye /> View
          </a>
        ) : (
          <button disabled className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 text-xs font-bold rounded-lg cursor-not-allowed border border-slate-200">
            <Icons.Eye /> {isGhost ? "Empty" : "Missing"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-16 pt-4 px-4 sm:px-6 lg:px-8">
      
      {/* 🚀 ENTERPRISE HEADER */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-600"></div>
        
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-100 tracking-wider uppercase shadow-sm">
              ID: {lead.id.slice(-6)}
            </span>
            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-md border border-blue-100 tracking-wider uppercase shadow-sm">
              {lead.category}
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border tracking-wider uppercase shadow-sm ${lead.examinerStatus === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
               Status: {lead.examinerStatus || "Pending Evaluation"}
            </span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {lead.givenName} {lead.surname}
          </h1>
        </div>

        <Link 
          href="/examiner"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm shrink-0 active:scale-95"
        >
          <Icons.ArrowLeft /> Back to Roster
        </Link>
      </div>

      {/* 🚀 TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ⬅️ LEFT COLUMN: READ-ONLY CONTEXT (8 Columns) */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* 1. ROUTING INFORMATION */}
          <div className={sectionStyle}>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <span className="text-purple-600 font-black bg-purple-50 w-6 h-6 flex items-center justify-center rounded text-xs">1</span> 
              Routing Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DataField label="Lead Source" value={lead.leadSource} />
              <DataField label="Category" value={lead.category} />
              <DataField label="Preferred Country" value={lead.countryPreferred} />
              <DataField label="Slot Booking Date" value={formatDisplayDate(lead.slotBookingDate)} />
              <DataField label="Test Date" value={formatDisplayDate(lead.testDate)} />
            </div>
          </div>

          {/* 2. CLIENT INFORMATION */}
          <div className={sectionStyle}>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <span className="text-purple-600 font-black bg-purple-50 w-6 h-6 flex items-center justify-center rounded text-xs">2</span> 
              Client Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DataField label="Full Name" value={`${lead.givenName} ${lead.surname}`} />
              <DataField label="Father's Name" value={lead.fatherName} />
              <DataField label="Date of Birth" value={formatDisplayDate(lead.dob)} />
              
              <div>
                <p className={labelStyle}>Phone</p>
                <div className={`${valueStyle} flex items-center gap-2`}>
                  <span className="text-slate-400"><Icons.Phone /></span>
                  {lead.callingNumber || "—"}
                </div>
              </div>
              
              <div>
                <p className={labelStyle}>WhatsApp</p>
                <div className={`${valueStyle} flex items-center gap-2`}>
                  <span className="text-emerald-500"><Icons.WhatsApp /></span>
                  {lead.whatsappNumber || "—"}
                </div>
              </div>
              
              <div>
                <p className={labelStyle}>Email</p>
                <div className={`${valueStyle} flex items-center gap-2 truncate`}>
                  <span className="text-slate-400"><Icons.Mail /></span>
                  {lead.email || "—"}
                </div>
              </div>
              
              <div className="md:col-span-3">
                <DataField label="Nationality" value={lead.nationality} />
              </div>
            </div>
          </div>

          {/* 3. EXPERIENCE & AGENCY HISTORY */}
          <div className={sectionStyle}>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <span className="text-purple-600 font-black bg-purple-50 w-6 h-6 flex items-center justify-center rounded text-xs">3</span> 
              Experience & Agency History
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              <DataField label="Home Exp" value={lead.experienceHome ? `${lead.experienceHome} Years` : "—"} />
              <DataField label="GCC Exp" value={lead.experienceGCC ? `${lead.experienceGCC} Years` : "—"} />
              <DataField label="Previous Agency" value={lead.previousAgency} />
              <DataField label="Prev. Country" value={lead.previousCountry} />
            </div>
          </div>

          {/* 4. DOCUMENTS VAULT */}
          <div className={sectionStyle}>
            <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
              <span className="text-purple-600"><Icons.Folder /></span> 
              Candidate Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocRow title="CV / RESUME" docType="CV / Resume" isUploadedFlag={docsStatus.resumeUploaded} />
              <DocRow title="PASSPORT" docType="Passport" isUploadedFlag={docsStatus.passportUploaded} />
              <DocRow title="DRIVING LICENCE" docType="Driving License" isUploadedFlag={docsStatus.dlUploaded} />
              <DocRow title="RESIDENT ID" docType="Emirates ID" isUploadedFlag={docsStatus.residentIdUploaded} />
            </div>
          </div>

          {/* 🛑 TEST ATTEMPT HISTORY (DARK MODE AUDIT TRAIL) */}
          <div className="bg-slate-900 p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800 text-white relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-10 -mr-10 -mt-10 pointer-events-none"></div>

            <h2 className="text-lg font-bold border-b border-slate-700/80 pb-4 mb-6 flex items-center gap-3 relative z-10">
              <span className="p-2 bg-slate-800 rounded-lg text-slate-400"><Icons.History /></span>
              Past Evaluation History
            </h2>
            
            <div className="relative z-10">
              {combinedHistory.length === 0 ? (
                <div className="text-center py-10 bg-slate-800/30 rounded-xl border border-slate-700/50">
                  <p className="text-sm font-medium text-slate-400">This is the candidate's first test attempt.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {combinedHistory.map((test: any, index: number) => (
                    <div key={test.id} className={`p-5 rounded-xl border ${test.isMissed ? 'bg-orange-950/40 border-orange-900/50' : 'bg-slate-800/80 border-slate-700'}`}>
                      
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 text-[10px] uppercase font-black tracking-wider rounded-md border shadow-sm ${
                            test.isMissed ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                            test.status === "Approved" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          }`}>
                            {test.status}
                          </span>
                          <span className="text-sm font-bold text-slate-300">
                            {test.attemptLabel}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 font-bold bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700/50">
                          {new Date(test.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      <div className={`grid grid-cols-2 gap-4 mb-4 p-4 rounded-lg border ${test.isMissed ? 'bg-orange-950/60 border-orange-900/50' : 'bg-slate-900/50 border-slate-700'}`}>
                        <div>
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${test.isMissed ? 'text-orange-600' : 'text-slate-500'}`}>English</p>
                          <p className={`text-2xl font-black ${test.isMissed ? 'text-orange-400' : 'text-white'}`}>
                            {test.englishScore !== "-" ? `${test.englishScore}` : "-"}
                            <span className="text-sm font-medium text-slate-500 ml-1">/10</span>
                          </p>
                          <p className={`text-xs font-bold mt-1 ${test.isMissed ? 'text-orange-500' : 'text-slate-400'}`}>{test.englishTestResult}</p>
                        </div>
                        <div className="border-l border-slate-700 pl-4">
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${test.isMissed ? 'text-orange-600' : 'text-slate-500'}`}>Driving</p>
                          <p className={`text-2xl font-black ${test.isMissed ? 'text-orange-400' : 'text-white'}`}>
                            {test.drivingScore !== "-" ? `${test.drivingScore}` : "-"}
                            <span className="text-sm font-medium text-slate-500 ml-1">/10</span>
                          </p>
                          <p className={`text-xs font-bold mt-1 ${test.isMissed ? 'text-orange-500' : 'text-slate-400'}`}>{test.yardTestResult}</p>
                        </div>
                      </div>

                      {test.remarks && (
                        <div className="bg-slate-900/30 p-4 rounded-lg border border-slate-700/50">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Examiner Remarks</p>
                          <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap">{test.remarks}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ➡️ RIGHT COLUMN: ACTIVE GRADING FORM (4 Columns) */}
        <div className="xl:col-span-4">
          <GradeForm lead={lead} attemptName={currentAttemptName} isEditMode={isEditMode} />
        </div>

      </div>
    </div>
  );
}