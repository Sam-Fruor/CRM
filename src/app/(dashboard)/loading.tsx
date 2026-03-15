// src/app/(dashboard)/loading.tsx

export default function DashboardLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-6">
      
      <div className="relative flex items-center justify-center">
        {/* The Spinning Outer Ring */}
        <div className="absolute h-24 w-24 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600 border-b-blue-600 shadow-sm"></div>
        
        {/* The Pulsing Center Logo */}
        <div className="z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm animate-pulse">
           <span className="text-4xl">🌍</span>
           {/* <img src="/logo.png" alt="Loading" className="h-10 w-auto object-contain" /> */}
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="text-center mt-2">
        <h2 className="text-lg font-bold text-slate-700">Euro Driver</h2>
        <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest mt-1">
          Loading Workspace...
        </p>
      </div>
      
    </div>
  );
}