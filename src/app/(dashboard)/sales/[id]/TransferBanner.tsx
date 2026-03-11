"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transferToStage2 } from "@/app/actions/leadActions";

export default function TransferBanner({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleTransfer = async () => {
    setLoading(true);
    await transferToStage2(leadId);
    
    // Show success message and redirect back to the database
    alert("🚀 File Transferred Successfully to Operations!");
    router.push("/sales/leads");
    router.refresh(); 
  };

  return (
    <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-6 mb-6 flex justify-between items-center shadow-sm animate-in fade-in slide-in-from-top-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎉</span>
          <h2 className="text-xl font-bold text-emerald-900">Examiner Approved!</h2>
        </div>
        <p className="text-emerald-700 font-medium mt-1">
          This candidate passed their test. Review their file and transfer it to Operations and HR when ready.
        </p>
      </div>
      
      <button 
        onClick={handleTransfer}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all hover:scale-105 active:scale-95 disabled:bg-emerald-400"
      >
        {loading ? "Transferring..." : "Transfer to Stage 2 🚀"}
      </button>
    </div>
  );
}