// src/app/(dashboard)/sales/[id]/ViewLead.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TransferBanner from "./TransferBanner";
import DocumentVault from "@/components/DocumentVault";
import { updateSalesProcessing } from "@/app/actions/salesActions";

const FEEDBACK_OPTIONS = [
  "Converted",
  "Not Responding",
  "Not Interested",
  "Not Eligible",
  "Client is for Next Test"
];

export default function ViewLead({ lead, activeTab }: { lead: any, activeTab: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // 🧠 SMART FEEDBACK DROPDOWN STATE
  const initialFeedback = lead.feedbackStatus || "";
  const isCustomFeedback = initialFeedback && !FEEDBACK_OPTIONS.includes(initialFeedback);
  const [feedbackSelect, setFeedbackSelect] = useState(isCustomFeedback ? "Others" : initialFeedback);

  // ♾️ DYNAMIC "OTHER PAYMENTS" STATE
  const [otherPayments, setOtherPayments] = useState<{ id: string, name: string, amount: string, invoice: string, date: string }[]>(
    Array.isArray(lead.otherPayments) ? lead.otherPayments : []
  );

  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";
  const labelStyle = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5";
  const valueStyle = "text-sm font-semibold text-slate-800";
  const inputStyle = "w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all";

  // Check if they ever failed an exam
  const hasFailedExam = lead.examinerStatus === "Denied" || lead.testEvaluations?.some((t: any) => t.status === "Denied" || t.status === "Failed");

  const docs = lead.documentStatus || {};

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  // Dynamic Payment Handlers
  const addPaymentRow = () => {
    setOtherPayments([...otherPayments, { id: Math.random().toString(36).substr(2, 9), name: "", amount: "", invoice: "", date: "" }]);
  };
  
  const updatePaymentRow = (id: string, field: string, value: string) => {
    setOtherPayments(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const removePaymentRow = (id: string) => {
    setOtherPayments(prev => prev.filter(p => p.id !== id));
  };

  const handleInlineSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Inject the dynamic payments JSON into the form before sending to server
    formData.append("otherPayments", JSON.stringify(otherPayments));

    try {
      await updateSalesProcessing(lead.id, formData);
      alert("✅ Sales Financials & Remarks Updated!");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to save updates.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* EXAMINER APPROVAL ALERT LOGIC */}
      {lead.examinerStatus === "Approved" && lead.caseStatus === "Stage 1 Under Process" && (
        <TransferBanner leadId={lead.id} />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Lead Profile: {lead.givenName} {lead.surname}
          </h1>
          <p className="text-slate-500 text-sm">
            Read-only view. File is currently with:
            <span className="font-bold text-blue-600 ml-1">
              {lead.caseStatus}
            </span>
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <Link 
            href="/sales/leads"
            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Close
          </Link>
          
          {lead.caseStatus === "Stage 1 Under Process" ? (
            <Link 
              href={`/sales/${lead.id}/edit`}
              className="px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Edit Core Details
            </Link>
          ) : (
            <span className="px-6 py-2.5 rounded-lg font-bold text-slate-400 bg-slate-100 cursor-not-allowed shadow-sm border border-slate-200">
              🔒 Archived (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* 🔘 TAB NAVIGATION BUTTONS */}
      <div className="flex space-x-2 border-b border-slate-200 px-2 mb-6">
        <Link 
          href={`/sales/${lead.id}?tab=details`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          👤 Lead Profile & Evaluation
        </Link>
        <Link 
          href={`/sales/${lead.id}?tab=documents`} 
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'documents' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🗂️ Document Vault
          {lead.documentFiles && Object.keys(lead.documentFiles).length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">
              {Object.keys(lead.documentFiles).length}
            </span>
          )}
        </Link>
      </div>

      {/* 📄 DYNAMIC CONTENT AREA */}
      {activeTab === "details" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">

            {/* ========================================== */}
            {/* 1. ROUTING INFORMATION (READ ONLY)         */}
            {/* ========================================== */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
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

            {/* ========================================== */}
            {/* 2. CLIENT DETAILS (READ ONLY)              */}
            {/* ========================================== */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
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
                <div><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality}</p></div>
              </div>
            </div>

            {/* ========================================== */}
            {/* 3. EXPERIENCE (READ ONLY)                  */}
            {/* ========================================== */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
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

            {/* ========================================== */}
            {/* 4. DOCUMENTS & ID DETAILS (READ ONLY)      */}
            {/* ========================================== */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
                <span>🗂️ 4. Documents & ID Details</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Vault Auto-Sync</span>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">1. CV / RESUME</label>
                  {docs.resumeUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">2. DRIVING LICENCE</label>
                    {docs.dlUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div><label className={labelStyle}>DL Number</label><p className={valueStyle}>{lead.dlNumber || "N/A"}</p></div>
                    <div><label className={labelStyle}>Issue Date</label><p className={valueStyle}>{formatDisplayDate(lead.dlIssueDate)}</p></div>
                    <div><label className={labelStyle}>Expiry Date</label><p className={valueStyle}>{formatDisplayDate(lead.dlExpiry)}</p></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">3. RESIDENT ID</label>
                    {docs.residentIdUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div><label className={labelStyle}>ID Number</label><p className={valueStyle}>{lead.residentIdNum || "N/A"}</p></div>
                    <div><label className={labelStyle}>Issue Date</label><p className={valueStyle}>{formatDisplayDate(lead.residentIdIssueDate)}</p></div>
                    <div><label className={labelStyle}>Expiry Date</label><p className={valueStyle}>{formatDisplayDate(lead.residentIdExp)}</p></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">4. PASSPORT</label>
                    {docs.passportUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div><label className={labelStyle}>Passport Number</label><p className={valueStyle}>{lead.passportNum || "N/A"}</p></div>
                    <div><label className={labelStyle}>Issue Date</label><p className={valueStyle}>{formatDisplayDate(lead.passportIssueDate)}</p></div>
                    <div><label className={labelStyle}>Expiry Date</label><p className={valueStyle}>{formatDisplayDate(lead.passportExpiry)}</p></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">5. TEST OR DRIVING VIDEO</label>
                  {docs.videoUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full">❌ Missing</span>}
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                  <label className="font-bold text-slate-700">6. OTHER DOCUMENTS</label>
                  {docs.otherUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">None</span>}
                </div>
              </div>
            </div>

            {/* ========================================== */}
            {/* 5. EXAM SCORES & HISTORY (READ ONLY)       */}
            {/* ========================================== */}
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
                      lead.examinerStatus === "Denied" ? "bg-red-100 text-red-700" : 
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
                      <p className={`text-sm font-bold mt-1 ${
                        lead.englishTestResult === "Passed" ? "text-emerald-600" : 
                        lead.englishTestResult === "Failed" ? "text-red-600" : 
                        "text-slate-500"
                      }`}>
                        {lead.englishTestResult || "Pending"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                      <p className="text-2xl font-black text-slate-800">
                        {lead.drivingScore !== null ? lead.drivingScore : "-"}
                        <span className="text-sm text-slate-400 font-medium">/10</span>
                      </p>
                      <p className={`text-sm font-bold mt-1 ${
                        lead.yardTestResult === "Passed" ? "text-emerald-600" : 
                        lead.yardTestResult === "Failed" ? "text-red-600" : 
                        "text-slate-500"
                      }`}>
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

                {/* PAST HISTORY LOG */}
                {lead.testEvaluations?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <h3 className="text-sm font-bold text-purple-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                      🕒 Complete Testing History ({lead.testEvaluations.length} Attempts)
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                      {lead.testEvaluations.map((test: any, index: number) => (
                        <div key={test.id} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <span className="text-xs font-bold text-slate-500">
                              Attempt {index + 1} • {new Date(test.createdAt).toLocaleDateString("en-GB")}
                            </span>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              test.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {test.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-slate-500 text-xs uppercase tracking-wider">English:</span> 
                              <span className="font-bold ml-1">{test.englishScore !== null ? test.englishScore : "-"}/10</span> 
                              <span className="text-slate-400 ml-1">({test.englishTestResult})</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs uppercase tracking-wider">Driving:</span> 
                              <span className="font-bold ml-1">{test.drivingScore !== null ? test.drivingScore : "-"}/10</span> 
                              <span className="text-slate-400 ml-1">({test.yardTestResult})</span>
                            </div>
                          </div>

                          {test.remarks && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                              <span className="font-semibold text-slate-500">Remarks:</span> {test.remarks}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ========================================== */}
            {/* 🔴 INLINE EDITABLE FORM STARTS HERE        */}
            {/* ========================================== */}
            <form onSubmit={handleInlineSave} className="bg-blue-50/30 p-6 rounded-xl border border-blue-200 shadow-sm relative">
              
              <div className="absolute top-4 right-4">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors disabled:bg-slate-400"
                >
                  {loading ? "Saving..." : "💾 Save Updates"}
                </button>
              </div>

{/* 5. SALES PROCESSING & FINANCIALS */}
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-6 mt-2 flex items-center gap-2">
                💰 5. Sales Processing & Ledgers
                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded">Editable</span>
              </h2>
              
              {/* FEEDBACK STATUS (TOP OF SECTION 5) */}
              <div className="mb-8 bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                <label className="block text-sm font-bold text-blue-800 uppercase tracking-wider mb-3">
                  ⭐ Feedback / Conversion Status
                </label>
                <div className="flex flex-col md:flex-row gap-4">
                  <select 
                    name="feedbackStatus" 
                    value={feedbackSelect}
                    onChange={(e) => setFeedbackSelect(e.target.value)}
                    className={`${inputStyle} w-full md:w-1/3 border-blue-300 font-semibold bg-blue-50/50`}
                  >
                    <option value="">Pending Update...</option>
                    {FEEDBACK_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value="Others">Others (Custom)</option>
                  </select>
                  
                  {feedbackSelect === "Others" && (
                    <div className="w-full md:w-2/3 animate-in fade-in zoom-in-95 duration-200">
                      <input 
                        type="text" 
                        name="feedbackStatusOther" 
                        defaultValue={isCustomFeedback ? initialFeedback : ""} 
                        placeholder="Type custom status here..." 
                        className={`${inputStyle} border-blue-300 font-semibold`} 
                        required 
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* INITIAL TEST FEES & SCHEDULING */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Initial Test Record</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
                  <div>
                    <label className={labelStyle}>Test Date</label>
                    <input type="date" name="testDate" defaultValue={formatDate(lead.testDate)} className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Test Fees (AED)</label>
                    <input type="number" step="0.01" name="testFeesAmount" defaultValue={lead.testFeesAmount} placeholder="0.00" className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Invoice No.</label>
                    <input type="text" name="invoiceNumber" defaultValue={lead.invoiceNumber} placeholder="INV-XXX" className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Payment Date</label>
                    <input type="date" name="paymentDate" defaultValue={formatDate(lead.paymentDate)} className={inputStyle} />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 pl-1 font-medium">Note: System will auto-book slot date as "Today" when test date is updated.</p>
              </div>

              {/* RE-TEST FEES (CONDITIONAL) */}
              {hasFailedExam && (
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Re-Test Record (Failed Status)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-red-50 p-4 rounded-lg border border-red-200 shadow-sm">
                    <div>
                      <label className={labelStyle}>Re-Test Date</label>
                      <input type="date" name="reTestDate" defaultValue={formatDate(lead.reTestDate)} className={inputStyle} />
                    </div>
                    <div>
                      <label className={labelStyle}>Re-Test Fee (AED)</label>
                      <input type="number" step="0.01" name="reTestFeesAmount" defaultValue={lead.reTestFeesAmount} placeholder="0.00" className={inputStyle} />
                    </div>
                    <div>
                      <label className={labelStyle}>Invoice No.</label>
                      <input type="text" name="reTestInvoiceNumber" defaultValue={lead.reTestInvoiceNumber} placeholder="INV-XXX" className={inputStyle} />
                    </div>
                    <div>
                      <label className={labelStyle}>Payment Date</label>
                      <input type="date" name="reTestPaymentDate" defaultValue={formatDate(lead.reTestPaymentDate)} className={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {/* SERVICE AGREEMENT FEES */}
              <div className="mb-8">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Service Agreement Fees</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 shadow-sm">
                  <div>
                    <label className={labelStyle}>Agreement Fee (AED)</label>
                    <input type="number" step="0.01" name="serviceAgreementAmount" defaultValue={lead.serviceAgreementAmount} placeholder="0.00" className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Invoice No.</label>
                    <input type="text" name="serviceAgreementInvoice" defaultValue={lead.serviceAgreementInvoice} placeholder="INV-XXX" className={inputStyle} />
                  </div>
                  <div>
                    <label className={labelStyle}>Payment Date</label>
                    <input type="date" name="serviceAgreementPaymentDate" defaultValue={formatDate(lead.serviceAgreementPaymentDate)} className={inputStyle} />
                  </div>
                </div>
              </div>

              {/* ♾️ DYNAMIC OTHER PAYMENTS LEDGER */}
              <div className="mb-8 border-t-2 border-dashed border-blue-200 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">➕ Additional / Other Payments</h3>
                  <button 
                    type="button" 
                    onClick={addPaymentRow} 
                    className="text-xs font-bold bg-white text-blue-600 border border-blue-300 px-4 py-2 rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    + Add New Ledger Row
                  </button>
                </div>
                
                {otherPayments.length === 0 ? (
                  <div className="bg-white/50 p-6 rounded-lg border border-blue-100 text-center text-sm text-slate-500 italic">
                    No additional payments logged. Click the button above to add a fine, extra test, or misc fee.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {otherPayments.map((payment) => (
                      <div key={payment.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-lg border border-blue-200 shadow-sm relative pr-12 animate-in fade-in slide-in-from-top-2 duration-200">
                        
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Name / Reason</label>
                          <input 
                            type="text" 
                            value={payment.name} 
                            onChange={(e) => updatePaymentRow(payment.id, 'name', e.target.value)} 
                            placeholder="e.g. 2nd Re-Test Fee" 
                            className="w-full text-sm bg-slate-50 border-b border-slate-200 outline-none py-1.5 focus:border-blue-500 transition-colors" 
                            required 
                          />
                        </div>
                        
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Amount (AED)</label>
                          <input 
                            type="number" 
                            step="0.01" 
                            value={payment.amount} 
                            onChange={(e) => updatePaymentRow(payment.id, 'amount', e.target.value)} 
                            placeholder="0.00" 
                            className="w-full text-sm bg-slate-50 border-b border-slate-200 outline-none py-1.5 focus:border-blue-500 transition-colors" 
                            required 
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Invoice No.</label>
                          <input 
                            type="text" 
                            value={payment.invoice} 
                            onChange={(e) => updatePaymentRow(payment.id, 'invoice', e.target.value)} 
                            placeholder="INV-001" 
                            className="w-full text-sm bg-slate-50 border-b border-slate-200 outline-none py-1.5 focus:border-blue-500 transition-colors" 
                          />
                        </div>
                        
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Payment Date</label>
                          <input 
                            type="date" 
                            value={payment.date} 
                            onChange={(e) => updatePaymentRow(payment.id, 'date', e.target.value)} 
                            className="w-full text-sm bg-slate-50 border-b border-slate-200 outline-none py-1.5 focus:border-blue-500 transition-colors" 
                          />
                        </div>
                        
                        <button 
                          type="button" 
                          onClick={() => removePaymentRow(payment.id)} 
                          className="absolute top-1/2 -translate-y-1/2 right-4 w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 flex items-center justify-center font-bold transition-colors"
                          title="Remove Row"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ========================================== */}
              {/* 7. SALES REMARKS                           */}
              {/* ========================================== */}
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-5 flex items-center gap-2 mt-8">
                💭 7. Follow-Ups & Notes
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                <div>
                  <label className={labelStyle}>Last Call Date</label>
                  <input type="date" name="lastCallDate" defaultValue={formatDate(lead.lastCallDate)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Next Follow-up Date</label>
                  <input type="date" name="followUpDate" defaultValue={formatDate(lead.followUpDate)} className={inputStyle} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelStyle}>Follow-up Remarks</label>
                  <input type="text" name="followUpRemarks" defaultValue={lead.followUpRemarks} placeholder="Quick follow-up notes..." className={inputStyle} />
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
                <label className={labelStyle}>Primary Sales Remarks</label>
                <textarea 
                  name="salesRemarks" 
                  defaultValue={lead.salesRemarks} 
                  rows={4} 
                  placeholder="Detailed sales notes and client context..."
                  className={inputStyle}
                ></textarea>
              </div>

            </form>
          </div>

          {/* ========================================== */}
          {/* RIGHT COLUMN - ACTIVITY TIMELINE           */}
          {/* ========================================== */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6 flex flex-col max-h-[850px] overflow-hidden">
              <div className="p-5 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 relative z-20">
                <h3 className="font-bold text-slate-800">⏱️ Activity History</h3>
                <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
                  {lead.activities?.length || 0} Events
                </span>
              </div>
              <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
                {(!lead.activities || lead.activities.length === 0) ? (
                  <p className="text-slate-400 text-sm italic text-center py-10">No activities recorded yet.</p>
                ) : (
                  <div className="relative">
                    <div className="absolute top-2 bottom-0 left-[11px] w-[2px] bg-slate-100"></div>
                    <div className="space-y-6">
                      {lead.activities.map((activity: any) => {
                        const actionStr = activity.action.toLowerCase();
                        let dotColor = "bg-slate-400";
                        let bgColor = "bg-white";
                        let borderColor = "border-slate-200";

                        if (actionStr.includes("transfer") || actionStr.includes("approve") || actionStr.includes("document")) {
                          dotColor = "bg-emerald-500"; borderColor = "border-emerald-200"; bgColor = "bg-emerald-50/30";
                        } else if (actionStr.includes("deny") || actionStr.includes("fail")) {
                          dotColor = "bg-red-500"; borderColor = "border-red-200"; bgColor = "bg-red-50/30";
                        } else if (actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test")) {
                          dotColor = "bg-purple-500"; borderColor = "border-purple-200"; bgColor = "bg-purple-50/30";
                        } else if (actionStr.includes("update") || actionStr.includes("stage") || actionStr.includes("sales")) {
                          dotColor = "bg-blue-500"; borderColor = "border-blue-200"; bgColor = "bg-blue-50/30";
                        }

                        return (
                          <div key={activity.id} className="relative flex items-start gap-4 z-10 group">
                            <div className="flex flex-col items-center pt-1.5 shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 ${borderColor} z-10`}>
                                <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                              </div>
                            </div>
                            <div className={`flex-1 ${bgColor} p-4 rounded-xl border ${borderColor} shadow-sm transition-all hover:shadow-md`}>
                              <div className="flex justify-between items-start mb-2 gap-2">
                                <span className="font-bold text-slate-800 text-sm">{activity.action}</span>
                                <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                                  {new Date(activity.createdAt).toLocaleDateString("en-GB")}
                                </span>
                              </div>
                              
                              {activity.details && (
                                <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                  {activity.details}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium border-t border-slate-200/60 pt-2">
                                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                                  {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                                </span>
                                {activity.user?.name || "System"}
                                <span className="text-slate-300">•</span>
                                <span suppressHydrationWarning>{new Date(activity.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* ========================================== */
        /* 🗂️ THE DOCUMENT VAULT TAB                  */
        /* ========================================== */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl mx-auto">
          <DocumentVault leadId={lead.id} existingDocs={lead.documentFiles} />
        </div>
      )}
    </div>
  );
}