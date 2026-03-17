// src/app/(dashboard)/hr/[id]/ViewLead.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateHRFile } from "@/app/actions/hrActions";
import DocumentVault from "@/components/DocumentVault";
import ActivityTimeline from "@/components/ActivityTimeline";

export default function HRViewLead({ lead, activeTab }: { lead: any, activeTab: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  
  // 🧠 State for Quick Routing Buttons
  const [currentRoute, setCurrentRoute] = useState(lead.caseStatus);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateHRFile(lead.id, formData);
      alert("✅ HR Processing Data Updated Successfully!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update file.");
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";
  const headerStyle = "text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex justify-between items-center";
  const labelStyle = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";
  const valueStyle = "text-sm font-semibold text-slate-800";
  const readOnlyGridValue = "text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100";
  
  const inputLabelStyle = "block text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1.5";
  const inputStyle = "w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-sm";

  const docs = lead.documentStatus || {};
  const formatDate = (dateString: string) => dateString ? new Date(dateString).toISOString().split('T')[0] : "";
  const formatDisplayDate = (dateString: string) => dateString ? new Date(dateString).toLocaleDateString("en-GB") : "N/A";

  const caseStatuses = [
    "Not Interested/Dropped Off", "Client Not Enrolled", "Pending Payment 1 (Service Agreement)", 
    "Stage 1 Under Process", "Stage 2 Under Process", "Stage 2 (Ops & HR)",
    "Stage 2: HR - Waiting for Job Offer", "Stage 2: HR - Waiting for Work Permit",
    "Stage 2: Ops - Welcome & Docs", "Stage 2: Ops - Collect Job Offer Payment", "Stage 2: Ops - Collect WP Payment",
    "Job Offer Letter Pending", "Signed Job Offer Letter Pending", "Pending Payment 2 (Job Offer Letter)", 
    "Work Permit Under Process", "Signed Work Permit Pending", "Pending Payment 3 (Work Permit)", 
    "Pending Payment 4 (Insurance)", "Visa Appointment Pending", "Visa Status Under process", 
    "Visa Approved", "Visa Rejected", "School Fees Pending", "Flight Ticket Pending"
  ];

  const renderVerifyBadge = (status: string) => {
    if (status === "Approved") return <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">✅ Verified</span>;
    if (status === "Pending") return <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-200">⏳ Pending</span>;
    if (status === "Rejected") return <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200">❌ Rejected</span>;
    return <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full border border-slate-200">Unsubmitted</span>;
  };

  const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : [];
  let combinedHistory = (lead.testEvaluations || []).map((t: any) => ({ ...t, isMissed: false }));

  const resched1 = otherPayments.find(p => p.isAutoReschedule && p.attempt === 1 && p.testDate);
  if (resched1 && lead.testDate) combinedHistory.push({ id: 'noshow-1', createdAt: new Date(lead.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);

  const resched2 = otherPayments.find(p => p.isAutoReschedule && p.attempt === 2 && p.testDate);
  if (resched2 && lead.reTestDate) combinedHistory.push({ id: 'noshow-2', createdAt: new Date(lead.reTestDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);

  otherPayments.filter(p => p.isAutoReschedule && p.attempt > 2 && p.testDate).forEach(resched => {
    const orig = otherPayments.find(p => p.isAutoRetest && p.attempt === resched.attempt);
    if (orig && orig.testDate) combinedHistory.push({ id: `noshow-${resched.attempt}`, createdAt: new Date(orig.testDate), englishScore: "-", drivingScore: "-", englishTestResult: "Absent", yardTestResult: "Absent", status: "No-Show", isMissed: true } as any);
  });

  combinedHistory.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  combinedHistory = combinedHistory.map((test, index) => ({ ...test, attemptLabel: `Attempt ${index + 1}` }));
  combinedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // ✅ FIXED: Pulling the Total Deal Amount correctly from serviceAgreementTotal!
  const totalDealAmount = parseFloat(lead.serviceAgreementTotal) || 0;
  const totalCollectedAmount = parseFloat(lead.serviceAgreementAmount) || 0;
  const remainingBalance = totalDealAmount - totalCollectedAmount;

  return (
    <div className="max-w-7xl mx-auto pb-10 relative">

      {/* 🗂️ QUICK VAULT MODAL */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-600">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 bg-slate-900 shrink-0">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <span>🗂️</span> Quick View: Document Vault
              </h2>
              <button 
                type="button" onClick={() => setIsVaultModalOpen(false)} 
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors font-bold"
              >✕</button>
            </div>
            <div className="overflow-y-auto p-4 flex-1 custom-scrollbar">
              <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-800">{lead.givenName} {lead.surname}</h1>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-full">
              ID: {lead.id.slice(-6).toUpperCase()}
            </span>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Category: <span className="text-slate-700 font-bold">{lead.category}</span> | Country: <span className="text-slate-700 font-bold">{lead.countryPreferred}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/hr/${lead.id}/edit`} className="px-5 py-2.5 rounded-lg font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm">
            ✏️ Edit Core Details
          </Link>
          <Link href="/hr/verification" className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors shadow-sm">
            Back to Queue
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2 mb-6">
        <Link 
          href={`/hr/${lead.id}?tab=details`}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          📋 HR Details & Financials
        </Link>
        <Link 
          href={`/hr/${lead.id}?tab=documents`}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          🗂️ Document Vault
          {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
              {Object.keys(lead.documentFiles).length}
            </span>
          )}
        </Link>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      {activeTab === "details" ? (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-6 pb-10">

                {/* HIDDEN INPUTS TO PRESERVE CORE DATA */}
                <input type="hidden" name="givenName" value={lead.givenName || ""} />
                <input type="hidden" name="surname" value={lead.surname || ""} />
                <input type="hidden" name="fatherName" value={lead.fatherName || ""} />
                <input type="hidden" name="dob" value={lead.dob ? new Date(lead.dob).toISOString() : ""} />
                <input type="hidden" name="nationality" value={lead.nationality || ""} />
                <input type="hidden" name="passportNum" value={lead.passportNum || ""} />
                <input type="hidden" name="residentIdNum" value={lead.residentIdNum || ""} />
                <input type="hidden" name="dlNumber" value={lead.dlNumber || ""} />
                <input type="hidden" name="callingNumber" value={lead.callingNumber || ""} />
                <input type="hidden" name="whatsappNumber" value={lead.whatsappNumber || ""} />
                <input type="hidden" name="email" value={lead.email || ""} />

                {/* ========================================== */}
                {/* 🔻 SALES CONTEXT (READ-ONLY) 🔻            */}
                {/* ========================================== */}

                <div className={cardStyle}>
                  <h2 className={headerStyle}>
                    <span>📍 1. Routing Information</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div><p className={labelStyle}>Lead Source</p><p className={valueStyle}>{lead.leadSource === "Others" ? lead.leadSourceOther : lead.leadSource}</p></div>
                    <div><p className={labelStyle}>Category</p><p className={valueStyle}>{lead.category === "Others" ? lead.categoryOther : lead.category}</p></div>
                    <div><p className={labelStyle}>Preferred Country</p><p className={valueStyle}>{lead.countryPreferred === "Others" ? lead.countryOther : lead.countryPreferred}</p></div>
                    <div><p className={labelStyle}>Slot Booking Date</p><p className={valueStyle}>{formatDisplayDate(lead.slotBookingDate)}</p></div>
                    <div><p className={labelStyle}>Test Date</p><p className={valueStyle}>{formatDisplayDate(lead.testDate)}</p></div>
                  </div>
                </div>

                <div className={cardStyle}>
                  <h2 className={headerStyle}>
                    <span>👤 2. Client Information</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div><p className={labelStyle}>Full Name</p><p className={valueStyle}>{lead.givenName} {lead.surname}</p></div>
                    <div><p className={labelStyle}>Father's Name</p><p className={valueStyle}>{lead.fatherName || "N/A"}</p></div>
                    <div><p className={labelStyle}>Date of Birth</p><p className={valueStyle}>{formatDisplayDate(lead.dob)}</p></div>
                    <div><p className={labelStyle}>Phone</p><p className={valueStyle}>{lead.callingNumber}</p></div>
                    <div><p className={labelStyle}>WhatsApp</p><p className={valueStyle}>{lead.whatsappNumber || "N/A"}</p></div>
                    <div><p className={labelStyle}>Email</p><p className={valueStyle}>{lead.email || "N/A"}</p></div>
                    <div className="md:col-span-3"><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality}</p></div>
                  </div>
                </div>

                <div className={cardStyle}>
                  <h2 className={headerStyle}>
                    <span>💼 3. Experience & Agency History</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className={labelStyle}>Home Exp</p><p className={valueStyle}>{lead.experienceHome || 0} Years</p></div>
                    <div><p className={labelStyle}>GCC Exp</p><p className={valueStyle}>{lead.experienceGCC || 0} Years</p></div>
                    <div><p className={labelStyle}>Previous Agency</p><p className={valueStyle}>{lead.previousAgency || "None"}</p></div>
                    <div><p className={labelStyle}>Prev. Country</p><p className={valueStyle}>{lead.previousCountry || "None"}</p></div>
                  </div>
                </div>

                <div className={cardStyle}>
                  <h2 className={headerStyle}>
                    <span>🗂️ 4. Documents & ID Details</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Vault Auto-Sync</span>
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <label className="font-bold text-slate-700 text-sm">1. CV / RESUME</label>
                      {docs.resumeUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                        <label className="font-bold text-slate-700 text-sm">2. DRIVING LICENCE</label>
                        {docs.dlUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                        <div><p className={labelStyle}>DL Number</p><p className={valueStyle}>{lead.dlNumber || "N/A"}</p></div>
                        <div><p className={labelStyle}>Issue Date</p><p className={valueStyle}>{formatDisplayDate(lead.dlIssueDate)}</p></div>
                        <div><p className={labelStyle}>Expiry Date</p><p className={valueStyle}>{formatDisplayDate(lead.dlExpiry)}</p></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                        <label className="font-bold text-slate-700 text-sm">3. RESIDENT ID</label>
                        {docs.residentIdUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                        <div><p className={labelStyle}>ID Number</p><p className={valueStyle}>{lead.residentIdNum || "N/A"}</p></div>
                        <div><p className={labelStyle}>Issue Date</p><p className={valueStyle}>{formatDisplayDate(lead.residentIdIssueDate)}</p></div>
                        <div><p className={labelStyle}>Expiry Date</p><p className={valueStyle}>{formatDisplayDate(lead.residentIdExp)}</p></div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                        <label className="font-bold text-slate-700 text-sm">4. PASSPORT</label>
                        {docs.passportUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                        <div><p className={labelStyle}>Passport Number</p><p className={valueStyle}>{lead.passportNum || "N/A"}</p></div>
                        <div><p className={labelStyle}>Issue Date</p><p className={valueStyle}>{formatDisplayDate(lead.passportIssueDate)}</p></div>
                        <div><p className={labelStyle}>Expiry Date</p><p className={valueStyle}>{formatDisplayDate(lead.passportExpiry)}</p></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <label className="font-bold text-slate-700 text-sm">5. TEST OR DRIVING VIDEO</label>
                      {docs.videoUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <label className="font-bold text-slate-700 text-sm">6. OTHER DOCUMENTS</label>
                      {docs.otherUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">None</span>}
                    </div>
                  </div>
                </div>

                {/* 📝 5. Exam Scores & History */}
                <div className="bg-purple-50/50 p-6 rounded-xl shadow-sm border border-purple-200 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-4 flex justify-between items-center">
                    <span className="flex items-center gap-2">📝 5. Exam Scores & History</span>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-100 border border-purple-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider">Current Final Status</h3>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                          lead.examinerStatus === "Approved" ? "bg-emerald-100 text-emerald-700" : 
                          (lead.examinerStatus === "Denied" || lead.examinerStatus === "Rejected") ? "bg-red-100 text-red-700" : 
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {lead.examinerStatus?.toUpperCase() || "PENDING"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">English Assessment</p>
                          <p className="text-2xl font-black text-slate-800">
                            {lead.englishScore !== null ? lead.englishScore : "-"}
                            <span className="text-sm text-slate-400 font-medium">/10</span>
                          </p>
                          <p className={`text-sm font-bold mt-1 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
                            {lead.englishTestResult || "Pending"}
                          </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                          <p className="text-2xl font-black text-slate-800">
                            {lead.drivingScore !== null ? lead.drivingScore : "-"}
                            <span className="text-sm text-slate-400 font-medium">/10</span>
                          </p>
                          <p className={`text-sm font-bold mt-1 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
                            {lead.yardTestResult || "Pending"}
                          </p>
                        </div>
                      </div>
                      
                      {lead.examinerRemarks && (
                        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                          <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Latest Examiner Remarks</p>
                          <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.examinerRemarks}</p>
                        </div>
                      )}
                    </div>

                    {/* PAST HISTORY LOG FOR HR (Includes Absences) */}
                    {combinedHistory.length > 0 && (
                      <div className="mt-6 border-t border-purple-200 pt-5">
                        <h3 className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-3 flex items-center gap-2">
                          📜 Past Evaluation Log 
                          <span className="bg-purple-100 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">{combinedHistory.length}</span>
                        </h3>
                        
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                          {combinedHistory.map((test: any) => (
                            <div key={test.id} className={`p-3 rounded-lg border flex justify-between items-center ${test.isMissed ? 'bg-orange-50 border-orange-200' : 'bg-white border-purple-100 shadow-sm'}`}>
                              <div>
                                <p className={`text-sm font-bold ${test.isMissed ? 'text-orange-800' : 'text-slate-700'}`}>
                                  {test.attemptLabel} 
                                  <span className={`font-medium text-xs ml-2 ${test.isMissed ? 'text-orange-600' : 'text-slate-400'}`}>
                                    ({new Date(test.createdAt).toLocaleDateString("en-GB")})
                                  </span>
                                </p>
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                  English: <span className={`font-bold ${test.isMissed ? 'text-orange-600' : 'text-slate-700'}`}>{test.englishScore !== "-" ? `${test.englishScore}/10` : "-"}</span> <span className={test.isMissed ? "text-orange-500" : ""}>({test.englishTestResult})</span> <span className="mx-1 text-slate-300">|</span> 
                                  Yard: <span className={`font-bold ${test.isMissed ? 'text-orange-600' : 'text-slate-700'}`}>{test.drivingScore !== "-" ? `${test.drivingScore}/10` : "-"}</span> <span className={test.isMissed ? "text-orange-500" : ""}>({test.yardTestResult})</span>
                                </p>
                                {test.remarks && (
                                  <p className="text-xs text-slate-500 mt-1 italic">"{test.remarks}"</p>
                                )}
                              </div>
                              <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase shrink-0 ${
                                test.isMissed ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                test.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {test.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 💰 6. Test & Scheduling (FULL DETAILED READ-ONLY) */}
                <div className="bg-blue-50/30 p-6 rounded-xl shadow-sm border border-blue-200 mb-6">
                  <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-6 mt-2 flex items-center gap-2">
                    <span>💰 6. Test & Scheduling</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">Read-Only</span>
                  </h2>

                  <div className="mb-8">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4">
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">1️⃣ Initial Test Fee & Schedule</h3>
                      {renderVerifyBadge(lead.testFeeVerifyStatus)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <p className={labelStyle}>Test Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.testDate)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div><p className={labelStyle}>Test Fees (AED)</p><p className={readOnlyGridValue}>{lead.testFeesAmount ? `${lead.testFeesAmount} AED` : "-"}</p></div>
                        <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.invoiceNumber || "-"}</p></div>
                        <div className="col-span-2"><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.paymentDate)}</p></div>
                      </div>
                    </div>
                  </div>

                  {lead.reTestDate && (
                    <div className="mb-8">
                      <div className="flex justify-between items-center border-b border-red-200 pb-2 mb-4">
                        <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">🔄 Attempt 2: Re-Test Fee & Schedule</h3>
                        {renderVerifyBadge(lead.reTestFeeVerifyStatus)}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-red-50/50 p-4 rounded-lg border border-red-100 shadow-sm">
                          <p className={labelStyle}>Re-Test Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.reTestDate)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 bg-red-50/50 p-4 rounded-lg border border-red-100 shadow-sm">
                          <div><p className={labelStyle}>Re-Test Fee (AED)</p><p className={readOnlyGridValue}>{lead.reTestFeesAmount ? `${lead.reTestFeesAmount} AED` : "-"}</p></div>
                          <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.reTestInvoiceNumber || "-"}</p></div>
                          <div className="col-span-2"><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.reTestPaymentDate)}</p></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-8">
                    <div className="flex justify-between items-center border-b border-emerald-200 pb-2 mb-4">
                      <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">🤝 Service Agreement Processing</h3>
                      {renderVerifyBadge(lead.saFeeVerifyStatus)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 shadow-sm">
                      <div><p className={labelStyle}>Agreement Fee (AED)</p><p className={readOnlyGridValue}>{lead.serviceAgreementAmount ? `${lead.serviceAgreementAmount} AED` : "-"}</p></div>
                      <div><p className={labelStyle}>Total Deal Amount (AED)</p><p className={readOnlyGridValue}>{lead.serviceAgreementTotal ? `${lead.serviceAgreementTotal} AED` : "-"}</p></div>
                      <div><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{lead.serviceAgreementInvoice || "-"}</p></div>
                      <div><p className={labelStyle}>Payment Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.serviceAgreementPaymentDate)}</p></div>
                    </div>
                  </div>

                  <div className="border-t-2 border-dashed border-blue-200 pt-6">
                    <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4">➕ Additional / Other Payments</h3>
                    {otherPayments.length === 0 ? (
                      <div className="bg-white/50 p-4 rounded-lg border border-blue-100 text-center text-sm text-slate-500 italic">
                        No additional payments logged by Sales.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {otherPayments.map((payment: any, index: number) => (
                          <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="md:col-span-4"><p className={labelStyle}>Reason</p><p className={readOnlyGridValue}>{payment.name}</p></div>
                            <div className="md:col-span-3"><p className={labelStyle}>Amount (AED)</p><p className={readOnlyGridValue}>{payment.amount} AED</p></div>
                            <div className="md:col-span-2"><p className={labelStyle}>Invoice No.</p><p className={readOnlyGridValue}>{payment.invoice || "-"}</p></div>
                            <div className="md:col-span-3"><p className={labelStyle}>Date</p><p className={readOnlyGridValue}>{formatDisplayDate(payment.date)}</p></div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 💭 7. Follow-Ups & Notes (Read-Only) */}
                <div className={cardStyle}>
                  <h2 className={headerStyle}>
                    <span>💭 7. Sales Follow-Ups & Notes</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>
                  <div className="mb-5 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                    <p className={labelStyle}>⭐ Feedback / Conversion Status</p>
                    <p className="text-sm font-bold text-blue-700">{lead.feedbackStatus || "Pending Update..."}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 bg-slate-50 p-5 rounded-lg border border-slate-100">
                    <div><p className={labelStyle}>Last Call Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.lastCallDate)}</p></div>
                    <div><p className={labelStyle}>Next Follow-up Date</p><p className={readOnlyGridValue}>{formatDisplayDate(lead.followUpDate)}</p></div>
                    <div className="md:col-span-2"><p className={labelStyle}>Follow-up Remarks</p><p className={readOnlyGridValue}>{lead.followUpRemarks || "-"}</p></div>
                  </div>
                  <div>
                    <p className={labelStyle}>Primary Sales Remarks</p>
                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 min-h-[80px]">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.salesRemarks || "No remarks provided."}</p>
                    </div>
                  </div>
                </div>

                {/* ========================================= */}
                {/* 🔻 HR DEPARTMENT (EDITABLE) 🔻            */}
                {/* ========================================= */}
                
                <div className="my-10 flex items-center gap-4">
                  <div className="h-px bg-blue-300 flex-1"></div>
                  <span className="text-sm font-black text-blue-700 uppercase tracking-widest">HR Department Processing</span>
                  <div className="h-px bg-blue-300 flex-1"></div>
                </div>

                {/* 🔥 FINANCIAL SUMMARY CARD */}
                <div className="grid grid-cols-3 gap-4 mb-6 bg-slate-800 text-white p-6 rounded-xl shadow-md border border-slate-700">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Deal Amount</p>
                    <p className="text-2xl font-black text-white">{totalDealAmount.toFixed(2)} <span className="text-sm font-medium text-slate-400">AED</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Collected Amount</p>
                    <p className="text-2xl font-black text-emerald-400">{totalCollectedAmount.toFixed(2)} <span className="text-sm font-medium text-emerald-700">AED</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Remaining Balance</p>
                    <p className="text-2xl font-black text-orange-400">{remainingBalance.toFixed(2)} <span className="text-sm font-medium text-orange-700">AED</span></p>
                  </div>
                </div>

                {/* 💰 8. HR Financial Routing (EDITABLE STACKED LAYOUT) */}
                <div className="bg-blue-50/50 p-6 rounded-xl shadow-sm border border-blue-200">
                  <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-5 flex justify-between">
                    <span>💰 8. HR Financial Routing & Pendings</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded shadow-sm">Editable</span>
                  </h2>

                  {/* 🚀 QUICK ROUTING DROPDOWN INSIDE FINANCIALS */}
                  <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm mb-6">
                    <label className="block text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Active Case Status (Route File to Ops)</label>
                    <select name="caseStatus" value={currentRoute} onChange={(e) => setCurrentRoute(e.target.value)} className={`${inputStyle} border-2 border-blue-300 text-blue-900 cursor-pointer`}>
                      <option disabled>------------------------</option>
                      {caseStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  
                  <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">Set Amounts Pending Collection (Delegated to Ops):</p>
                  
                  {/* 🔥 VERTICAL STACKED ROUTING ROWS */}
                  <div className="space-y-3">
                    
                    {/* Service Agreement Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Service Agreement</p>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Collected by Sales</span>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="text" readOnly value={`${totalCollectedAmount.toFixed(2)} AED`} className={`${inputStyle} bg-emerald-100 border-emerald-200 font-bold text-emerald-900`} />
                        <input type="hidden" name="serviceAgreementPending" value={lead.serviceAgreementPending || ""} />
                      </div>
                      <div className="w-full md:w-1/3 flex justify-center items-center">
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">✅ No Route Needed</span>
                      </div>
                    </div>

                    {/* Job Offer Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Job Offer</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="jobOfferPending" defaultValue={lead.jobOfferPending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <button type="button" onClick={() => setCurrentRoute("Stage 2: Ops - Collect Job Offer Payment")} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                          <span>Route</span> <span>➔</span> <span>Collect Job Offer</span>
                        </button>
                      </div>
                    </div>

                    {/* Work Permit Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Work Permit</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="workPermitPending" defaultValue={lead.workPermitPending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <button type="button" onClick={() => setCurrentRoute("Stage 2: Ops - Collect WP Payment")} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                          <span>Route</span> <span>➔</span> <span>Collect Work Permit</span>
                        </button>
                      </div>
                    </div>

                    {/* Insurance Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Insurance</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="insurancePending" defaultValue={lead.insurancePending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <button type="button" onClick={() => setCurrentRoute("Pending Payment 4 (Insurance)")} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                          <span>Route</span> <span>➔</span> <span>Collect Insurance</span>
                        </button>
                      </div>
                    </div>

                    {/* School Fees Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">School Fees</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="schoolFeesPending" defaultValue={lead.schoolFeesPending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <button type="button" onClick={() => setCurrentRoute("School Fees Pending")} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                          <span>Route</span> <span>➔</span> <span>Collect School Fees</span>
                        </button>
                      </div>
                    </div>

                    {/* Flight Ticket Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Flight Ticket</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="flightTicketPending" defaultValue={lead.flightTicketPending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3">
                        <button type="button" onClick={() => setCurrentRoute("Flight Ticket Pending")} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex justify-center items-center gap-2">
                          <span>Route</span> <span>➔</span> <span>Collect Flight Ticket</span>
                        </button>
                      </div>
                    </div>

                    {/* Other / Misc Row */}
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <div className="w-full md:w-1/3">
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Other / Misc</p>
                      </div>
                      <div className="w-full md:w-1/3">
                        <input type="number" step="0.01" name="otherPending" defaultValue={lead.otherPending} className={inputStyle} placeholder="0.00" />
                      </div>
                      <div className="w-full md:w-1/3 flex justify-center items-center">
                        <span className="text-xs font-bold text-slate-400 italic">(Use Top Dropdown to Route)</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* 📋 9. HR Case Notes & Follow-up (EDITABLE) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex justify-between">
                    <span>📋 9. HR Processing Remarks & Follow-Up</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded shadow-sm">Editable</span>
                  </h2>
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={inputLabelStyle}>Last Follow-Up Date</label>
                        <input type="date" name="lastEmailDate" defaultValue={formatDate(lead.lastEmailDate)} className={inputStyle} />
                      </div>
                      <div>
                        <label className={inputLabelStyle}>Next Follow-Up Date</label>
                        <input type="date" name="hrNextFollowUpDate" defaultValue={formatDate(lead.hrNextFollowUpDate)} className={`${inputStyle} border-orange-300 bg-orange-50/50`} />
                      </div>
                    </div>
                    <div>
                      <label className={inputLabelStyle}>HR Internal Notes / Follow-up Remarks</label>
                      <textarea name="hrRemarks" rows={5} defaultValue={lead.hrRemarks} className={inputStyle} placeholder="Add follow-up notes or internal HR processing remarks here..."></textarea>
                    </div>
                  </div>

                  {/* MASTER SAVE BUTTON */}
                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors disabled:bg-slate-400 w-full md:w-auto"
                    >
                      {loading ? "Saving Records..." : "💾 Save HR & Ops Routing"}
                    </button>
                  </div>
                </div>

                {/* ========================================= */}
                {/* 🔻 OPERATIONS DEPARTMENT (READ-ONLY) 🔻   */}
                {/* ========================================= */}
                <div className="my-10 flex items-center gap-4 opacity-75">
                  <div className="h-px bg-slate-300 flex-1"></div>
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Operations Visibility</span>
                  <div className="h-px bg-slate-300 flex-1"></div>
                </div>

                {/* 💰 10. Operations Collection Ledger (READ-ONLY) */}
                <div className="bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-emerald-200 opacity-90">
                  <h2 className="text-lg font-bold text-emerald-900 border-b border-emerald-200 pb-3 mb-5 flex justify-between">
                    <span>💳 10. Operations Collection Ledger</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">Read-Only</span>
                  </h2>
                  
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Total Collected by Ops (All Time)</label>
                    <div className="w-full md:w-1/3 p-4 bg-white text-emerald-900 text-xl font-black border border-emerald-300 rounded-lg shadow-sm">
                      {lead.totalPayment ? `${lead.totalPayment} AED` : "0.00 AED"}
                    </div>
                  </div>
                </div>

                {/* 📋 11. Operations Remarks (READ-ONLY) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 opacity-90">
                  <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex justify-between">
                    <span>📋 11. Operations Remarks</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
                  </h2>
                  <div className="bg-slate-50 p-5 rounded-lg border border-slate-100 min-h-[100px]">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">
                      {lead.opsRemarks || "No remarks provided by Operations yet."}
                    </p>
                  </div>
                </div>

              </form>
            </div>

          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
          <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
        </div>
      )}

    </div>
  );
}