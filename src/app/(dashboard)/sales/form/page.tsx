// src/app/(dashboard)/sales/form/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLead, checkDuplicateLead } from "@/app/actions/leadActions";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

// --- ENTERPRISE ICONS ---
const Icons = {
  Routing: () => <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  User: () => <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Briefcase: () => <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Message: () => <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  Alert: () => <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  Loading: () => <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
};

// 🌍 COMPREHENSIVE NATIONALITY LIST (Alphabetical)
const COUNTRY_LIST = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", 
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", 
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", 
  "Denmark", "Djibouti", "Dominica", "Dominican Republic", 
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", 
  "Fiji", "Finland", "France", 
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", 
  "Haiti", "Honduras", "Hungary", 
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", 
  "Jamaica", "Japan", "Jordan", 
  "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", 
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", 
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", 
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", 
  "Oman", 
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", 
  "Qatar", 
  "Romania", "Russia", "Rwanda", 
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", 
  "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", 
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", 
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam", 
  "Yemen", 
  "Zambia", "Zimbabwe", "Other"
];

// 📞 COMPREHENSIVE COUNTRY CODES (Alphabetical by Country)
const COUNTRY_CODES = [
  { code: "+93", label: "🇦🇫 +93 (Afghanistan)" },
  { code: "+355", label: "🇦🇱 +355 (Albania)" },
  { code: "+213", label: "🇩🇿 +213 (Algeria)" },
  { code: "+376", label: "🇦🇩 +376 (Andorra)" },
  { code: "+244", label: "🇦🇴 +244 (Angola)" },
  { code: "+54", label: "🇦🇷 +54 (Argentina)" },
  { code: "+374", label: "🇦🇲 +374 (Armenia)" },
  { code: "+61", label: "🇦🇺 +61 (Australia)" },
  { code: "+43", label: "🇦🇹 +43 (Austria)" },
  { code: "+994", label: "🇦🇿 +994 (Azerbaijan)" },
  { code: "+973", label: "🇧🇭 +973 (Bahrain)" },
  { code: "+880", label: "🇧🇩 +880 (Bangladesh)" },
  { code: "+375", label: "🇧🇾 +375 (Belarus)" },
  { code: "+32", label: "🇧🇪 +32 (Belgium)" },
  { code: "+501", label: "🇧🇿 +501 (Belize)" },
  { code: "+229", label: "🇧🇯 +229 (Benin)" },
  { code: "+975", label: "🇧🇹 +975 (Bhutan)" },
  { code: "+591", label: "🇧🇴 +591 (Bolivia)" },
  { code: "+387", label: "🇧🇦 +387 (Bosnia)" },
  { code: "+267", label: "🇧🇼 +267 (Botswana)" },
  { code: "+55", label: "🇧🇷 +55 (Brazil)" },
  { code: "+673", label: "🇧🇳 +673 (Brunei)" },
  { code: "+359", label: "🇧🇬 +359 (Bulgaria)" },
  { code: "+226", label: "🇧🇫 +226 (Burkina Faso)" },
  { code: "+257", label: "🇧🇮 +257 (Burundi)" },
  { code: "+855", label: "🇰🇭 +855 (Cambodia)" },
  { code: "+237", label: "🇨🇲 +237 (Cameroon)" },
  { code: "+1", label: "🇨🇦 +1 (Canada)" },
  { code: "+236", label: "🇨🇫 +236 (CAR)" },
  { code: "+235", label: "🇹🇩 +235 (Chad)" },
  { code: "+56", label: "🇨🇱 +56 (Chile)" },
  { code: "+86", label: "🇨🇳 +86 (China)" },
  { code: "+57", label: "🇨🇴 +57 (Colombia)" },
  { code: "+242", label: "🇨🇬 +242 (Congo)" },
  { code: "+506", label: "🇨🇷 +506 (Costa Rica)" },
  { code: "+385", label: "🇭🇷 +385 (Croatia)" },
  { code: "+53", label: "🇨🇺 +53 (Cuba)" },
  { code: "+357", label: "🇨🇾 +357 (Cyprus)" },
  { code: "+420", label: "🇨🇿 +420 (Czechia)" },
  { code: "+45", label: "🇩🇰 +45 (Denmark)" },
  { code: "+253", label: "🇩🇯 +253 (Djibouti)" },
  { code: "+1809", label: "🇩🇴 +1809 (Dominican Rep)" },
  { code: "+593", label: "🇪🇨 +593 (Ecuador)" },
  { code: "+20", label: "🇪🇬 +20 (Egypt)" },
  { code: "+503", label: "🇸🇻 +503 (El Salvador)" },
  { code: "+372", label: "🇪🇪 +372 (Estonia)" },
  { code: "+251", label: "🇪🇹 +251 (Ethiopia)" },
  { code: "+679", label: "🇫🇯 +679 (Fiji)" },
  { code: "+358", label: "🇫🇮 +358 (Finland)" },
  { code: "+33", label: "🇫🇷 +33 (France)" },
  { code: "+241", label: "🇬🇦 +241 (Gabon)" },
  { code: "+220", label: "🇬🇲 +220 (Gambia)" },
  { code: "+995", label: "🇬🇪 +995 (Georgia)" },
  { code: "+49", label: "🇩🇪 +49 (Germany)" },
  { code: "+233", label: "🇬🇭 +233 (Ghana)" },
  { code: "+30", label: "🇬🇷 +30 (Greece)" },
  { code: "+502", label: "🇬🇹 +502 (Guatemala)" },
  { code: "+224", label: "🇬🇳 +224 (Guinea)" },
  { code: "+504", label: "🇭🇳 +504 (Honduras)" },
  { code: "+36", label: "🇭🇺 +36 (Hungary)" },
  { code: "+354", label: "🇮🇸 +354 (Iceland)" },
  { code: "+91", label: "🇮🇳 +91 (India)" },
  { code: "+62", label: "🇮🇩 +62 (Indonesia)" },
  { code: "+98", label: "🇮🇷 +98 (Iran)" },
  { code: "+964", label: "🇮🇶 +964 (Iraq)" },
  { code: "+353", label: "🇮🇪 +353 (Ireland)" },
  { code: "+972", label: "🇮🇱 +972 (Israel)" },
  { code: "+39", label: "🇮🇹 +39 (Italy)" },
  { code: "+1876", label: "🇯🇲 +1876 (Jamaica)" },
  { code: "+81", label: "🇯🇵 +81 (Japan)" },
  { code: "+962", label: "🇯🇴 +962 (Jordan)" },
  { code: "+7", label: "🇰🇿 +7 (Kazakhstan)" },
  { code: "+254", label: "🇰🇪 +254 (Kenya)" },
  { code: "+965", label: "🇰🇼 +965 (Kuwait)" },
  { code: "+996", label: "🇰🇬 +996 (Kyrgyzstan)" },
  { code: "+856", label: "🇱🇦 +856 (Laos)" },
  { code: "+371", label: "🇱🇻 +371 (Latvia)" },
  { code: "+961", label: "🇱🇧 +961 (Lebanon)" },
  { code: "+218", label: "🇱🇾 +218 (Libya)" },
  { code: "+370", label: "🇱🇹 +370 (Lithuania)" },
  { code: "+352", label: "🇱🇺 +352 (Luxembourg)" },
  { code: "+261", label: "🇲🇬 +261 (Madagascar)" },
  { code: "+265", label: "🇲🇼 +265 (Malawi)" },
  { code: "+60", label: "🇲🇾 +60 (Malaysia)" },
  { code: "+960", label: "🇲🇻 +960 (Maldives)" },
  { code: "+223", label: "🇲🇱 +223 (Mali)" },
  { code: "+356", label: "🇲🇹 +356 (Malta)" },
  { code: "+230", label: "🇲🇺 +230 (Mauritius)" },
  { code: "+52", label: "🇲🇽 +52 (Mexico)" },
  { code: "+373", label: "🇲🇩 +373 (Moldova)" },
  { code: "+377", label: "🇲🇨 +377 (Monaco)" },
  { code: "+976", label: "🇲🇳 +976 (Mongolia)" },
  { code: "+382", label: "🇲🇪 +382 (Montenegro)" },
  { code: "+212", label: "🇲🇦 +212 (Morocco)" },
  { code: "+258", label: "🇲🇿 +258 (Mozambique)" },
  { code: "+95", label: "🇲🇲 +95 (Myanmar)" },
  { code: "+264", label: "🇳🇦 +264 (Namibia)" },
  { code: "+977", label: "🇳🇵 +977 (Nepal)" },
  { code: "+31", label: "🇳🇱 +31 (Netherlands)" },
  { code: "+64", label: "🇳🇿 +64 (New Zealand)" },
  { code: "+505", label: "🇳🇮 +505 (Nicaragua)" },
  { code: "+227", label: "🇳🇪 +227 (Niger)" },
  { code: "+234", label: "🇳🇬 +234 (Nigeria)" },
  { code: "+389", label: "🇲🇰 +389 (North Macedonia)" },
  { code: "+47", label: "🇳🇴 +47 (Norway)" },
  { code: "+968", label: "🇴🇲 +968 (Oman)" },
  { code: "+92", label: "🇵🇰 +92 (Pakistan)" },
  { code: "+970", label: "🇵🇸 +970 (Palestine)" },
  { code: "+507", label: "🇵🇦 +507 (Panama)" },
  { code: "+595", label: "🇵🇾 +595 (Paraguay)" },
  { code: "+51", label: "🇵🇪 +51 (Peru)" },
  { code: "+63", label: "🇵🇭 +63 (Philippines)" },
  { code: "+48", label: "🇵🇱 +48 (Poland)" },
  { code: "+351", label: "🇵🇹 +351 (Portugal)" },
  { code: "+974", label: "🇶🇦 +974 (Qatar)" },
  { code: "+40", label: "🇷🇴 +40 (Romania)" },
  { code: "+7", label: "🇷🇺 +7 (Russia)" },
  { code: "+250", label: "🇷🇼 +250 (Rwanda)" },
  { code: "+966", label: "🇸🇦 +966 (Saudi Arabia)" },
  { code: "+221", label: "🇸🇳 +221 (Senegal)" },
  { code: "+381", label: "🇷🇸 +381 (Serbia)" },
  { code: "+248", label: "🇸🇨 +248 (Seychelles)" },
  { code: "+232", label: "🇸🇱 +232 (Sierra Leone)" },
  { code: "+65", label: "🇸🇬 +65 (Singapore)" },
  { code: "+421", label: "🇸🇰 +421 (Slovakia)" },
  { code: "+386", label: "🇸🇮 +386 (Slovenia)" },
  { code: "+252", label: "🇸🇴 +252 (Somalia)" },
  { code: "+27", label: "🇿🇦 +27 (South Africa)" },
  { code: "+82", label: "🇰🇷 +82 (South Korea)" },
  { code: "+34", label: "🇪🇸 +34 (Spain)" },
  { code: "+94", label: "🇱🇰 +94 (Sri Lanka)" },
  { code: "+249", label: "🇸🇩 +249 (Sudan)" },
  { code: "+46", label: "🇸🇪 +46 (Sweden)" },
  { code: "+41", label: "🇨🇭 +41 (Switzerland)" },
  { code: "+963", label: "🇸🇾 +963 (Syria)" },
  { code: "+992", label: "🇹🇯 +992 (Tajikistan)" },
  { code: "+255", label: "🇹🇿 +255 (Tanzania)" },
  { code: "+66", label: "🇹🇭 +66 (Thailand)" },
  { code: "+228", label: "🇹🇬 +228 (Togo)" },
  { code: "+216", label: "🇹🇳 +216 (Tunisia)" },
  { code: "+90", label: "🇹🇷 +90 (Turkey)" },
  { code: "+993", label: "🇹🇲 +993 (Turkmenistan)" },
  { code: "+256", label: "🇺🇬 +256 (Uganda)" },
  { code: "+380", label: "🇺🇦 +380 (Ukraine)" },
  { code: "+971", label: "🇦🇪 +971 (United Arab Emirates)" },
  { code: "+44", label: "🇬🇧 +44 (United Kingdom)" },
  { code: "+1", label: "🇺🇸 +1 (United States)" },
  { code: "+598", label: "🇺🇾 +598 (Uruguay)" },
  { code: "+998", label: "🇺🇿 +998 (Uzbekistan)" },
  { code: "+58", label: "🇻🇪 +58 (Venezuela)" },
  { code: "+84", label: "🇻🇳 +84 (Vietnam)" },
  { code: "+967", label: "🇾🇪 +967 (Yemen)" },
  { code: "+260", label: "🇿🇲 +260 (Zambia)" },
  { code: "+263", label: "🇿🇼 +263 (Zimbabwe)" }
];

