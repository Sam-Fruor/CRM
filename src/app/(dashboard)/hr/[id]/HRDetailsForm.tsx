"use client";

import { useState } from "react";
import { updateHRFile } from "@/app/actions/hrActions";
import { useRouter } from "next/navigation";

export default function HRDetailsForm({ lead }: { lead: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateHRFile(lead.id, formData);
      alert("✅ HR Processing Data Updated Successfully!");
      router.push("/hr/verification");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to update file.");
      setLoading(false);
    }
  };

  const cardStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200";
  const headerStyle = "text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5 flex justify-between items-center";
  const labelStyle = "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1";
  const valueStyle = "text-sm font-semibold text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100";
  
  const inputLabelStyle = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";
  const inputStyle = "w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-sm";

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-10 max-w-4xl mx-auto">
      
      {/* 🚀 STICKY SAVE BAR */}
      <div className="sticky top-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-blue-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Active Case Status (Route between HR & Ops)</label>
          <select name="caseStatus" defaultValue={lead.caseStatus} className="w-full p-2.5 bg-blue-50 border-2 border-blue-200 text-blue-900 text-sm font-bold rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value={lead.caseStatus}>{lead.caseStatus} (Current)</option>
            <option disabled>------------------------</option>
            {caseStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading} className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors disabled:bg-slate-400">
          {loading ? "Saving Records..." : "💾 Save HR & Ops Routing"}
        </button>
      </div>

      {/* 📍 1. Routing Information (Read-Only) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>📍 1. Routing Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><p className={labelStyle}>Lead Source</p><p className={valueStyle}>{lead.leadSource || "N/A"}</p></div>
          <div><p className={labelStyle}>Category</p><p className={valueStyle}>{lead.category || "N/A"}</p></div>
          <div><p className={labelStyle}>Preferred Country</p><p className={valueStyle}>{lead.countryPreferred || "N/A"}</p></div>
          <div><p className={labelStyle}>Feedback Status</p><p className={valueStyle}>{lead.feedbackStatus || "N/A"}</p></div>
          <div><p className={labelStyle}>Slot Booking Date</p><p className={valueStyle}>{lead.slotBookingDate ? new Date(lead.slotBookingDate).toLocaleDateString("en-GB") : "Not Booked"}</p></div>
          <div><p className={labelStyle}>Test Date</p><p className={valueStyle}>{lead.testDate ? new Date(lead.testDate).toLocaleDateString("en-GB") : "N/A"}</p></div>
        </div>
      </div>

      {/* 👤 2. Client Details & IDs (LOCKED TO READ-ONLY) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>
          <span>👤 2. Client Details & IDs</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><p className={labelStyle}>Given Name</p><p className={valueStyle}>{lead.givenName || "N/A"}</p></div>
          <div><p className={labelStyle}>Surname</p><p className={valueStyle}>{lead.surname || "N/A"}</p></div>
          <div><p className={labelStyle}>Father's Name</p><p className={valueStyle}>{lead.fatherName || "N/A"}</p></div>
          <div><p className={labelStyle}>Date of Birth</p><p className={valueStyle}>{lead.dob ? new Date(lead.dob).toLocaleDateString("en-GB") : "N/A"}</p></div>
          <div><p className={labelStyle}>Phone (UAE)</p><p className={valueStyle}>{lead.callingNumber || "N/A"}</p></div>
          <div><p className={labelStyle}>WhatsApp</p><p className={valueStyle}>{lead.whatsappNumber || "N/A"}</p></div>
          <div className="md:col-span-2"><p className={labelStyle}>Email</p><p className={valueStyle}>{lead.email || "N/A"}</p></div>
          <div><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality || "N/A"}</p></div>
          <div><p className={labelStyle}>Passport No.</p><p className={valueStyle}>{lead.passportNum || "N/A"}</p></div>
          <div><p className={labelStyle}>Resident ID No.</p><p className={valueStyle}>{lead.residentIdNum || "N/A"}</p></div>
          <div><p className={labelStyle}>Driving License No.</p><p className={valueStyle}>{lead.dlNumber || "N/A"}</p></div>
        </div>

        {/* HIDDEN INPUTS: These ensure the existing Server Action doesn't wipe the DB when you click Save! */}
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
      </div>

      {/* 💼 3. Experience & Agency History (Read-Only) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>💼 3. Experience & Agency History</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><p className={labelStyle}>Home Exp</p><p className={valueStyle}>{lead.experienceHome || 0} Years</p></div>
          <div><p className={labelStyle}>GCC Exp</p><p className={valueStyle}>{lead.experienceGCC || 0} Years</p></div>
          <div><p className={labelStyle}>Previous Agency</p><p className={valueStyle}>{lead.previousAgency || "None"}</p></div>
          <div><p className={labelStyle}>Prev. Country</p><p className={valueStyle}>{lead.previousCountry || "None"}</p></div>
        </div>
      </div>

      {/* 💰 4. Sales Processing (Read-Only) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>💰 4. Sales Processing & History</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><p className={labelStyle}>Test Fees Logged</p><p className={valueStyle}>{lead.testFeesAmount ? `$${lead.testFeesAmount}` : "N/A"}</p></div>
          <div><p className={labelStyle}>Invoice No.</p><p className={valueStyle}>{lead.invoiceNumber || "N/A"}</p></div>
          <div><p className={labelStyle}>Payment Date</p><p className={valueStyle}>{lead.paymentDate ? new Date(lead.paymentDate).toLocaleDateString("en-GB") : "N/A"}</p></div>
          <div><p className={labelStyle}>Last Call Date</p><p className={valueStyle}>{lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString("en-GB") : "N/A"}</p></div>
          <div><p className={labelStyle}>Next Follow-up</p><p className={valueStyle}>{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString("en-GB") : "N/A"}</p></div>
        </div>
      </div>

      {/* 📝 5. Exam Scores & History (WITH PAST SCORES) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>📝 5. Exam Scores & History</h2>
        <div className="mb-4">
          <p className={labelStyle}>Current Final Status</p>
          <p className="text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg inline-block">{lead.examinerStatus || "Pending"}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">English Assessment</p>
            <p className="text-2xl font-black text-slate-800">{lead.englishScore !== null ? lead.englishScore : "-"}<span className="text-sm text-slate-400">/10</span></p>
            <p className={`text-xs font-bold mt-1 ${lead.englishTestResult === 'Passed' ? 'text-emerald-600' : lead.englishTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
              {lead.englishTestResult || "Pending"}
            </p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-700 mb-2">Driving / Yard Test</p>
            <p className="text-2xl font-black text-slate-800">{lead.drivingScore !== null ? lead.drivingScore : "-"}<span className="text-sm text-slate-400">/10</span></p>
            <p className={`text-xs font-bold mt-1 ${lead.yardTestResult === 'Passed' ? 'text-emerald-600' : lead.yardTestResult === 'Failed' ? 'text-red-500' : 'text-slate-500'}`}>
              {lead.yardTestResult || "Pending"}
            </p>
          </div>
        </div>

        {/* THE PAST HISTORY LOG FOR HR */}
        {lead.testEvaluations && lead.testEvaluations.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              📜 Past Evaluation Log 
              <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{lead.testEvaluations.length}</span>
            </h3>
            
            <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
              {lead.testEvaluations.map((evalRecord: any, index: number) => (
                <div key={evalRecord.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Attempt {index + 1} 
                      <span className="text-slate-400 font-medium text-xs ml-2">
                        ({new Date(evalRecord.createdAt).toLocaleDateString("en-GB")})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      English: <span className="font-bold text-slate-700">{evalRecord.englishScore !== null ? evalRecord.englishScore : "-"}/10</span> ({evalRecord.englishTestResult}) <span className="mx-1 text-slate-300">|</span> 
                      Yard: <span className="font-bold text-slate-700">{evalRecord.drivingScore !== null ? evalRecord.drivingScore : "-"}/10</span> ({evalRecord.yardTestResult})
                    </p>
                    {evalRecord.remarks && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{evalRecord.remarks}"</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase shrink-0 ${
                    evalRecord.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {evalRecord.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 💭 6. Sales Remarks & Notes (Read-Only) */}
      <div className={cardStyle}>
        <h2 className={headerStyle}>💭 6. Sales Remarks & Notes</h2>
        <p className="text-sm text-slate-700 bg-yellow-50/50 p-4 rounded-lg border border-yellow-100 whitespace-pre-wrap">
          {lead.salesRemarks || "No sales remarks provided."}
        </p>
      </div>

      {/* ========================================= */}
      {/* 🔻 HR DEPARTMENT (EDITABLE) 🔻 */}
      {/* ========================================= */}
      
      <div className="my-8 flex items-center gap-4">
        <div className="h-px bg-blue-300 flex-1"></div>
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">HR Department Processing</span>
        <div className="h-px bg-blue-300 flex-1"></div>
      </div>

      {/* 💰 7. HR Financial Ledger Setup (EDITABLE) */}
      <div className="bg-blue-50/50 p-6 rounded-xl shadow-sm border border-blue-200">
        <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-5 flex justify-between">
          <span>💰 7. HR Financial Routing & Pendings</span>
        </h2>
        
        <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-3">Set Amounts Pending Collection (Delegated to Ops):</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><label className={inputLabelStyle}>Service Agreement</label><input type="number" name="serviceAgreementPending" defaultValue={lead.serviceAgreementPending} className={inputStyle} /></div>
          <div><label className={inputLabelStyle}>Job Offer</label><input type="number" name="jobOfferPending" defaultValue={lead.jobOfferPending} className={inputStyle} /></div>
          <div><label className={inputLabelStyle}>Work Permit</label><input type="number" name="workPermitPending" defaultValue={lead.workPermitPending} className={inputStyle} /></div>
          <div><label className={inputLabelStyle}>Insurance</label><input type="number" name="insurancePending" defaultValue={lead.insurancePending} className={inputStyle} /></div>
          <div><label className={inputLabelStyle}>School Fees</label><input type="number" name="schoolFeesPending" defaultValue={lead.schoolFeesPending} className={inputStyle} /></div>
          <div><label className={inputLabelStyle}>Flight Ticket</label><input type="number" name="flightTicketPending" defaultValue={lead.flightTicketPending} className={inputStyle} /></div>
        </div>
      </div>

      {/* 📋 8. HR Case Notes & Follow-up (EDITABLE) */}
      <div className={`${cardStyle} border-blue-200`}>
        <h2 className={`${headerStyle} border-blue-100 flex justify-between`}>
          <span>📋 8. HR Processing Remarks & Follow-Up</span>
          <span className="text-xs font-bold text-blue-500 bg-blue-100 px-2 py-1 rounded">Editable</span>
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={inputLabelStyle}>Last Follow-Up Date</label>
              <input type="date" name="lastEmailDate" defaultValue={lead.lastEmailDate ? new Date(lead.lastEmailDate).toISOString().split('T')[0] : ''} className={inputStyle} />
            </div>
            <div>
              <label className={inputLabelStyle}>Next Follow-Up Date</label>
              <input type="date" name="hrNextFollowUpDate" defaultValue={lead.hrNextFollowUpDate ? new Date(lead.hrNextFollowUpDate).toISOString().split('T')[0] : ''} className={`${inputStyle} border-orange-300 bg-orange-50`} />
            </div>
          </div>
          <div>
            <label className={inputLabelStyle}>HR Internal Notes / Follow-up Remarks</label>
            <textarea name="hrRemarks" rows={4} defaultValue={lead.hrRemarks} className={inputStyle} placeholder="Add follow-up notes or internal HR processing remarks here..."></textarea>
          </div>
        </div>
      </div>


      {/* ========================================= */}
      {/* 🔻 OPERATIONS DEPARTMENT (READ-ONLY) 🔻 */}
      {/* ========================================= */}

      <div className="my-8 flex items-center gap-4 opacity-75">
        <div className="h-px bg-slate-300 flex-1"></div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Operations Visibility</span>
        <div className="h-px bg-slate-300 flex-1"></div>
      </div>

      {/* 💰 9. Operations Collection Ledger (READ-ONLY) */}
      <div className="bg-emerald-50/30 p-6 rounded-xl shadow-sm border border-emerald-100 opacity-90">
        <h2 className="text-lg font-bold text-emerald-900 border-b border-emerald-100 pb-3 mb-5 flex justify-between">
          <span>💳 9. Operations Collection Ledger</span>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
        </h2>
        
        <div>
          <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1">Total Collected by Ops (All Time)</label>
          <div className="w-full md:w-1/3 p-3 bg-white text-emerald-900 text-lg font-black border border-emerald-200 rounded-lg shadow-sm">
            {lead.totalPayment ? `$${lead.totalPayment}` : "$0"}
          </div>
        </div>
      </div>

      {/* 📋 10. Operations Remarks (READ-ONLY) */}
      <div className={`${cardStyle} opacity-90`}>
        <h2 className={`${headerStyle} flex justify-between`}>
          <span>📋 10. Operations Remarks</span>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded">Read-Only</span>
        </h2>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 min-h-[100px]">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">
            {lead.opsRemarks || "No remarks provided by Operations yet."}
          </p>
        </div>
      </div>

    </form>
  );
}