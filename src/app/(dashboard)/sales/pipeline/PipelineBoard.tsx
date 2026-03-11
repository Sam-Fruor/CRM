"use client";

import { useState, useTransition } from "react";
import { updateLeadPipelineStatus } from "@/app/actions/leadActions";
import Link from "next/link";

const COLUMNS = [
  { id: "Pending", title: "🆕 New / Pending", color: "border-slate-300 bg-slate-50" },
  { id: "Following Up", title: "📞 Following Up", color: "border-orange-300 bg-orange-50" },
  { id: "Client is for Next Test", title: "📅 Next Test", color: "border-purple-300 bg-purple-50" },
  { id: "Converted", title: "✅ Converted", color: "border-emerald-300 bg-emerald-50" },
];

export default function PipelineBoard({ initialLeads }: { initialLeads: any[] }) {
  const [leads, setLeads] = useState(initialLeads);
  const [isPending, startTransition] = useTransition();

  // 1. Handle when dragging starts
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  // 2. Allow dropping over a column
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  // 3. Handle when the card is dropped
  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    
    // Instantly update UI (Optimistic UI update so it feels lightning fast)
    setLeads((prev) => 
      prev.map((lead) => {
        if (lead.id === leadId) {
          // Map Kanban status back to DB status for the local state
          let newDbStatus = targetStatus;
          if (targetStatus === "Pending") newDbStatus = "";
          if (targetStatus === "Following Up") newDbStatus = "Not Responding";
          return { ...lead, feedbackStatus: newDbStatus };
        }
        return lead;
      })
    );

    // Update the database in the background
    startTransition(() => {
      updateLeadPipelineStatus(leadId, targetStatus);
    });
  };

  // Helper to map DB status to Kanban Columns
  const getColumnForLead = (dbStatus: string | null) => {
    if (dbStatus === "Converted") return "Converted";
    if (dbStatus === "Client is for Next Test") return "Client is for Next Test";
    if (dbStatus === "Not Responding" || dbStatus === "Others") return "Following Up";
    return "Pending"; // Captures null, "", or new leads
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 min-h-[70vh]">
      {COLUMNS.map((col) => {
        const columnLeads = leads.filter(l => getColumnForLead(l.feedbackStatus) === col.id);

        return (
          <div 
            key={col.id} 
            className={`flex-1 min-w-[300px] rounded-xl border-2 border-dashed ${col.color} p-4 flex flex-col`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700">{col.title}</h3>
              <span className="bg-white px-2 py-0.5 rounded-full text-xs font-bold text-slate-500 shadow-sm">
                {columnLeads.length}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800">{lead.givenName} {lead.surname}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{lead.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">📞 {lead.callingNumber}</p>
                  <p className="text-xs text-slate-500 mb-3">🌍 {lead.nationality} • {lead.category === 'Pending' ? 'No Category' : lead.category}</p>
                  
                  <Link 
                    href={`/sales/${lead.id}`}
                    className="block text-center w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-600 rounded border border-slate-200 transition-colors"
                  >
                    Open Profile
                  </Link>
                </div>
              ))}
              
              {columnLeads.length === 0 && (
                <div className="h-24 border-2 border-dashed border-slate-200/50 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                  Drop client here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}