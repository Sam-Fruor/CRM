// src/components/LeadStepper.tsx
"use client";

const Icons = {
  Check: () => <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Current: () => <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div>,
  Pending: () => <div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div>,
};

export default function LeadStepper({ currentStatus }: { currentStatus: string }) {
  // 🧠 SMART MAPPING LOGIC
  // We group your dozens of complex statuses into 5 clean, easy-to-read macro stages.
  const getStepIndex = () => {
    const status = currentStatus?.toLowerCase() || "";
    
    if (status.includes("dropped") || status.includes("rejected") || status.includes("not enrolled")) return -1; // Failed state
    if (status.includes("visa approved") || status.includes("deployed")) return 5; // Finished
    if (status.includes("visa") || status.includes("flight") || status.includes("school")) return 4; // Stage 5: Visa & Travel
    if (status.includes("job offer") || status.includes("work permit") || status.includes("stage 2")) return 3; // Stage 4: Ops & HR Processing
    if (status.includes("agreement")) return 2; // Stage 3: Agreement
    if (status.includes("stage 1") || status.includes("pending")) return 1; // Stage 2: Assessments
    return 0; // Stage 1: Registered
  };

  const currentIndex = getStepIndex();

  const steps = [
    { label: "Registered", desc: "Lead Created" },
    { label: "Assessments", desc: "Test & Yard" },
    { label: "Agreement", desc: "Contract Signed" },
    { label: "Processing", desc: "Offer & Permit" },
    { label: "Deployment", desc: "Visa & Travel" }
  ];

  if (currentIndex === -1) {
    return (
      <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl mb-6 flex items-center justify-between shadow-sm">
        <div>
          <h3 className="text-rose-800 font-bold text-sm">Processing Halted</h3>
          <p className="text-rose-600 text-xs font-medium mt-0.5">This file has been marked as {currentStatus}.</p>
        </div>
        <span className="px-3 py-1 bg-white text-rose-700 text-[10px] font-black uppercase tracking-wider rounded-md border border-rose-200 shadow-sm">Archived</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full z-0"></div>
        
        {/* Active Connecting Line */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-1000 ease-in-out"
          style={{ width: `${Math.min(100, (currentIndex / (steps.length - 1)) * 100)}%` }}
        ></div>

        {/* The Dots & Labels */}
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || currentIndex === 5;
          const isCurrent = idx === currentIndex;
          const isPending = idx > currentIndex;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center group">
              {/* Circle Node */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-500 ${
                isCompleted ? "bg-emerald-500 border-emerald-100 text-white" :
                isCurrent ? "bg-white border-indigo-200 shadow-indigo-100 shadow-md ring-4 ring-indigo-50" :
                "bg-white border-slate-100"
              }`}>
                {isCompleted && <Icons.Check />}
                {isCurrent && <Icons.Current />}
                {isPending && <Icons.Pending />}
              </div>
              
              {/* Text Labels */}
              {/* Text Labels */}
<div className={`absolute top-10 text-center w-28 md:w-32 ${
  idx === steps.length - 1 ? 'right-0 text-right pr-2 md:pr-0 md:text-center md:left-1/2 md:-ml-16' : 
  idx === 0 ? 'left-0 text-left pl-2 md:pl-0 md:text-center md:left-1/2 md:-ml-16' : 
  'left-1/2 -ml-14 md:-ml-16'
}`}>
  <p className={`text-[10px] md:text-[11px] font-bold uppercase tracking-wider ${isCompleted ? "text-emerald-700" : isCurrent ? "text-indigo-700" : "text-slate-400"}`}>
    {step.label}
  </p>
  <p className={`text-[8px] md:text-[9px] font-medium mt-0.5 ${isCurrent ? "text-slate-600" : "text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"}`}>
    {step.desc}
  </p>
</div>
            </div>
          );
        })}
      </div>
      <div className="h-6"></div> {/* Spacer for absolute positioned labels */}
    </div>
  );
}