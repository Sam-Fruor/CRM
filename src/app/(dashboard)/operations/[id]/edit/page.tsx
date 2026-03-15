// src/app/(dashboard)/operations/[id]/edit/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { updateOpsFile } from "@/app/actions/opsActions";

export default async function OpsEditProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!lead) notFound();

  // Inline Server Action to save and redirect
  async function saveProfileData(formData: FormData) {
    "use server";
    await updateOpsFile(lead!.id, formData);
    redirect(`/operations/${lead!.id}?tab=details`);
  }

  const inputStyle = "w-full p-2.5 bg-white border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-medium shadow-sm";
  const labelStyle = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            ✏️ Edit Operations Profile Data
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Update Identity & Experience records for <span className="font-bold text-slate-700">{lead.givenName} {lead.surname}</span>.
          </p>
        </div>
        <Link href={`/operations/${lead.id}?tab=details`} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
          Cancel
        </Link>
      </div>

      <form action={saveProfileData} className="space-y-6">
        
        {/* HIDDEN PRESERVATION FIELDS */}
        <input type="hidden" name="caseStatus" value={lead.caseStatus} />
        <input type="hidden" name="totalPayment" value={lead.totalPayment || ""} />
        <input type="hidden" name="opsRemarks" value={lead.opsRemarks || ""} />

        {/* 👤 Section 2: Identity & IDs */}
        <div className="bg-indigo-50/40 p-6 rounded-xl shadow-sm border border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-900 border-b border-indigo-200 pb-3 mb-5">
            Section 2: Identity & Official IDs
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-2">
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
        </div>

        {/* 💼 Section 3: Experience & Agency History */}
        <div className="bg-indigo-50/40 p-6 rounded-xl shadow-sm border border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-900 border-b border-indigo-200 pb-3 mb-5">
            Section 3: Experience & Agency History
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-2">
            <div>
              <label className={labelStyle}>Home Exp (Years)</label>
              <input type="number" name="experienceHome" defaultValue={lead.experienceHome || 0} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>GCC Exp (Years)</label>
              <input type="number" name="experienceGCC" defaultValue={lead.experienceGCC || 0} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Previous Agency</label>
              <input type="text" name="previousAgency" defaultValue={lead.previousAgency || ""} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Prev. Country</label>
              <input type="text" name="previousCountry" defaultValue={lead.previousCountry || ""} className={inputStyle} />
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end pt-2">
          <button type="submit" className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-colors w-full md:w-auto">
            💾 Save Profile Corrections
          </button>
        </div>
      </form>

    </div>
  );
}