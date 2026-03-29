// src/app/(dashboard)/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-8">
      
      {/* 🌀 PREMIUM ANIMATED SPINNER */}
      <div className="relative flex items-center justify-center">
        
        {/* Soft Ambient Glow */}
        <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
        
        {/* Outer Thin Ring (Slower Spin) */}
        <div className="absolute h-28 w-28 animate-[spin_3s_linear_infinite] rounded-full border-y-2 border-indigo-200 opacity-60"></div>
        
        {/* Inner Thick Ring (Fast Spin) */}
        <div className="absolute h-20 w-20 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-600 shadow-sm"></div>
        
        {/* Fixed Center Logo Base */}
        <div className="z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md border border-slate-100">
          <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
      </div>
      
      {/* 🔠 ENTERPRISE TYPOGRAPHY */}
      <div className="text-center flex flex-col items-center gap-3">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Euro Driver</h2>
        
        {/* Bouncing Loading Dots */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          Loading Workspace
        </p>
      </div>
      
    </div>
  );
}