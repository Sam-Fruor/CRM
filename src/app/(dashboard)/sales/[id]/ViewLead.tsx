// src/app/(dashboard)/sales/[id]/ViewLead.tsx

import Link from "next/link";
import { transferToStage2 } from "@/app/actions/leadActions";
import TransferBanner from "./TransferBanner";

export default function ViewLead({ lead }: { lead: any }) {

  const sectionStyle =
    "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";

  const labelStyle =
    "text-xs font-bold text-slate-500 uppercase tracking-wider mb-1";

  const valueStyle =
    "text-sm font-semibold text-slate-800";

  // Bind server action with lead ID
  const transferAction = transferToStage2.bind(null, lead.id);

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* EXAMINER APPROVAL ALERT */}
      {lead.examinerStatus === "Approved" &&
        lead.caseStatus === "Stage 1 Under Process" && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 mb-6 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎉</span>
                <h2 className="text-xl font-bold text-emerald-900">
                  Examiner Approved!
                </h2>
              </div>

              <p className="text-emerald-700 font-medium mt-1">
                This candidate passed their test. Review their file and transfer
                it to Operations when ready.
              </p>
            </div>

            <form action={transferAction}>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95"
              >
                Transfer to Stage 2 🚀
              </button>
            </form>

          </div>
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

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-3">
          <Link 
            href="/sales/leads"
            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Close
          </Link>
          
          {/* 👇 DYNAMIC EDIT BUTTON (Locks if Transferred) */}
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

          {/* Routing Information */}

          <div className={sectionStyle}>

            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Routing Information
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

              <div>
                <p className={labelStyle}>Lead Source</p>
                <p className={valueStyle}>
                  {lead.leadSource === "Others"
                    ? lead.leadSourceOther
                    : lead.leadSource}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Category</p>
                <p className={valueStyle}>
                  {lead.category === "Others"
                    ? lead.categoryOther
                    : lead.category}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Preferred Country</p>
                <p className={valueStyle}>
                  {lead.countryPreferred === "Others"
                    ? lead.countryOther
                    : lead.countryPreferred}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Feedback Status</p>

                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">
                  {lead.feedbackStatus || "Pending"}
                </span>
              </div>

              <div>
                <p className={labelStyle}>Slot Booking Date</p>

                <p className={valueStyle}>
                  {lead.slotBookingDate
                    ? new Date(lead.slotBookingDate).toLocaleDateString()
                    : "Not Booked"}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Test Date</p>

                <p className={valueStyle}>
                  {lead.testDate
                    ? new Date(lead.testDate).toLocaleDateString()
                    : "Not Scheduled"}
                </p>
              </div>

            </div>

          </div>

          {/* Client Details */}

          <div className={sectionStyle}>

            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Client Details & IDs
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">

              <div>
                <p className={labelStyle}>Full Name</p>
                <p className={valueStyle}>
                  {lead.givenName} {lead.surname}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Father's Name</p>
                <p className={valueStyle}>{lead.fatherName || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Date of Birth</p>
                <p className={valueStyle}>
                  {lead.dob
                    ? new Date(lead.dob).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Phone</p>
                <p className={valueStyle}>{lead.callingNumber}</p>
              </div>

              <div>
                <p className={labelStyle}>WhatsApp</p>
                <p className={valueStyle}>{lead.whatsappNumber || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Email</p>
                <p className={valueStyle}>{lead.email || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Nationality</p>
                <p className={valueStyle}>{lead.nationality}</p>
              </div>

              <div>
                <p className={labelStyle}>Passport No.</p>
                <p className={valueStyle}>{lead.passportNum || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Resident ID No.</p>
                <p className={valueStyle}>{lead.residentIdNum || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Driving License No.</p>
                <p className={valueStyle}>{lead.dlNumber || "N/A"}</p>
              </div>

            </div>

          </div>

          {/* Sales Processing */}

          <div className={sectionStyle}>

            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">
              Sales Processing
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">

              <div>
                <p className={labelStyle}>Test Fees</p>
                <p className={valueStyle}>
                  {lead.testFeesAmount ? `$${lead.testFeesAmount}` : "N/A"}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Total Payment</p>
                <p className={valueStyle}>
                  {lead.totalPayment ? `$${lead.totalPayment}` : "N/A"}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Invoice No.</p>
                <p className={valueStyle}>{lead.invoiceNumber || "N/A"}</p>
              </div>

              <div>
                <p className={labelStyle}>Payment Date</p>
                <p className={valueStyle}>
                  {lead.paymentDate
                    ? new Date(lead.paymentDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

            </div>

            <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">

              <div>
                <p className={labelStyle}>Last Call Date</p>
                <p className={valueStyle}>
                  {lead.lastCallDate
                    ? new Date(lead.lastCallDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className={labelStyle}>Next Follow-up Date</p>
                <p className={valueStyle}>
                  {lead.followUpDate
                    ? new Date(lead.followUpDate).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>

              <div className="col-span-2">
                <p className={labelStyle}>Follow-up Remarks</p>
                <p className={valueStyle}>{lead.followUpRemarks || "None"}</p>
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT COLUMN - ACTIVITY */}

        <div className="lg:col-span-1">

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">

            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">
              Activity Timeline
            </h2>

            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">

              {lead.activities?.map((activity: any) => (

                <div key={activity.id} className="relative pl-6">

                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />

                  <p className="text-sm font-bold text-slate-800">
                    {activity.action}
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">
                      {activity.user?.name || "System"}
                    </span>
                    {" • "}
                    <span suppressHydrationWarning>
                      {new Date(activity.createdAt).toLocaleString()}
                    </span>
                  </p>

                  {activity.details && (
                    <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                      {activity.details}
                    </p>
                  )}

                </div>

              ))}

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}