export default function NewLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  
  const [dob, setDob] = useState("");
  const [hasPreviousAgency, setHasPreviousAgency] = useState(false);
  const [hasPreviousCountry, setHasPreviousCountry] = useState(false);

  const [leadSource, setLeadSource] = useState("");
  const [category, setCategory] = useState("");
  const [countryPreferred, setCountryPreferred] = useState("");

  // 📱 Contact State Management
  const [phoneCode, setPhoneCode] = useState("+971");
  const [phoneBody, setPhoneBody] = useState("");
  const [waCode, setWaCode] = useState("+971");
  const [waBody, setWaBody] = useState("");
  const [email, setEmail] = useState("");

  // 🛑 Error States
  const [phoneError, setPhoneError] = useState("");
  const [waError, setWaError] = useState("");
  const [emailError, setEmailError] = useState("");

  const [formDataTracker, setFormDataTracker] = useState({
    callingNumber: "",
    passportNum: ""
  });

  const [duplicateAlert, setDuplicateAlert] = useState<{message: string} | null>(null);

  // Update Tracker when Phone changes (Cleans out spaces just for tracking)
  useEffect(() => {
    const cleanBody = phoneBody.replace(/\s/g, '');
    if (cleanBody.length >= 7) {
      setFormDataTracker(prev => ({ ...prev, callingNumber: `${phoneCode} ${cleanBody}` }));
    } else {
      setFormDataTracker(prev => ({ ...prev, callingNumber: "" }));
    }
  }, [phoneCode, phoneBody]);

  // 🛑 1. WARN BEFORE LEAVING
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

  // 🛑 2. GLOBAL CLICK WARNING
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (!isDirty) return;
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      const button = target.closest("button");
      if (button && (button.type === "submit" || button.id === "cancel-button")) return;

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

  // 🛑 3. DUPLICATE SCANNER
  useEffect(() => {
    const phone = formDataTracker.callingNumber;
    const passport = formDataTracker.passportNum;

    if (!phone && !passport) {
      setDuplicateAlert(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
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
    }, 500); 

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
    
    // --- 🚨 STRICT CLIENT VALIDATIONS ---
    let hasError = false;
    const cleanPhone = phoneBody.replace(/\s/g, '');
    const cleanWa = waBody.replace(/\s/g, '');

    if (!cleanPhone || cleanPhone.length < 7 || cleanPhone.length > 15) {
      setPhoneError("Valid phone number (7-15 digits) is required.");
      hasError = true;
    }
    if (cleanWa && (cleanWa.length < 7 || cleanWa.length > 15)) {
      setWaError("Valid WhatsApp number (7-15 digits) is required.");
      hasError = true;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    }

    if (hasError) {
      toast.error("Please fix the errors in red before submitting.");
      return;
    }

    // Passed validation! Proceed.
    setLoading(true);
    setIsDirty(false); 
    
    const formData = new FormData(e.currentTarget);
    
    // 🛠️ Merge Phone Numbers before sending to backend
    formData.set("callingNumber", `${phoneCode} ${cleanPhone}`);
    if (cleanWa) {
      formData.set("whatsappNumber", `${waCode} ${cleanWa}`);
    } else {
      formData.delete("whatsappNumber"); // Keep clean if empty
    }

    // Clean up the temporary UI fields so they don't bloat the payload
    formData.delete("phoneCode");
    formData.delete("phoneBody");
    formData.delete("waCode");
    formData.delete("waBody");
    
    try {
      await createLead(formData);
      toast.success("Lead created successfully!");
      // 🚀 THE FIX: HARD REDIRECT TO CLEAR CACHE AND UNSTICK LOADING STATE
      window.location.href = "/sales/leads";
    } catch (error) {
      console.error("Failed to create lead:", error);
      toast.error("Failed to create lead.");
      setLoading(false);
      setIsDirty(true);
    }
  };

  // 🎨 ENTERPRISE STYLING SYSTEM
  const getBaseInputStyle = (hasErr: boolean) => `w-full px-4 py-2.5 bg-slate-50 border ${hasErr ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500'} text-slate-900 text-sm rounded-xl outline-none hover:bg-white focus:bg-white focus:ring-2 transition-all duration-200 shadow-sm`;
  const getCombinedInputWrapperStyle = (hasErr: boolean) => `flex focus-within:ring-2 border ${hasErr ? 'border-rose-500 focus-within:ring-rose-500/20 focus-within:border-rose-500' : 'border-slate-200 focus-within:ring-indigo-500/20 focus-within:border-indigo-500'} rounded-xl overflow-hidden shadow-sm transition-all duration-200 bg-slate-50 hover:bg-white`;
  
  const labelStyle = "block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider";
  const sectionStyle = "bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200/60 mb-8 relative";

  return (
    <div className="max-w-4xl mx-auto pb-32 pt-4 relative">
      <Toaster position="bottom-right" reverseOrder={false} toastOptions={{ style: { fontSize: '14px', fontWeight: 'bold' } }} />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add New Lead</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Create a new client profile and initiate the Stage 1 onboarding pipeline.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sales/leads" className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2 text-sm">
            <Icons.ArrowLeft /> Back to Leads
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
        
        {/* 🚨 DUPLICATE ALERT */}
        {duplicateAlert && (
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl mb-8 flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-top-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0 border border-rose-100">
              <Icons.Alert />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 tracking-tight text-base">Duplicate File Detected</h3>
              <p className="text-sm font-medium text-rose-700 mt-0.5">{duplicateAlert.message}</p>
            </div>
          </div>
        )}

        {/* 1. ROUTING INFORMATION */}
        <div className={sectionStyle}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <Icons.Routing /> 1. Routing Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className={labelStyle}>Lead Source <span className="text-rose-500">*</span></label>
              <select name="leadSource" value={leadSource} onChange={(e) => setLeadSource(e.target.value)} required className={getBaseInputStyle(false)}>
                <option value="">Select Source...</option>
                <option value="Facebook">Facebook</option>
                <option value="TikTok">TikTok</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Referral">Referral</option>
                <option value="Others">Others</option>
              </select>
              {leadSource === "Others" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input type="text" name="leadSourceOther" placeholder="Specify source" className={getBaseInputStyle(false)} required />
                </div>
              )}
            </div>
            <div>
              <label className={labelStyle}>Category <span className="text-rose-500">*</span></label>
              <select name="category" value={category} onChange={(e) => setCategory(e.target.value)} required className={getBaseInputStyle(false)}>
                <option value="">Select Category...</option>
                <option value="Bus Driver">Bus Driver</option>
                <option value="Trailer Driver">Trailer Driver</option>
                <option value="Mechanics">Mechanics</option>
                <option value="Others">Others</option>
              </select>
              {category === "Others" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input type="text" name="categoryOther" placeholder="Specify category" className={getBaseInputStyle(false)} required />
                </div>
              )}
            </div>
            <div>
              <label className={labelStyle}>Country Preferred <span className="text-rose-500">*</span></label>
              <select name="countryPreferred" value={countryPreferred} onChange={(e) => setCountryPreferred(e.target.value)} required className={getBaseInputStyle(false)}>
                <option value="">Select Country...</option>
                {COUNTRY_LIST.map((country) => (
                  <option key={`pref-${country}`} value={country}>{country}</option>
                ))}
              </select>
              {countryPreferred === "Other" && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                  <input type="text" name="countryOther" placeholder="Specify country" className={getBaseInputStyle(false)} required />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. CLIENT INFORMATION */}
        <div className={sectionStyle}>
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Icons.User /> 2. Client Information
            </h2>
            {isOver50 && (
              <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-md text-[10px] font-bold tracking-wider animate-pulse border border-rose-200 shadow-sm flex items-center gap-1.5">
                OVER 50 YEARS OLD
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className={labelStyle}>Given Name <span className="text-rose-500">*</span></label>
              <input type="text" name="givenName" required className={getBaseInputStyle(false)} placeholder="First Name" />
            </div>
            <div>
              <label className={labelStyle}>Surname <span className="text-rose-500">*</span></label>
              <input type="text" name="surname" required className={getBaseInputStyle(false)} placeholder="Last Name" />
            </div>
            <div>
              <label className={labelStyle}>Father's Name</label>
              <input type="text" name="fatherName" className={getBaseInputStyle(false)} placeholder="Optional" />
            </div>
            
            <div>
              <label className={labelStyle}>Date of Birth <span className="text-rose-500">*</span></label>
              <div className="flex gap-3">
                <input type="date" name="dob" required className={getBaseInputStyle(false)} value={dob} onChange={(e) => setDob(e.target.value)} />
                <div className="w-24 shrink-0 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-bold text-slate-500 shadow-inner text-sm">
                  {age !== null ? `${age} yrs` : 'Age'}
                </div>
              </div>
            </div>

            {/* 📱 COMBINED PHONE INPUT */}
            <div>
              <label className={labelStyle}>Phone Number <span className="text-rose-500">*</span></label>
              <div className={getCombinedInputWrapperStyle(phoneError !== "")}>
                <select 
                  name="phoneCode"
                  value={phoneCode} 
                  onChange={(e) => setPhoneCode(e.target.value)}
                  className="bg-transparent text-slate-700 text-sm font-bold px-3 py-2.5 outline-none cursor-pointer w-[130px] truncate border-r border-slate-200 appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  {COUNTRY_CODES.map((c, index) => <option key={`ph-${index}`} value={c.code}>{c.label}</option>)}
                </select>
                <input 
                  type="text" 
                  name="phoneBody"
                  value={phoneBody}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9 ]/g, ''); // Prevent typing letters/specials instantly
                    setPhoneBody(val);
                    if (phoneError) setPhoneError(""); 
                  }}
                  required 
                  placeholder="50 123 4567"
                  className="flex-1 px-4 py-2.5 bg-transparent text-slate-900 text-sm outline-none w-full" 
                />
              </div>
              {phoneError && <p className="text-xs text-rose-500 mt-1.5 font-bold animate-in fade-in">{phoneError}</p>}
            </div>

            {/* 📱 COMBINED WHATSAPP INPUT */}
            <div>
              <label className={labelStyle}>WhatsApp Number</label>
              <div className={getCombinedInputWrapperStyle(waError !== "")}>
                <select 
                  name="waCode"
                  value={waCode} 
                  onChange={(e) => setWaCode(e.target.value)}
                  className="bg-transparent text-slate-700 text-sm font-bold px-3 py-2.5 outline-none cursor-pointer w-[130px] truncate border-r border-slate-200 appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  {COUNTRY_CODES.map((c, index) => <option key={`wa-${index}`} value={c.code}>{c.label}</option>)}
                </select>
                <input 
                  type="text" 
                  name="waBody"
                  value={waBody}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9 ]/g, ''); 
                    setWaBody(val);
                    if (waError) setWaError("");
                  }}
                  placeholder="50 123 4567"
                  className="flex-1 px-4 py-2.5 bg-transparent text-slate-900 text-sm outline-none w-full" 
                />
              </div>
              {waError && <p className="text-xs text-rose-500 mt-1.5 font-bold animate-in fade-in">{waError}</p>}
            </div>

            <div>
              <label className={labelStyle}>Email Address</label>
              <input 
                type="text" // Using text to manually validate it properly
                name="email" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={getBaseInputStyle(emailError !== "")} 
                placeholder="john@example.com" 
              />
              {emailError && <p className="text-xs text-rose-500 mt-1.5 font-bold animate-in fade-in">{emailError}</p>}
            </div>
            
            <div>
              <label className={labelStyle}>Nationality <span className="text-rose-500">*</span></label>
              <select name="nationality" required className={getBaseInputStyle(false)}>
                <option value="">Select Nationality...</option>
                {COUNTRY_LIST.map((country) => (
                  <option key={`nat-${country}`} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. EXPERIENCE & AGENCY HISTORY */}
        <div className={sectionStyle}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <Icons.Briefcase /> 3. Experience & Agency History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className={labelStyle}>Home Exp (Yrs)</label>
                <input type="number" name="experienceHome" min="0" max="50" className={getBaseInputStyle(false)} placeholder="0" />
              </div>
              <div>
                <label className={labelStyle}>GCC Exp (Yrs)</label>
                <input type="number" name="experienceGCC" min="0" max="50" className={getBaseInputStyle(false)} placeholder="0" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl transition-colors focus-within:border-indigo-300">
                <label className={labelStyle}>Prev. Agency Applied?</label>
                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                    <input type="radio" name="hasAgency" onChange={() => setHasPreviousAgency(true)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                    <input type="radio" name="hasAgency" defaultChecked onChange={() => setHasPreviousAgency(false)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" /> No
                  </label>
                </div>
                {hasPreviousAgency && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input type="text" name="previousAgency" required className={getBaseInputStyle(false)} placeholder="Agency name..." />
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl transition-colors focus-within:border-indigo-300">
                <label className={labelStyle}>Prev. Country Applied?</label>
                <div className="flex gap-6 mt-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                    <input type="radio" name="hasCountry" onChange={() => setHasPreviousCountry(true)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" /> Yes
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 hover:text-indigo-600 transition-colors">
                    <input type="radio" name="hasCountry" defaultChecked onChange={() => setHasPreviousCountry(false)} className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300" /> No
                  </label>
                </div>
                {hasPreviousCountry && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <select name="previousCountry" required className={getBaseInputStyle(false)}>
                      <option value="">Select country...</option>
                      {COUNTRY_LIST.map((country) => (
                        <option key={`prev-${country}`} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4. FOLLOW-UPS & REMARKS */}
        <div className={sectionStyle}>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
            <Icons.Message /> 4. Follow-Ups & Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200/60">
            <div>
              <label className={labelStyle}>Last Call Date</label>
              <input type="date" name="lastCallDate" className={getBaseInputStyle(false)} />
            </div>
            <div>
              <label className={labelStyle}>Next Follow-up Date</label>
              <input type="date" name="followUpDate" className={getBaseInputStyle(false)} />
            </div>
            <div className="md:col-span-2">
              <label className={labelStyle}>Quick Follow-up Remark</label>
              <input type="text" name="followUpRemarks" placeholder="Brief note on the last call..." className={getBaseInputStyle(false)} />
            </div>
          </div>

          <div>
            <label className={labelStyle}>Primary Sales Remarks</label>
            <textarea name="salesRemarks" rows={4} placeholder="Detailed sales notes, client context, requirements, etc..." className={getBaseInputStyle(false)}></textarea>
          </div>
        </div>

        {/* 🚀 FLOATING SUBMIT ACTION BAR */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <div className="bg-slate-900/95 backdrop-blur-md px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-slate-700/80 w-max">
            <button 
              type="button" 
              id="cancel-button"
              onClick={() => {
                if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to cancel?")) return;
                router.push("/sales/leads");
              }} 
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || duplicateAlert !== null} 
              className={`px-8 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                loading || duplicateAlert 
                  ? "bg-slate-600 cursor-not-allowed shadow-none" 
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20"
              }`}
            >
              {loading ? (
                <>
                  <Icons.Loading /> Creating...
                </>
              ) : "Create Lead"}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}