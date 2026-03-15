// src/components/ActivityTimeline.tsx
"use client";

export default function ActivityTimeline({ activities }: { activities: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col max-h-[800px] overflow-hidden">
      
      {/* Timeline Header */}
      <div className="p-5 border-b border-slate-100 shrink-0 flex justify-between items-center bg-slate-50 relative z-20">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">⏱️ Activity History</h3>
        <span className="text-xs font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-full shadow-sm">
          {activities?.length || 0} Events
        </span>
      </div>
      
      {/* Timeline Feed */}
      <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
        {(!activities || activities.length === 0) ? (
          <p className="text-slate-400 text-sm italic text-center py-4">No activities recorded yet.</p>
        ) : (
          <div className="relative">
            {/* The continuous background line */}
            <div className="absolute top-2 bottom-0 left-[11px] w-[2px] bg-slate-100"></div>

            <div className="space-y-6">
              {activities.map((activity: any) => {
                
                // 🎨 SMART COLOR LOGIC
                const actionStr = activity.action.toLowerCase();
                let dotColor = "bg-slate-400";
                let bgColor = "bg-white";
                let borderColor = "border-slate-200";

                if (actionStr.includes("transfer") || actionStr.includes("approve")) {
                  dotColor = "bg-emerald-500"; borderColor = "border-emerald-200"; bgColor = "bg-emerald-50/30";
                } else if (actionStr.includes("deny") || actionStr.includes("fail") || actionStr.includes("reject")) {
  dotColor = "bg-red-500"; borderColor = "border-red-200"; bgColor = "bg-red-50/30";
                } else if (actionStr.includes("evaluat") || actionStr.includes("exam") || actionStr.includes("test")) {
                  dotColor = "bg-purple-500"; borderColor = "border-purple-200"; bgColor = "bg-purple-50/30";
                } else if (actionStr.includes("update") || actionStr.includes("stage") || actionStr.includes("upload")) {
                  dotColor = "bg-blue-500"; borderColor = "border-blue-200"; bgColor = "bg-blue-50/30";
                }

                return (
                  <div key={activity.id} className="relative flex items-start gap-4 z-10 group">
                    
                    {/* Colored Timeline Dot */}
                    <div className="flex flex-col items-center pt-1.5 shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-white border-2 ${borderColor} z-10`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                      </div>
                    </div>
                    
                    {/* Clean Content Box */}
                    <div className={`flex-1 ${bgColor} p-4 rounded-xl border ${borderColor} shadow-sm transition-all hover:shadow-md`}>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <span className="font-bold text-slate-800 text-sm">{activity.action}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm shrink-0">
                          {/* 👇 FIX: Locked to en-GB so Server and Browser match perfectly! */}
                          {new Date(activity.createdAt).toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      
                      {activity.details && (
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">{activity.details}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 font-medium border-t border-slate-200/60 pt-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shadow-sm">
                          {activity.user?.name ? activity.user.name.charAt(0).toUpperCase() : "S"}
                        </span>
                        {activity.user?.name || "System"}
                        <span className="text-slate-300">•</span>
                        {/* 👇 FIX: Time formatting locked to prevent hydration errors */}
                        <span>{new Date(activity.createdAt).toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
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