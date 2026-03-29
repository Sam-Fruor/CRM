// src/app/(dashboard)/examiner/DateFilter.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";

const Icons = {
  Calendar: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
};

export default function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const selectedDate = searchParams.get("date") || "";
  const activeTab = searchParams.get("tab") || "pending";

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      router.push(`/examiner?tab=${activeTab}&date=${newDate}`);
    } else {
      router.push(`/examiner?tab=${activeTab}`);
    }
  };

  const clearFilter = () => {
    router.push(`/examiner?tab=${activeTab}`);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-purple-500">
          <Icons.Calendar />
        </div>
        <input 
          type="date" 
          value={selectedDate}
          onChange={handleDateChange}
          className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none shadow-sm transition-all cursor-pointer hover:border-purple-300"
        />
      </div>
      
      {selectedDate && (
        <button 
          onClick={clearFilter}
          className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Icons.XCircle /> Clear Filter
        </button>
      )}
    </div>
  );
}