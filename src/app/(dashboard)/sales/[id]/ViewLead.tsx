import Link from "next/link";
import TransferBanner from "./TransferBanner";

export default function ViewLead({ lead }: { lead: any }) {
  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";
  const labelStyle = "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";
  const valueStyle = "text-sm font-semibold text-slate-800";

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* YOUR EXACT EXAMINER APPROVAL ALERT LOGIC */}
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
            Read-only view. This file is currently with:
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
          
          {/* YOUR EXACT DYNAMIC EDIT BUTTON LOGIC */}
          {lead.caseStatus === "Stage 1 Under Process" ? (
            <Link 
              href={`/sales/${lead.id}/edit`}
              className="px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              Edit Lead
            </Link>
          ) : (
            <span className="px-6 py-2.5 rounded-lg font-bold text-slate-400 bg-slate-100 cursor-not-allowed shadow-sm border border-slate-200">
              🔒 Archived (Read-Only)
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Routing Information */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">📍 1. Routing Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className={labelStyle}>Lead Source</p>
                <p className={valueStyle}>{lead.leadSource === "Others" ? lead.leadSourceOther : lead.leadSource}</p>
              </div>
              <div>
                <p className={labelStyle}>Category</p>
                <p className={valueStyle}>{lead.category === "Others" ? lead.categoryOther : lead.category}</p>
              </div>
              <div>
                <p className={labelStyle}>Preferred Country</p>
                <p className={valueStyle}>{lead.countryPreferred === "Others" ? lead.countryOther : lead.countryPreferred}</p>
              </div>
              <div>
                <p className={labelStyle}>Feedback Status</p>
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">{lead.feedbackStatus || "Pending"}</span>
              </div>
              <div>
                <p className={labelStyle}>Slot Booking Date</p>
                <p className={valueStyle}>{lead.slotBookingDate ? new Date(lead.slotBookingDate).toLocaleDateString() : "Not Booked"}</p>
              </div>
              <div>
                <p className={labelStyle}>Test Date</p>
                <p className={valueStyle}>{lead.testDate ? new Date(lead.testDate).toLocaleDateString() : "Not Scheduled"}</p>
              </div>
            </div>
          </div>

          {/* 2. Client Details */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">👤 2. Client Details & IDs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div><p className={labelStyle}>Full Name</p><p className={valueStyle}>{lead.givenName} {lead.surname}</p></div>
              <div><p className={labelStyle}>Father's Name</p><p className={valueStyle}>{lead.fatherName || "N/A"}</p></div>
              <div><p className={labelStyle}>Date of Birth</p><p className={valueStyle}>{lead.dob ? new Date(lead.dob).toLocaleDateString() : "N/A"}</p></div>
              <div><p className={labelStyle}>Phone</p><p className={valueStyle}>{lead.callingNumber}</p></div>
              <div><p className={labelStyle}>WhatsApp</p><p className={valueStyle}>{lead.whatsappNumber || "N/A"}</p></div>
              <div><p className={labelStyle}>Email</p><p className={valueStyle}>{lead.email || "N/A"}</p></div>
              <div><p className={labelStyle}>Nationality</p><p className={valueStyle}>{lead.nationality}</p></div>
              <div><p className={labelStyle}>Passport No.</p><p className={valueStyle}>{lead.passportNum || "N/A"}</p></div>
              <div><p className={labelStyle}>Resident ID No.</p><p className={valueStyle}>{lead.residentIdNum || "N/A"}</p></div>
              <div className="md:col-span-3"><p className={labelStyle}>Driving License No.</p><p className={valueStyle}>{lead.dlNumber || "N/A"}</p></div>
            </div>
          </div>

          {/* 3. Experience & Agency History */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">💼 3. Experience & Agency History</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className={labelStyle}>Home Exp</p><p className={valueStyle}>{lead.experienceHome || 0} Years</p></div>
              <div><p className={labelStyle}>GCC Exp</p><p className={valueStyle}>{lead.experienceGCC || 0} Years</p></div>
              <div><p className={labelStyle}>Previous Agency</p><p className={valueStyle}>{lead.previousAgency || "None"}</p></div>
              <div><p className={labelStyle}>Prev. Country</p><p className={valueStyle}>{lead.previousCountry || "None"}</p></div>
            </div>
          </div>

          {/* 4. Sales Processing */}
          <div className="bg-blue-50/50 p-6 rounded-xl shadow-sm border border-blue-100 mb-6">
            <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-4">💰 4. Sales Processing</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div><p className={labelStyle}>Test Fees</p><p className={valueStyle}>{lead.testFeesAmount ? `$${lead.testFeesAmount}` : "N/A"}</p></div>
              <div><p className={labelStyle}>Total Payment</p><p className={valueStyle}>{lead.totalPayment ? `$${lead.totalPayment}` : "N/A"}</p></div>
              <div><p className={labelStyle}>Invoice No.</p><p className={valueStyle}>{lead.invoiceNumber || "N/A"}</p></div>
              <div><p className={labelStyle}>Payment Date</p><p className={valueStyle}>{lead.paymentDate ? new Date(lead.paymentDate).toLocaleDateString() : "N/A"}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-6 p-4 bg-white rounded-lg border border-blue-100">
              <div><p className={labelStyle}>Last Call Date</p><p className={valueStyle}>{lead.lastCallDate ? new Date(lead.lastCallDate).toLocaleDateString() : "N/A"}</p></div>
              <div><p className={labelStyle}>Next Follow-up Date</p><p className={valueStyle}>{lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : "N/A"}</p></div>
              <div className="col-span-2"><p className={labelStyle}>Follow-up Remarks</p><p className={valueStyle}>{lead.followUpRemarks || "None"}</p></div>
            </div>
          </div>

          {/* 5. EXAM SCORES & HISTORY */}
          <div className="bg-purple-50/50 p-6 rounded-xl shadow-sm border border-purple-100 mb-6">
            <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-4 flex justify-between items-center">
              <span className="flex items-center gap-2">📝 5. Exam Scores & History</span>
              {lead.examinerStatus && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${lead.examinerStatus === "Approved" ? "bg-emerald-100 text-emerald-700" : lead.examinerStatus === "Denied" ? "bg-red-100 text-red-700" : "bg-purple-200 text-purple-800"}`}>
                  {lead.examinerStatus.toUpperCase()}
                </span>
              )}
            </h2>

            {!lead.examinerStatus || lead.examinerStatus === "Pending" || lead.examinerStatus === "" ? (
              <p className="text-sm text-purple-600 font-medium italic p-4 bg-white rounded-lg border border-purple-100">
                No exam scores recorded yet. Candidate is pending evaluation.
              </p>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-purple-800 mb-3 uppercase tracking-wider">Current Final Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">English Assessment</p>
                      <p className="text-2xl font-black text-slate-800">{lead.englishScore || 0}<span className="text-sm text-slate-400 font-medium">/100</span></p>
                      <p className={`text-sm font-bold mt-1 ${lead.englishTestResult === "Passed" ? "text-emerald-600" : "text-red-600"}`}>{lead.englishTestResult}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Driving / Yard Test</p>
                      <p className="text-2xl font-black text-slate-800">{lead.drivingScore || 0}<span className="text-sm text-slate-400 font-medium">/100</span></p>
                      <p className={`text-sm font-bold mt-1 ${lead.yardTestResult === "Passed" ? "text-emerald-600" : "text-red-600"}`}>{lead.yardTestResult}</p>
                    </div>
                  </div>
                  
                  {lead.examinerRemarks && (
                    <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-2">Latest Examiner Remarks</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.examinerRemarks}</p>
                    </div>
                  )}
                </div>

                {/* THE MISSING HISTORY BLOCK - RESTORED! */}
                {lead.testEvaluations?.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-purple-200">
                    <h3 className="text-sm font-bold text-purple-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                      🕒 Complete Testing History ({lead.testEvaluations.length} Attempts)
                    </h3>
                    <div className="space-y-3">
                      {lead.testEvaluations.map((test: any, index: number) => (
                        <div key={test.id} className="bg-white p-4 rounded-lg border border-purple-100 shadow-sm">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                            <span className="text-xs font-bold text-slate-500">
                              Attempt {lead.testEvaluations.length - index} • {new Date(test.createdAt).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                              test.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            }`}>
                              {test.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-slate-500 text-xs uppercase tracking-wider">English:</span> <span className="font-bold">{test.englishScore}/100</span> <span className="text-slate-400">({test.englishTestResult})</span>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs uppercase tracking-wider">Driving:</span> <span className="font-bold">{test.drivingScore}/100</span> <span className="text-slate-400">({test.yardTestResult})</span>
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
            )}
          </div>

          {/* 6. SALES REMARKS */}
          <div className={sectionStyle}>
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">💭 6. Sales Remarks & Notes</h2>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{lead.salesRemarks || "No sales remarks provided."}</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN - CLEAN & SCROLLABLE ACTIVITY TIMELINE */}
        <div className="lg:col-span-1">
          {/* max-h-[800px] ensures it never grows beyond the screen, and overflow-hidden keeps it tidy */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 sticky top-6 flex flex-col max-h-[800px] overflow-hidden">
            
            {/* Timeline Header (Sticky so it stays visible while scrolling) */}
            <div className="p-5 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 relative z-20">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">⏱️ Activity History</h3>
              <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
                {lead.activities?.length || 0} Events
              </span>
            </div>
            
            {/* Timeline Feed (Scrollable Area) */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              {(!lead.activities || lead.activities.length === 0) ? (
                <p className="text-slate-400 text-sm italic text-center py-4">No activities recorded yet.</p>
              ) : (
                <div className="relative">
                  {/* The continuous background line - Anchored perfectly so it doesn't break scrolling */}
                  <div className="absolute top-2 bottom-0 left-[11px] w-[2px] bg-slate-100"></div>

                  <div className="space-y-6">
                    {lead.activities.map((activity: any) => {
                      
                      // 🎨 SMART COLOR LOGIC
                      const actionStr = activity.action.toLowerCase();
                      let dotColor = "bg-slate-400";
                      let bgColor = "bg-white";
                      let borderColor = "border-slate-200";

                      // Automatically color codes the box based on what the action was!
                      if (actionStr.includes("transfer") || actionStr.includes("approve")) {
                        dotColor = "bg-emerald-500"; borderColor = "border-emerald-200"; bgColor = "bg-emerald-50/30";
                      } else if (actionStr.includes("deny") || actionStr.includes("fail")) {
                        dotColor = "bg-red-500"; borderColor = "border-red-200"; bgColor = "bg-red-50/30";
                      } else if (actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test")) {
                        dotColor = "bg-purple-500"; borderColor = "border-purple-200"; bgColor = "bg-purple-50/30";
                      } else if (actionStr.includes("update") || actionStr.includes("stage")) {
                        dotColor = "bg-blue-500"; borderColor = "border-blue-200"; bgColor = "bg-blue-50/30";
                      }

                      return (
                        <div key={activity.id} className="relative flex items-start gap-4 z-10 group">
                          
                          {/* Colored Timeline Dot */}
                          <div className="flex flex-col items-center pt-1.5 shrink-0">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 ${borderColor} z-10`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                            </div>
                          </div>
                          
                          {/* Clean Content Box */}
                          <div className={`flex-1 ${bgColor} p-4 rounded-xl border ${borderColor} shadow-sm transition-all hover:shadow-md`}>
                            
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <span className="font-bold text-slate-800 text-sm">{activity.action}</span>
                              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                                {new Date(activity.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {activity.details && (
                              <p className="text-xs text-slate-600 mb-3 leading-relaxed">{activity.details}</p>
                            )}
                            
                            {/* User & Time Footer */}
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium border-t border-slate-200/60 pt-2">
                              <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                                {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                              </span>
                              {activity.user?.name || "System"}
                              <span className="text-slate-300">•</span>
                              <span>{new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
    </div>
  );
}