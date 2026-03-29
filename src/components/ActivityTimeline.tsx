// src/components/ActivityTimeline.tsx
"use client";
import { useState, useEffect } from "react";

// 🎨 ENTERPRISE ICONS
const Icons = {
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  XCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Clipboard: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Clock: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Filter: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  Search: () => <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
};

const FILTERS = ["All", "Payments", "Testing", "Status"];

// 🛠️ HELPER: Format Relative Time ("2 hours ago")
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short' });
};

// 🛠️ HELPER: Get Day Group Label ("Today", "Yesterday", or "24 Mar")
const getDayLabel = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function ActivityTimeline({ activities }: { activities: any[] }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // 🚀 BUG FIX: Hydration Mismatch Preventer!
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 🚀 FILTERING & SEARCH LOGIC
  const filteredActivities = (activities || []).filter((a: any) => {
    // 1. Check Tab Filter
    let passesTab = true;
    if (activeFilter !== "All") {
      const actionStr = a.action.toLowerCase();
      if (activeFilter === "Payments") passesTab = actionStr.includes("payment") || actionStr.includes("fee") || actionStr.includes("receipt");
      else if (activeFilter === "Testing") passesTab = actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test");
      else if (activeFilter === "Status") passesTab = actionStr.includes("transfer") || actionStr.includes("stage") || actionStr.includes("status") || actionStr.includes("approve") || actionStr.includes("reject");
    }

    // 2. Check Search Query
    let passesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const actionMatch = a.action?.toLowerCase().includes(q);
      const detailMatch = a.details?.toLowerCase().includes(q);
      const userMatch = a.user?.name?.toLowerCase().includes(q);
      passesSearch = !!(actionMatch || detailMatch || userMatch);
    }

    return passesTab && passesSearch;
  });

  // 🚀 GROUPING LOGIC
  let lastDateLabel = "";

  return (
    <div className="flex flex-col h-full max-h-[800px] relative">
      
      {/* 🚀 HEADER: STACKED SEARCH & FILTERS */}
      <div className="flex flex-col gap-3 mb-6 shrink-0 w-full">
        
        {/* 🔍 Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icons.Search />
          </div>
          <input 
            type="text" 
            placeholder="Search timeline..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm placeholder:text-slate-400"
          />
        </div>

        {/* 🎛️ Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-full">
          <div className="px-1.5 text-slate-400 hidden sm:block"><Icons.Filter /></div>
          {FILTERS.map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all flex-1 sm:flex-none text-center ${
                activeFilter === f 
                  ? "bg-white text-indigo-700 shadow-sm border border-slate-200" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
      </div>
      
      {/* Timeline Feed */}
      <div className="overflow-y-auto flex-1 custom-scrollbar pr-2 pb-4 relative">
        {filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
              <Icons.Search />
            </div>
            <p className="text-slate-600 text-sm font-bold">No events found</p>
            <p className="text-slate-400 text-xs mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="relative pl-3">
            {/* The continuous background line */}
            <div className="absolute top-2 bottom-0 left-[27px] w-[2px] bg-slate-100"></div>

            {/* 🚀 HYDRATION FIX: Skeleton Loader while mounting! */}
            {!isMounted ? (
              <div className="space-y-4 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse shrink-0 ml-1"></div>
                    <div className="flex-1 h-24 bg-slate-100 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((activity: any) => {
                  
                  // 📅 DATE GROUPING CHECK
                  const currentLabel = getDayLabel(activity.createdAt);
                  const showDateHeader = currentLabel !== lastDateLabel;
                  lastDateLabel = currentLabel;

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
                    <div key={activity.id} className="relative z-10">
                      
                      {/* 📅 STICKY DATE HEADER (Only shows if day changes) */}
                      {showDateHeader && (
                        <div className="sticky top-0 z-20 py-3 -ml-3 pl-3 bg-white/95 backdrop-blur-sm">
                          <span className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                            {currentLabel}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-4 group py-3">
                        
                        {/* Floating Icon Node */}
                        <div className="flex flex-col items-center shrink-0 mt-1.5 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-transform group-hover:scale-110 ${theme.iconBg} ${theme.iconBorder} ${theme.iconColor}`}>
                            {theme.icon}
                          </div>
                        </div>
                        
                        {/* Clean Content Box */}
                        <div className={`flex-1 ${theme.boxBg} p-4 rounded-xl border ${theme.boxBorder} transition-all hover:shadow-sm hover:border-slate-300`}>
                          
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-2">
                            <span className="font-bold text-slate-800 text-sm tracking-tight leading-tight">
                              {activity.action}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0 mt-1 sm:mt-0">
                              {/* ⏱️ RELATIVE TIME CHIP */}
                              <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                                {getRelativeTime(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                          
                          {activity.details && (
                            <p className="text-[13px] text-slate-600 mb-3 leading-relaxed font-medium">
                              {searchQuery ? (
                                <span dangerouslySetInnerHTML={{ 
                                  __html: activity.details.replace(new RegExp(searchQuery, 'gi'), (match: string) => `<mark class="bg-indigo-100 text-indigo-900 rounded px-0.5">${match}</mark>`) 
                                }} />
                              ) : activity.details}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500 font-semibold border-t border-slate-200/60 pt-3">
                            <span className="w-5 h-5 rounded flex items-center justify-center bg-slate-200 text-slate-700 font-bold shadow-inner">
                              {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                            </span>
                            {activity.user?.name || "System"}
                            <span className="text-slate-300 mx-1">•</span>
                            <span className="flex items-center gap-1">
                              <Icons.Clock /> 
                              {new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}