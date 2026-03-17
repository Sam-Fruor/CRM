// src/app/(dashboard)/examiner/[id]/GradeForm.tsx
"use client";

import { useState } from "react";
import { submitTestEvaluation, editTestEvaluation } from "@/app/actions/leadActions";

export default function GradeForm({ lead, attemptName = "Test Evaluation", isEditMode = false }: { lead: any, attemptName?: string, isEditMode?: boolean }) {
  const [loading, setLoading] = useState(false);

  // 🔥 THE FIX: If isEditMode is false (because it's a NEW attempt), it forces the form to be totally blank!
  const getDefault = (value: any) => {
    return isEditMode ? (value || "") : "";
  };

  const [engScore, setEngScore] = useState<string | number>(getDefault(lead.englishScore));
  const [engResult, setEngResult] = useState<string>(getDefault(lead.englishTestResult));

  const [yardScore, setYardScore] = useState<string | number>(getDefault(lead.drivingScore));
  const [yardResult, setYardResult] = useState<string>(getDefault(lead.yardTestResult));

  const handleEnglishScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setEngScore("");
      setEngResult("");
      return;
    }
    const num = Number(val);
    if (num < 0 || num > 10) return;
    setEngScore(num);
    
    if (num >= 7) {
      setEngResult("Passed");
    } else if (num === 6) {
      setEngResult("Practice Required");
    } else {
      setEngResult("Failed");
    }
  };

  const handleYardScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setYardScore("");
      setYardResult("");
      return;
    }
    const num = Number(val);
    if (num < 0 || num > 10) return;
    setYardScore(num);
    
    if (num >= 7) {
      setYardResult("Passed");
    } else {
      setYardResult("Failed");
    }
  };

  const getResultBadge = (result: string) => {
    if (result === "Passed") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (result === "Failed") return "bg-red-50 text-red-700 border-red-200";
    if (result === "Practice Required") return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      if (isEditMode) {
        await editTestEvaluation(formData);
      } else {
        await submitTestEvaluation(formData);
      }
      
      window.location.href = "/examiner";
    } catch (error) {
      console.error(error);
      alert("Failed to process evaluation.");
      setLoading(false); 
    }
  };

  const inputStyle = "w-24 p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-xl font-black rounded-lg outline-none focus:ring-2 focus:ring-purple-500 text-center shadow-inner";
  const labelStyle = "block text-sm font-bold text-slate-700 mb-2";

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 animate-pulse">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-purple-600 mb-6 shadow-sm"></div>
            <h3 className="text-xl font-bold text-slate-800 text-center">
              {isEditMode ? "Updating Scores..." : "Saving Evaluation..."}
            </h3>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-purple-50/40 p-6 rounded-xl shadow-sm border border-purple-100 sticky top-6">
        <input type="hidden" name="leadId" value={lead.id} />
        
        <input type="hidden" name="englishTestResult" value={engResult} />
        <input type="hidden" name="yardTestResult" value={yardResult} />

        <h2 className="text-lg font-bold text-purple-900 border-b border-purple-200 pb-3 mb-6 flex flex-col gap-1">
          <span>{attemptName} Matrix</span>
          {isEditMode ? (
            <span className="w-fit text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded uppercase tracking-wider">Editing Previous Grade</span>
          ) : (
            <span className="w-fit text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-wider">New Submission</span>
          )}
        </h2>

        <div className="flex flex-col gap-5 mb-6">
          
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">🗣️ English Assessment</h3>
              <p className="text-xs text-slate-500 font-medium">Score from 0 to 10 (7+ is Pass)</p>
            </div>
            
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                name="englishScore" 
                value={engScore} 
                onChange={handleEnglishScoreChange}
                placeholder="-"
                className={inputStyle} 
              />
              <div className="flex-1">
                <span className={`flex items-center justify-center w-full h-full min-h-[48px] px-3 text-xs font-bold rounded-lg border shadow-sm transition-colors ${getResultBadge(engResult)}`}>
                  {engResult || "Pending..."}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">🚗 Yard / Driving Test</h3>
              <p className="text-xs text-slate-500 font-medium">Score from 0 to 10 (Strict 7+ is Pass)</p>
            </div>
            
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                name="drivingScore" 
                value={yardScore}
                onChange={handleYardScoreChange}
                placeholder="-"
                className={inputStyle} 
              />
              <div className="flex-1">
                <span className={`flex items-center justify-center w-full h-full min-h-[48px] px-3 text-xs font-bold rounded-lg border shadow-sm transition-colors ${getResultBadge(yardResult)}`}>
                  {yardResult || "Pending..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm mb-6">
          <h3 className="font-bold text-slate-800 mb-4">Final Decision</h3>
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>Overall Status <span className="text-red-500">*</span></label>
              <select name="examinerStatus" defaultValue={getDefault(lead.examinerStatus)} required className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-lg outline-none focus:ring-2 focus:ring-purple-500">
                <option value="">Pending Decision...</option>
                <option value="Approved">🟢 APPROVED</option>
                <option value="Rejected">🔴 REJECTED</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Remarks / Feedback</label>
              <textarea name="examinerRemarks" defaultValue={getDefault(lead.examinerRemarks)} rows={3} placeholder="Notes on performance..." className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading || engScore === "" || yardScore === ""} 
          className={`w-full py-3.5 rounded-lg font-bold text-white shadow-md transition-colors ${
            loading || engScore === "" || yardScore === "" ? "bg-slate-300 text-slate-500 cursor-not-allowed" : 
            isEditMode ? "bg-orange-600 hover:bg-orange-700" : "bg-purple-600 hover:bg-purple-700"
          }`}
        >
          {isEditMode ? "Update Existing Scores" : "Submit Final Grades"}
        </button>
      </form>
    </>
  );
}