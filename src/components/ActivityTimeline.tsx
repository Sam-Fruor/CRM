// src/components/ActivityTimeline.tsx
"use client";
import { useState } from "react";

// 🎨 ENTERPRISE ICONS
const Icons = {
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Clipboard: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Clock: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Filter: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
};

const FILTERS = ["All", "Payments", "Testing", "Status"];

export default function ActivityTimeline({ activities }: { activities: any[] }) {
  const [activeFilter, setActiveFilter] = useState("All");

  // 🚀 FILTERING LOGIC
  const filteredActivities = (activities || []).filter((a: any) => {
    if (activeFilter === "All") return true;
    const actionStr = a.action.toLowerCase();
    
    if (activeFilter === "Payments") return actionStr.includes("payment") || actionStr.includes("fee") || actionStr.includes("receipt");
    if (activeFilter === "Testing") return actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test");
    if (activeFilter === "Status") return actionStr.includes("transfer") || actionStr.includes("stage") || actionStr.includes("status") || actionStr.includes("approve") || actionStr.includes("reject");
    return true;
  });

  return (
    <div className="flex flex-col h-full max-h-[750px]">
      
      {/* 🚀 ACTIVITY FILTER CHIPS */}
      <div className="flex flex-wrap items-center gap-2 mb-6 shrink-0 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
        <div className="px-2 text-slate-400"><Icons.Filter /></div>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
              activeFilter === f 
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      
      {/* Timeline Feed */}
      <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 pb-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <p className="text-slate-400 text-sm font-bold">No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} activities found.</p>
          </div>
        ) : (
          <div className="relative">
            {/* The continuous background line */}
            <div className="absolute top-4 bottom-0 left-[15px] w-[2px] bg-slate-100"></div>

            <div className="space-y-6">
              {filteredActivities.map((activity: any) => {
                
                // 🎨 SMART ENTERPRISE COLOR & ICON LOGIC
                const actionStr = activity.action.toLowerCase();
                let theme = { 
                  iconColor: "text-slate-500", iconBg: "bg-white", iconBorder: "border-slate-200", 
                  boxBg: "bg-slate-50/50", boxBorder: "border-slate-100", icon: <Icons.Edit /> 
                };

                if (actionStr.includes("transfer") || actionStr.includes("approve") || actionStr.includes("collect")) {
                  theme = { iconColor: "text-emerald-600", iconBg: "bg-emerald-50", iconBorder: "border-emerald-200", boxBg: "bg-emerald-50/30", boxBorder: "border-emerald-100", icon: <Icons.Check /> };
                } else if (actionStr.includes("deny") || actionStr.includes("fail") || actionStr.includes("reject")) {
                  theme = { iconColor: "text-rose-600", iconBg: "bg-rose-50", iconBorder: "border-rose-200", boxBg: "bg-rose-50/30", boxBorder: "border-rose-100", icon: <Icons.XCircle /> };
                } else if (actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test")) {
                  theme = { iconColor: "text-purple-600", iconBg: "bg-purple-50", iconBorder: "border-purple-200", boxBg: "bg-purple-50/30", boxBorder: "border-purple-100", icon: <Icons.Clipboard /> };
                } else if (actionStr.includes("update") || actionStr.includes("stage") || actionStr.includes("upload") || actionStr.includes("receipt")) {
                  theme = { iconColor: "text-indigo-600", iconBg: "bg-indigo-50", iconBorder: "border-indigo-200", boxBg: "bg-indigo-50/30", boxBorder: "border-indigo-100", icon: <Icons.Edit /> };
                }

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 z-10 group">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm z-10 transition-transform group-hover:scale-110 ${theme.iconBg} ${theme.iconBorder} ${theme.iconColor}`}>
                        {theme.icon}
                      </div>
                    </div>
                    <div className={`flex-1 ${theme.boxBg} p-4 rounded-xl border ${theme.boxBorder} transition-all hover:shadow-sm hover:border-slate-300`}>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                        <span className="font-bold text-slate-800 text-sm tracking-tight leading-tight">{activity.action}</span>
                        <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1 mt-1 sm:mt-0">
                          {new Date(activity.createdAt).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed font-medium">{activity.details}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-semibold border-t border-slate-200/60 pt-3">
                        <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 text-slate-700 font-bold">
                          {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                        </span>
                        {activity.user?.name || "System"}
                        <span className="text-slate-300 mx-1">•</span>
                        <span className="flex items-center gap-1"><Icons.Clock /> {new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}