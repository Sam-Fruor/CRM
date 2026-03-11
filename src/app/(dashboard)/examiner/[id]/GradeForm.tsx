// src/app/(dashboard)/examiner/[id]/GradeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitTestResults } from "@/app/actions/examinerActions";

export default function GradeForm({ lead }: { lead: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await submitTestResults(lead.id, formData);
      router.push("/examiner");
      router.refresh();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-purple-500";
  const labelStyle = "block text-sm font-bold text-slate-700 mb-2";

  return (
    <form onSubmit={handleSubmit} className="bg-purple-50/50 p-8 rounded-xl shadow-sm border border-purple-100">
      <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-6">Test Evaluation Matrix</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        
        {/* ENGLISH TEST */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">🗣️ English Assessment</h3>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Score (0-100)</label>
              <input type="number" name="englishScore" defaultValue={lead.englishScore || ""} min="0" max="100" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Result</label>
              <select name="englishTestResult" defaultValue={lead.englishTestResult || ""} required className={inputStyle}>
                <option value="">Select Result...</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Practice Required">Practice Required</option>
              </select>
            </div>
          </div>
        </div>

        {/* YARD/DRIVING TEST */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">🚗 Yard / Driving Test</h3>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Score (0-100)</label>
              <input type="number" name="drivingScore" defaultValue={lead.drivingScore || ""} min="0" max="100" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Result</label>
              <select name="yardTestResult" defaultValue={lead.yardTestResult || ""} required className={inputStyle}>
                <option value="">Select Result...</option>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Practice Required">Practice Required</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL DECISION */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm mb-8">
        <h3 className="font-bold text-slate-800 mb-4">Final Examiner Decision</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelStyle}>Overall Status <span className="text-red-500">*</span></label>
            <select name="examinerStatus" defaultValue={lead.examinerStatus || ""} required className={`${inputStyle} font-bold`}>
              <option value="">Pending Decision...</option>
              <option value="Approved">🟢 APPROVED (Send to Operations)</option>
              <option value="Denied">🔴 DENIED (Hold in Sales)</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelStyle}>Examiner Remarks / Feedback</label>
            <textarea name="examinerRemarks" defaultValue={lead.examinerRemarks} rows={3} placeholder="Notes on performance, parallel parking, language barrier, etc..." className={inputStyle}></textarea>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-6 py-3 rounded-lg font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">
          Cancel
        </button>
        <button type="submit" disabled={loading} className={`px-8 py-3 rounded-lg font-bold text-white shadow-md ${loading ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"}`}>
          {loading ? "Submitting..." : "Submit Final Grades"}
        </button>
      </div>

    </form>
  );
}