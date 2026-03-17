import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { updateHRFile } from "@/app/actions/hrActions";

export default async function HREditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!lead) notFound();

  // Inline Server Action to handle the form save and redirect back
  async function saveProfileData(formData: FormData) {
    "use server";
    await updateHRFile(lead!.id, formData);
    redirect(`/hr/${lead!.id}?tab=details`);
  }

  const inputStyle = "w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium shadow-sm";
  const labelStyle = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            ✏️ Edit Client Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Correct typos or update official IDs for <span className="font-bold text-slate-700">{lead.givenName} {lead.surname}</span>.
          </p>
        </div>
        <Link href={`/hr/${lead.id}?tab=details`} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          Cancel
        </Link>
      </div>

      <form action={saveProfileData} className="bg-blue-50/50 p-6 rounded-xl shadow-sm border border-blue-200">
        
        {/* Hidden fields so the server action doesn't wipe the HR/Ops data */}
        <input type="hidden" name="caseStatus" value={lead.caseStatus} />
        <input type="hidden" name="serviceAgreementPending" value={lead.serviceAgreementPending || ""} />
        <input type="hidden" name="jobOfferPending" value={lead.jobOfferPending || ""} />
        <input type="hidden" name="workPermitPending" value={lead.workPermitPending || ""} />
        <input type="hidden" name="insurancePending" value={lead.insurancePending || ""} />
        <input type="hidden" name="schoolFeesPending" value={lead.schoolFeesPending || ""} />
        <input type="hidden" name="flightTicketPending" value={lead.flightTicketPending || ""} />
        <input type="hidden" name="hrRemarks" value={lead.hrRemarks || ""} />

        <h2 className="text-lg font-bold text-blue-900 border-b border-blue-200 pb-3 mb-5">
          Update Identity & Identifications
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-8">
          <div><label className={labelStyle}>Given Name</label><input type="text" name="givenName" defaultValue={lead.givenName} className={inputStyle} /></div>
          <div><label className={labelStyle}>Surname</label><input type="text" name="surname" defaultValue={lead.surname} className={inputStyle} /></div>
          <div><label className={labelStyle}>Father's Name</label><input type="text" name="fatherName" defaultValue={lead.fatherName || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>Date of Birth</label><input type="date" name="dob" defaultValue={lead.dob ? new Date(lead.dob).toISOString().split('T')[0] : ''} className={inputStyle} /></div>
          <div><label className={labelStyle}>Phone (UAE)</label><input type="text" name="callingNumber" defaultValue={lead.callingNumber || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>WhatsApp</label><input type="text" name="whatsappNumber" defaultValue={lead.whatsappNumber || ""} className={inputStyle} /></div>
          <div className="md:col-span-2"><label className={labelStyle}>Email</label><input type="email" name="email" defaultValue={lead.email || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>Nationality</label><input type="text" name="nationality" defaultValue={lead.nationality || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>Passport No.</label><input type="text" name="passportNum" defaultValue={lead.passportNum || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>Resident ID No.</label><input type="text" name="residentIdNum" defaultValue={lead.residentIdNum || ""} className={inputStyle} /></div>
          <div><label className={labelStyle}>Driving License No.</label><input type="text" name="dlNumber" defaultValue={lead.dlNumber || ""} className={inputStyle} /></div>
        </div>

        <div className="flex justify-end border-t border-blue-200 pt-5">
          <button type="submit" className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">
            💾 Save Profile Corrections
          </button>
        </div>
      </form>

    </div>
  );
}