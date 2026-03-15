// src/app/(dashboard)/sales/form/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLead, checkDuplicateLead } from "@/app/actions/leadActions";

const COUNTRY_LIST = [
  "Bahrain", "Bangladesh", "Croatia", "Egypt", "India", 
  "Kuwait", "Latvia", "Lithuania", "Nepal", "Oman", 
  "Pakistan", "Philippines", "Poland", "Qatar", "Romania", 
  "Saudi Arabia", "Serbia", "Sri Lanka", "United Arab Emirates", 
  "United Kingdom", "Other"
].sort();

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Track if the user has typed anything for the warnings
  const [isDirty, setIsDirty] = useState(false);
  
  const [dob, setDob] = useState("");
  const [hasPreviousAgency, setHasPreviousAgency] = useState(false);
  const [hasPreviousCountry, setHasPreviousCountry] = useState(false);

  // State for "Others" conditionals
  const [leadSource, setLeadSource] = useState("");
  const [category, setCategory] = useState("");
  const [countryPreferred, setCountryPreferred] = useState("");

  // 🔎 LIVE FORM DATA TRACKER (For Duplicate Scanner)
  const [formDataTracker, setFormDataTracker] = useState({
    callingNumber: "",
    passportNum: ""
  });

  // 🚨 DUPLICATE ALERT STATE
  const [duplicateAlert, setDuplicateAlert] = useState<{message: string} | null>(null);

  // 🛑 1. WARN BEFORE LEAVING (Native Browser Refresh/Close)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 🛑 2. GLOBAL CLICK WARNING (Next.js Sidebar Links & Sign Out)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isDirty) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      const button = target.closest("button");

      // Ignore our own form buttons
      if (button && (button.type === "submit" || button.id === "cancel-button")) {
        return;
      }

      if (anchor || button) {
        if (!window.confirm("You have unsaved changes. Are you sure you want to leave this page?")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => document.removeEventListener("click", handleGlobalClick, { capture: true });
  }, [isDirty]);

  // 🛑 3. THE GLOBAL DUPLICATE SCANNER
  useEffect(() => {
    const phone = formDataTracker.callingNumber;
    const passport = formDataTracker.passportNum;

    if (!phone && !passport) {
      setDuplicateAlert(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // Call the Server Action directly
        const data = await checkDuplicateLead(phone, passport);

        if (data?.duplicate) {
          setDuplicateAlert({
            message: `Client already exists in ${data.branch} under ID: ${data.shortId}`
          });
        } else {
          setDuplicateAlert(null);
        }
      } catch (error) {
        console.error(error);
      }
    }, 500); // Wait 500ms after they stop typing

    return () => clearTimeout(delayDebounceFn);
  }, [formDataTracker.callingNumber, formDataTracker.passportNum]);


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
    setIsDirty(false); // Turn off warning since we are saving
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await createLead(formData);
      router.push("/sales/leads");
      router.refresh();
    } catch (error) {
      console.error("Failed to create lead:", error);
      setLoading(false);
      setIsDirty(true); // Turn warning back on if save failed
    }
  };

  const inputStyle = "w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-shadow";
  const labelStyle = "block text-sm font-semibold text-slate-700 mb-1.5";
  const sectionStyle = "bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6";

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Add New Lead</h1>
        <p className="text-slate-500 text-sm">Create a new client profile and start the Stage 1 onboarding process.</p>
      </div>

      <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
        
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
                <input type="text" name="leadSourceOther" placeholder="Specify source" className={`mt-2 ${inputStyle}`} required />
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
                <input type="text" name="categoryOther" placeholder="Specify category" className={`mt-2 ${inputStyle}`} required />
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
                <input type="text" name="countryOther" placeholder="Specify country" className={`mt-2 ${inputStyle}`} required />
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
            <div><label className={labelStyle}>Given Name <span className="text-red-500">*</span></label><input type="text" name="givenName" required className={inputStyle} /></div>
            <div><label className={labelStyle}>Surname <span className="text-red-500">*</span></label><input type="text" name="surname" required className={inputStyle} /></div>
            <div><label className={labelStyle}>Father's Name</label><input type="text" name="fatherName" className={inputStyle} /></div>
            
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
              <input 
                type="text" 
                name="callingNumber" 
                required 
                className={inputStyle} 
                onChange={(e) => setFormDataTracker({...formDataTracker, callingNumber: e.target.value})}
              />
            </div>
            <div><label className={labelStyle}>WhatsApp Number</label><input type="text" name="whatsappNumber" className={inputStyle} /></div>
            <div><label className={labelStyle}>Email Address</label><input type="email" name="email" className={inputStyle} /></div>
            <div><label className={labelStyle}>Nationality <span className="text-red-500">*</span></label><input type="text" name="nationality" required className={inputStyle} /></div>
          </div>
        </div>

        {/* 3. EXPERIENCE & AGENCY HISTORY */}
        <div className={sectionStyle}>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">3. Experience & Agency History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div><label className={labelStyle}>Home Country Exp (Years)</label><input type="number" name="experienceHome" min="0" max="50" className={inputStyle} /></div>
            <div><label className={labelStyle}>GCC Exp (Years)</label><input type="number" name="experienceGCC" min="0" max="50" className={inputStyle} /></div>
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className={labelStyle}>Previous Agency Applied?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="hasAgency" onChange={() => setHasPreviousAgency(true)} className="w-4 h-4 text-blue-600" /> Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="hasAgency" defaultChecked onChange={() => setHasPreviousAgency(false)} className="w-4 h-4 text-blue-600" /> No
                </label>
              </div>
              {hasPreviousAgency && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <input type="text" name="previousAgency" required className={inputStyle} placeholder="Enter agency name..." />
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <label className={labelStyle}>Previous Country Applied?</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="hasCountry" onChange={() => setHasPreviousCountry(true)} className="w-4 h-4 text-blue-600" /> Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                  <input type="radio" name="hasCountry" defaultChecked onChange={() => setHasPreviousCountry(false)} className="w-4 h-4 text-blue-600" /> No
                </label>
              </div>
              {hasPreviousCountry && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <select name="previousCountry" required className={inputStyle}>
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
              <input type="checkbox" name="resumeUploaded" className="w-5 h-5" />
              <label className="font-bold text-slate-700">1. CV / RESUME</label>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" name="dlUploaded" className="w-5 h-5" />
                <label className="font-bold text-slate-700">2. DRIVING LICENCE</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                <div><label className="text-xs text-slate-500">DL Number</label><input type="text" name="dlNumber" className={inputStyle} /></div>
                <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="dlIssueDate" className={inputStyle} /></div>
                <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="dlExpiry" className={inputStyle} /></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" name="residentIdUploaded" className="w-5 h-5" />
                <label className="font-bold text-slate-700">3. RESIDENT ID</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                <div><label className="text-xs text-slate-500">ID Number</label><input type="text" name="residentIdNum" className={inputStyle} /></div>
                <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="residentIdIssueDate" className={inputStyle} /></div>
                <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="residentIdExp" className={inputStyle} /></div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <input type="checkbox" name="passportUploaded" className="w-5 h-5" />
                <label className="font-bold text-slate-700">4. PASSPORT</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-8">
                <div><label className="text-xs text-slate-500">Passport Number</label>
                  <input 
                    type="text" 
                    name="passportNum" 
                    className={inputStyle} 
                    onChange={(e) => setFormDataTracker({...formDataTracker, passportNum: e.target.value})}
                  />
                </div>
                <div><label className="text-xs text-slate-500">Issue Date</label><input type="date" name="passportIssueDate" className={inputStyle} /></div>
                <div><label className="text-xs text-slate-500">Expiry Date</label><input type="date" name="passportExpiry" className={inputStyle} /></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" name="videoUploaded" className="w-5 h-5" />
              <label className="font-bold text-slate-700">5. TEST OR DRIVING VIDEO</label>
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" name="otherUploaded" className="w-5 h-5" />
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
              <select name="feedbackStatus" className={inputStyle}>
                <option value="">Pending Update...</option>
                <option value="Converted">Converted</option>
                <option value="Not Responding">Not Responding</option>
                <option value="Not Interested">Not Interested</option>
                <option value="Not Eligible">Not Eligible</option>
                <option value="Client is for Next Test">Client is for Next Test</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div><label className={labelStyle}>Slot Booking Date</label><input type="date" name="slotBookingDate" className={inputStyle} /></div>
            <div><label className={labelStyle}>Test Date</label><input type="date" name="testDate" className={inputStyle} /></div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-orange-200 mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Payment Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><label className={labelStyle}>Test Fees Amt</label><input type="number" step="0.01" name="testFeesAmount" className={inputStyle} /></div>
              <div><label className={labelStyle}>Total Payment</label><input type="number" step="0.01" name="totalPayment" className={inputStyle} /></div>
              <div><label className={labelStyle}>Invoice No.</label><input type="text" name="invoiceNumber" className={inputStyle} /></div>
              <div><label className={labelStyle}>Payment Date</label><input type="date" name="paymentDate" className={inputStyle} /></div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-orange-200">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Follow-up Remarks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelStyle}>Last Call Date</label><input type="date" name="lastCallDate" className={inputStyle} /></div>
              <div><label className={labelStyle}>Next Follow-up Date</label><input type="date" name="followUpDate" className={inputStyle} /></div>
              <div className="md:col-span-2">
                <label className={labelStyle}>Remark's</label>
                <input type="text" name="followUpRemarks" className={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* 6. REMARKS */}
        <div className={sectionStyle}>
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">6. Remarks</h2>
          <textarea name="salesRemarks" rows={3} className={inputStyle}></textarea>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            id="cancel-button"
            onClick={() => {
              if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to cancel?")) return;
              router.push("/sales/leads");
            }} 
            className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || duplicateAlert !== null} 
            className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-sm ${
              loading || duplicateAlert ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Creating..." : "Save & Create Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}