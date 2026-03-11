// src/app/(dashboard)/sales/[id]/edit/EditLeadForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStage1 } from "@/app/actions/leadActions";

const COUNTRY_LIST = [
  "Bahrain", "Bangladesh", "Croatia", "Egypt", "India", 
  "Kuwait", "Latvia", "Lithuania", "Nepal", "Oman", 
  "Pakistan", "Philippines", "Poland", "Qatar", "Romania", 
  "Saudi Arabia", "Serbia", "Sri Lanka", "United Arab Emirates", 
  "United Kingdom", "Other"
].sort();

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "";
  return new Date(date).toISOString().split('T')[0];
};

export default function EditLeadForm({ lead }: { lead: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [dob, setDob] = useState(formatDate(lead.dob));
  const [hasPreviousAgency, setHasPreviousAgency] = useState(!!lead.previousAgency);
  const [hasPreviousCountry, setHasPreviousCountry] = useState(!!lead.previousCountry);

  // State for "Others" conditionals
  const [leadSource, setLeadSource] = useState(lead.leadSource || "");
  const [category, setCategory] = useState(lead.category || "");
  const [countryPreferred, setCountryPreferred] = useState(lead.countryPreferred || "");

  const docs = lead.documentStatus || {};

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = calculateAge(dob);
  const isOver50 = age !== null && age > 50;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await updateLeadStage1(lead.id, formData);
      router.push(`/sales/${lead.id}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500";
  const labelStyle = "block text-sm font-semibold text-slate-700 mb-1.5";
  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Lead: {lead.givenName} {lead.surname}</h1>
        <p className="text-slate-500 text-sm">Update Step 1 client onboarding information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: THE FORM */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            
            {/* 1. ROUTING INFORMATION */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">1. Routing Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelStyle}>Lead Source <span className="text-red-500">*</span></label>
                  <select name="leadSource" value={leadSource} onChange={(e) => setLeadSource(e.target.value)} required className={inputStyle}>
                    <option value="">Select...</option>
                    <option value="Facebook">Facebook</option>
                    <option value="TikTok">TikTok</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Referral">Referral</option>
                    <option value="Others">Others</option>
                  </select>
                  {leadSource === "Others" && (
                    <input type="text" name="leadSourceOther" defaultValue={lead.leadSourceOther} placeholder="Specify source" className={`mt-2 ${inputStyle}`} required />
                  )}
                </div>
                <div>
                  <label className={labelStyle}>Category <span className="text-red-500">*</span></label>
                  <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} required className={inputStyle}>
                    <option value="">Select...</option>
                    <option value="Bus Driver">Bus Driver</option>
                    <option value="Trailer Driver">Trailer Driver</option>
                    <option value="Mechanics">Mechanics</option>
                    <option value="Others">Others</option>
                  </select>
                  {category === "Others" && (
                    <input type="text" name="categoryOther" defaultValue={lead.categoryOther} placeholder="Specify category" className={`mt-2 ${inputStyle}`} required />
                  )}
                </div>
                <div>
                  <label className={labelStyle}>Country Preferred <span className="text-red-500">*</span></label>
                  <select name="countryPreferred" value={countryPreferred} onChange={(e) => setCountryPreferred(e.target.value)} required className={inputStyle}>
                    <option value="">Select...</option>
                    <option value="Latvia">Latvia</option>
                    <option value="Romania">Romania</option>
                    <option value="Croatia">Croatia</option>
                    <option value="Others">Others</option>
                  </select>
                  {countryPreferred === "Others" && (
                    <input type="text" name="countryOther" defaultValue={lead.countryOther} placeholder="Specify country" className={`mt-2 ${inputStyle}`} required />
                  )}
                </div>
              </div>
            </div>

            {/* 2. CLIENT INFORMATION */}
            <div className={sectionStyle}>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-slate-800">2. Client Information</h2>
                {isOver50 && (
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                    ⚠️ OVER 50 YEARS OLD
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelStyle}>Given Name <span className="text-red-500">*</span></label>
                  <input type="text" name="givenName" defaultValue={lead.givenName} required className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Surname <span className="text-red-500">*</span></label>
                  <input type="text" name="surname" defaultValue={lead.surname} required className={inputStyle} />
                </div>
                
                <div>
                  <label className={labelStyle}>Father's Name</label>
                  <input type="text" name="fatherName" defaultValue={lead.fatherName} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Date of Birth <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <input type="date" name="dob" required className={inputStyle} value={dob} onChange={(e) => setDob(e.target.value)} />
                    <div className="w-24 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center font-bold text-slate-600">
                      {age !== null ? `${age} yrs` : 'Age'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Phone Number (UAE) <span className="text-red-500">*</span></label>
                  <input type="text" name="callingNumber" defaultValue={lead.callingNumber} required className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>WhatsApp Number</label>
                  <input type="text" name="whatsappNumber" defaultValue={lead.whatsappNumber} className={inputStyle} />
                </div>

                <div>
                  <label className={labelStyle}>Email Address</label>
                  <input type="email" name="email" defaultValue={lead.email} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Nationality <span className="text-red-500">*</span></label>
                  <input type="text" name="nationality" defaultValue={lead.nationality} required className={inputStyle} />
                </div>
              </div>
            </div>

            {/* 3. EXPERIENCE & AGENCY HISTORY */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">3. Experience & Agency History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelStyle}>Home Country Exp (Years)</label><input type="number" name="experienceHome" defaultValue={lead.experienceHome} min="0" max="50" className={inputStyle} /></div>
                <div><label className={labelStyle}>GCC Exp (Years)</label><input type="number" name="experienceGCC" defaultValue={lead.experienceGCC} min="0" max="50" className={inputStyle} /></div>
                
                {/* Conditional Previous Agency */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className={labelStyle}>Previous Agency Applied?</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="hasAgency" checked={hasPreviousAgency} onChange={() => setHasPreviousAgency(true)} className="w-4 h-4 text-blue-600" /> Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="hasAgency" checked={!hasPreviousAgency} onChange={() => setHasPreviousAgency(false)} className="w-4 h-4 text-blue-600" /> No
                    </label>
                  </div>
                  {hasPreviousAgency && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input type="text" name="previousAgency" defaultValue={lead.previousAgency} required className={inputStyle} placeholder="Enter agency name..." />
                    </div>
                  )}
                </div>

                {/* Conditional Previous Country */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <label className={labelStyle}>Previous Country Applied?</label>
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="hasCountry" checked={hasPreviousCountry} onChange={() => setHasPreviousCountry(true)} className="w-4 h-4 text-blue-600" /> Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input type="radio" name="hasCountry" checked={!hasPreviousCountry} onChange={() => setHasPreviousCountry(false)} className="w-4 h-4 text-blue-600" /> No
                    </label>
                  </div>
                  {hasPreviousCountry && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <select name="previousCountry" defaultValue={lead.previousCountry} required className={inputStyle}>
                        <option value="">Select a country...</option>
                        {COUNTRY_LIST.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. DOCUMENTS & ID DETAILS */}
            <div className="bg-blue-50/50 p-6 rounded-xl shadow-sm border border-blue-100 mb-6">
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-100 pb-3 mb-4">4. Documents & ID Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" name="resumeUploaded" defaultChecked={docs.resumeUploaded} className="w-5 h-5" />
                  <label className="font-bold text-slate-700">1. CV / RESUME</label>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" name="dlUploaded" defaultChecked={docs.dlUploaded} className="w-5 h-5" />
                    <label className="font-bold text-slate-700">2. DRIVING LICENCE</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                    <div><label className="text-xs text-slate-500">DL Number</label><input type="text" name="dlNumber" defaultValue={lead.dlNumber} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="dlIssueDate" defaultValue={formatDate(lead.dlIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="dlExpiry" defaultValue={formatDate(lead.dlExpiry)} className={inputStyle} /></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" name="residentIdUploaded" defaultChecked={docs.residentIdUploaded} className="w-5 h-5" />
                    <label className="font-bold text-slate-700">3. RESIDENT ID</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                    <div><label className="text-xs text-slate-500">ID Number</label><input type="text" name="residentIdNum" defaultValue={lead.residentIdNum} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="residentIdIssueDate" defaultValue={formatDate(lead.residentIdIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="residentIdExp" defaultValue={formatDate(lead.residentIdExp)} className={inputStyle} /></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" name="passportUploaded" defaultChecked={docs.passportUploaded} className="w-5 h-5" />
                    <label className="font-bold text-slate-700">4. PASSPORT</label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                    <div><label className="text-xs text-slate-500">Passport Number</label><input type="text" name="passportNum" defaultValue={lead.passportNum} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="passportIssueDate" defaultValue={formatDate(lead.passportIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="passportExpiry" defaultValue={formatDate(lead.passportExpiry)} className={inputStyle} /></div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" name="videoUploaded" defaultChecked={docs.videoUploaded} className="w-5 h-5" />
                  <label className="font-bold text-slate-700">5. TEST OR DRIVING VIDEO</label>
                </div>

                <div className="flex items-center gap-3">
                  <input type="checkbox" name="otherUploaded" defaultChecked={docs.otherUploaded} className="w-5 h-5" />
                  <label className="font-bold text-slate-700">6. OTHER</label>
                </div>
              </div>
            </div>

            {/* 5. SALES PROCESSING & FEEDBACK */}
            <div className="bg-orange-50/50 p-6 rounded-xl shadow-sm border border-orange-100 mb-6">
              <h2 className="text-lg font-bold text-orange-900 border-b border-orange-100 pb-3 mb-4">5. Sales Processing & Feedback</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="md:col-span-3">
                  <label className={labelStyle}>Feedback / Conversion Status</label>
                  <select name="feedbackStatus" defaultValue={lead.feedbackStatus || ""} className={inputStyle}>
                    <option value="">Pending Update...</option>
                    <option value="Converted">Converted</option>
                    <option value="Not Responding">Not Responding</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Not Eligible">Not Eligible</option>
                    <option value="Client is for Next Test">Client is for Next Test</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Slot Booking Date</label>
                  <input type="date" name="slotBookingDate" defaultValue={formatDate(lead.slotBookingDate)} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Test Date</label>
                  <input type="date" name="testDate" defaultValue={formatDate(lead.testDate)} className={inputStyle} />
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-orange-200 mb-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Payment Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><label className={labelStyle}>Test Fees Amt</label><input type="number" step="0.01" name="testFeesAmount" defaultValue={lead.testFeesAmount} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Total Payment</label><input type="number" step="0.01" name="totalPayment" defaultValue={lead.totalPayment} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Invoice No.</label><input type="text" name="invoiceNumber" defaultValue={lead.invoiceNumber} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Payment Date</label><input type="date" name="paymentDate" defaultValue={formatDate(lead.paymentDate)} className={inputStyle} /></div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <h3 className="text-sm font-bold text-slate-800 mb-3">Follow-up Remarks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className={labelStyle}>Last Call Date</label><input type="date" name="lastCallDate" defaultValue={formatDate(lead.lastCallDate)} className={inputStyle} /></div>
                  <div><label className={labelStyle}>Next Follow-up Date</label><input type="date" name="followUpDate" defaultValue={formatDate(lead.followUpDate)} className={inputStyle} /></div>
                  <div className="md:col-span-2">
                    <label className={labelStyle}>Remark's</label>
                    <input type="text" name="followUpRemarks" defaultValue={lead.followUpRemarks} className={inputStyle} />
                  </div>
                </div>
              </div>
            </div>

            {/* 6. REMARKS */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">6. Remarks</h2>
              <textarea name="salesRemarks" defaultValue={lead.salesRemarks} rows={3} className={inputStyle}></textarea>
            </div>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => router.push(`/sales/${lead.id}`)} className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={loading} className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-sm ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
                {loading ? "Updating..." : "Save & Update Lead"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: THE ACTIVITY TIMELINE */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Activity Timeline</h2>
            <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
              {lead.activities?.map((activity: any) => (
                <div key={activity.id} className="relative pl-6">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                  <p className="text-sm font-bold text-slate-800">{activity.action}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{activity.user?.name || "System"}</span>
                    {" • "} 
                    <span suppressHydrationWarning>{new Date(activity.createdAt).toLocaleString()}</span>
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