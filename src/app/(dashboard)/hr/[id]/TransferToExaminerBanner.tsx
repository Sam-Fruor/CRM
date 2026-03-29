// src/app/(dashboard)/hr/[id]/TransferToExaminerBanner.tsx
"use client";

import { useState } from "react";
import { updateHRFile } from "@/app/actions/hrActions";
import toast from "react-hot-toast";

const Icons = {
  BadgeCheck: () => (
    <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
  Loading: () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
};

export default function TransferToExaminerBanner({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("caseStatus", "Transferred to Examiner"); 

      await updateHRFile(leadId, formData);
      toast.success("File archived and transferred to Examiner!");
      
      setTimeout(() => {
        window.location.href = "/hr/archived";
      }, 1000);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to transfer file.");
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-100/80 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-300 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 animate-in fade-in slide-in-from-top-4">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-700"></div>
      <div className="flex items-center gap-5 z-10 w-full md:w-auto">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 shrink-0">
          <Icons.BadgeCheck />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Ready for Final Examiner Review
          </h2>
          <p className="text-slate-600 font-medium mt-1 text-sm max-w-lg leading-relaxed">
            All HR documentation has been verified. Submit this file to archive it from the active queue and pass it to the Examiner.
          </p>
        </div>
      </div>
      <div className="w-full md:w-auto z-10 shrink-0">
        <button 
          onClick={handleTransfer}
          disabled={loading}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg transition-all hover:scale-105 active:scale-95 disabled:bg-slate-400 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Icons.Loading /> Archiving...</>
          ) : (
            <>Archive & Transfer <Icons.ArrowRight /></>
          )}
        </button>
      </div>
    </div>
  );
}