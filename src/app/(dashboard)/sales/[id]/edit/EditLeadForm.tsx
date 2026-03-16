// src/app/(dashboard)/sales/[id]/edit/EditLeadForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateLeadStage1, checkDuplicateLead } from "@/app/actions/leadActions";

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

  const [leadSource, setLeadSource] = useState(lead.leadSource || "");
  const [category, setCategory] = useState(lead.category || "");
  const [countryPreferred, setCountryPreferred] = useState(lead.countryPreferred || "");

  const docs = lead.documentStatus || {};

  // 🔎 LIVE FORM DATA TRACKER (For Duplicate Scanner)
  const [formDataTracker, setFormDataTracker] = useState({
    callingNumber: lead.callingNumber || "",
    passportNum: lead.passportNum || ""
  });

  // 🚨 DUPLICATE ALERT STATE
  const [duplicateAlert, setDuplicateAlert] = useState<{message: string} | null>(null);

  // 🛑 THE GLOBAL DUPLICATE SCANNER (Edit Mode - Ignores Current Lead)
  useEffect(() => {
    const phone = formDataTracker.callingNumber;
    const passport = formDataTracker.passportNum;

    // If both are empty, or if they haven't changed from the original lead data, clear alerts
    if (!phone && !passport) {
      setDuplicateAlert(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Pass lead.id to exclude this specific profile from the scan!
        const data = await checkDuplicateLead(phone, passport, lead.id);
        
        if (data?.duplicate) {
          setDuplicateAlert({
            message: `Alert: This information belongs to an existing client in ${data.branch} under ID: ${data.shortId}`
          });
        } else {
          setDuplicateAlert(null);
        }
      } catch (error) {
        console.error(error);
      }
    }, 500); 

    return () => clearTimeout(delayDebounceFn);
  }, [formDataTracker.callingNumber, formDataTracker.passportNum, lead.id]);


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

  const inputStyle = "w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all";
  const labelStyle = "block text-sm font-semibold text-slate-700 mb-1.5";
  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Lead: {lead.givenName} {lead.surname}</h1>
          <p className="text-slate-500 text-sm">Update Core Onboarding Data (Sections 1-4).</p>
        </div>
        <button type="button" onClick={() => router.push(`/sales/${lead.id}`)} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg transition-colors">
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: THE FORM */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>

            {/* 🚨 DUPLICATE ALERT BANNER */}
            {duplicateAlert && (
              <div className="bg-red-50 border-2 border-red-500 text-red-700 p-6 rounded-xl mb-6 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
                <span className="text-3xl">🛑</span>
                <div>
                  <h3 className="font-bold text-lg">Duplicate File Detected!</h3>
                  <p className="font-medium">{duplicateAlert.message}</p>
                </div>
              </div>
            )}
            
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
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">⚠️ OVER 50 YEARS OLD</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelStyle}>Given Name <span className="text-red-500">*</span></label><input type="text" name="givenName" defaultValue={lead.givenName} required className={inputStyle} /></div>
                <div><label className={labelStyle}>Surname <span className="text-red-500">*</span></label><input type="text" name="surname" defaultValue={lead.surname} required className={inputStyle} /></div>
                <div><label className={labelStyle}>Father's Name</label><input type="text" name="fatherName" defaultValue={lead.fatherName} className={inputStyle} /></div>
                <div>
                  <label className={labelStyle}>Date of Birth <span className="text-red-500">*</span></label>
                  <div className="flex gap-3">
                    <input type="date" name="dob" required className={inputStyle} value={dob} onChange={(e) => setDob(e.target.value)} />
                    <div className="w-24 bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center font-bold text-slate-600">{age !== null ? `${age} yrs` : 'Age'}</div>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Phone Number (UAE) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="callingNumber" 
                    defaultValue={lead.callingNumber} 
                    required 
                    className={inputStyle} 
                    onChange={(e) => setFormDataTracker({...formDataTracker, callingNumber: e.target.value})}
                  />
                </div>
                <div><label className={labelStyle}>WhatsApp Number</label><input type="text" name="whatsappNumber" defaultValue={lead.whatsappNumber} className={inputStyle} /></div>
                <div><label className={labelStyle}>Email Address</label><input type="email" name="email" defaultValue={lead.email} className={inputStyle} /></div>
                <div><label className={labelStyle}>Nationality <span className="text-red-500">*</span></label><input type="text" name="nationality" defaultValue={lead.nationality} required className={inputStyle} /></div>
              </div>
            </div>

            {/* 3. EXPERIENCE & AGENCY HISTORY */}
            <div className={sectionStyle}>
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">3. Experience & Agency History</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className={labelStyle}>Home Country Exp (Years)</label><input type="number" name="experienceHome" defaultValue={lead.experienceHome} min="0" max="50" className={inputStyle} /></div>
                <div><label className={labelStyle}>GCC Exp (Years)</label><input type="number" name="experienceGCC" defaultValue={lead.experienceGCC} min="0" max="50" className={inputStyle} /></div>
                
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
              <h2 className="text-lg font-bold text-blue-900 border-b border-blue-100 pb-3 mb-4 flex justify-between items-center">
                <span>🗂️ 4. ID Details & Expirations</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded">Vault Auto-Sync Enabled</span>
              </h2>
              
              <div className="space-y-4">
                
                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">1. DRIVING LICENCE</label>
                    {docs.dlUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Pending Upload</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div><label className="text-xs text-slate-500">DL Number</label><input type="text" name="dlNumber" defaultValue={lead?.dlNumber} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="dlIssueDate" defaultValue={formatDate(lead?.dlIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="dlExpiry" defaultValue={formatDate(lead?.dlExpiry)} className={inputStyle} /></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">2. RESIDENT ID</label>
                    {docs.residentIdUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Pending Upload</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div><label className="text-xs text-slate-500">ID Number</label><input type="text" name="residentIdNum" defaultValue={lead?.residentIdNum} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="residentIdIssueDate" defaultValue={formatDate(lead?.residentIdIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="residentIdExp" defaultValue={formatDate(lead?.residentIdExp)} className={inputStyle} /></div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <label className="font-bold text-slate-700">3. PASSPORT</label>
                    {docs.passportUploaded ? <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">✅ In Vault</span> : <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Pending Upload</span>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-2">
                    <div>
                      <label className="text-xs text-slate-500">Passport Number</label>
                      <input 
                        type="text" 
                        name="passportNum" 
                        defaultValue={lead?.passportNum} 
                        className={inputStyle} 
                        onChange={(e) => setFormDataTracker({...formDataTracker, passportNum: e.target.value})}
                      />
                    </div>
                    <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="passportIssueDate" defaultValue={formatDate(lead?.passportIssueDate)} className={inputStyle} /></div>
                    <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="passportExpiry" defaultValue={formatDate(lead?.passportExpiry)} className={inputStyle} /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                type="submit" 
                disabled={loading || duplicateAlert !== null} 
                className={`px-10 py-3.5 rounded-lg font-bold text-white shadow-sm ${
                  loading || duplicateAlert ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Saving Core Data..." : "💾 Save Core Profile Data"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN TIMELINE */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6 flex flex-col max-h-[850px] overflow-hidden">
            <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6 shrink-0">Activity Timeline</h2>
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pr-2">
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
    </div>
  );
}