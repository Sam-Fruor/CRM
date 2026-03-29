// src/app/(dashboard)/examiner/[id]/GradeForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitTestEvaluation, editTestEvaluation } from "@/app/actions/leadActions";
import DocumentVault from "@/components/DocumentVault";

// --- ENTERPRISE ICONS ---
const Icons = {
  BookOpen: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Car: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8M8 11h8M8 15h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>,
  ShieldCheck: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Folder: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Cross: () => <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
};

export default function GradeForm({ lead, attemptName = "Test Evaluation", isEditMode = false }: { lead: any, attemptName?: string, isEditMode?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // 🗂️ Vault Modal State
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // If isEditMode is false (because it's a NEW attempt), it forces the form to be totally blank
  const getDefault = (value: any) => {
    return isEditMode ? (value || "") : "";
  };

  const [engScore, setEngScore] = useState<string | number>(getDefault(lead.englishScore));
  const [engResult, setEngResult] = useState<string>(getDefault(lead.englishTestResult));

  const [yardScore, setYardScore] = useState<string | number>(getDefault(lead.drivingScore));
  const [yardResult, setYardResult] = useState<string>(getDefault(lead.yardTestResult));

  const [finalStatus, setFinalStatus] = useState<string>(getDefault(lead.examinerStatus));

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
    if (result === "Passed") return "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm";
    if (result === "Failed") return "bg-rose-100 text-rose-800 border-rose-300 shadow-sm";
    if (result === "Practice Required") return "bg-amber-100 text-amber-800 border-amber-300 shadow-sm";
    return "bg-slate-100 text-slate-500 border-slate-200 shadow-inner";
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

  const inputStyle = "w-24 p-3 bg-white border-2 border-slate-300 text-slate-900 text-2xl font-black rounded-xl outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 text-center shadow-inner transition-all hover:border-purple-300";
  const labelStyle = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2";

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4 animate-pulse border border-slate-200">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-slate-100 border-t-purple-600 mb-6 shadow-sm"></div>
            <h3 className="text-xl font-black text-slate-900 tracking-tight text-center">
              {isEditMode ? "Updating Scores..." : "Saving Evaluation..."}
            </h3>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-2">Please wait</p>
          </div>
        </div>
      )}

      {/* 🗂️ MODAL: DOCUMENT VAULT FOR EXAMINERS */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h2 className="text-slate-800 font-bold text-lg flex items-center gap-2">
                <Icons.Folder /> Candidate Document Vault
              </h2>
              <button 
                type="button" 
                onClick={() => setIsVaultModalOpen(false)} 
                className="text-slate-400 hover:text-rose-600 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
              >
                <Icons.Cross />
              </button>
            </div>
            <div className="overflow-y-auto p-6 flex-1 custom-scrollbar bg-slate-50/30">
              <DocumentVault 
                leadId={lead.id} 
                existingDocs={lead.documentFiles} 
                defaultCategory="Evaluation" 
                defaultType="Test Sheet" 
                onUploadSuccess={() => { 
                  setIsVaultModalOpen(false); 
                  router.refresh(); 
                }} 
              />
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-slate-200/80 sticky top-6 relative overflow-hidden">
        {/* Subtle top border accent */}
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isEditMode ? 'bg-amber-500' : 'bg-purple-600'}`}></div>

        <input type="hidden" name="leadId" value={lead.id} />
        <input type="hidden" name="englishTestResult" value={engResult} />
        <input type="hidden" name="yardTestResult" value={yardResult} />

        <div className="flex flex-col gap-1 border-b border-slate-100 pb-5 mb-6">
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center justify-between">
            <span>{attemptName}</span>
            {isEditMode ? (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">Edit Mode</span>
            ) : (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">New Submission</span>
            )}
          </h2>
          <p className="text-xs font-medium text-slate-500">Record scores carefully. These grades determine the candidate's progression.</p>
        </div>

        <div className="flex flex-col gap-5 mb-6">
          
          {/* ENGLISH EXAM WIDGET */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 pointer-events-none scale-150 transform translate-x-2 -translate-y-2">
              <Icons.BookOpen />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                <span className="text-purple-600"><Icons.BookOpen /></span> English Assessment <span className="text-rose-500">*</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Score from 0 to 10 (7+ is Pass)</p>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <input 
                type="number" 
                name="englishScore" 
                value={engScore} 
                onChange={handleEnglishScoreChange}
                placeholder="-"
                className={inputStyle} 
              />
              <div className="flex-1">
                <span className={`flex items-center justify-center w-full h-full min-h-[56px] px-3 text-sm font-black tracking-wide uppercase rounded-xl border transition-colors ${getResultBadge(engResult)}`}>
                  {engResult || "Pending Score..."}
                </span>
              </div>
            </div>
          </div>

          {/* YARD EXAM WIDGET (OPTIONAL) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 text-slate-900 pointer-events-none scale-150 transform translate-x-2 -translate-y-2">
              <Icons.Car />
            </div>
            <div className="relative z-10">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                <span className="text-purple-600"><Icons.Car /></span> Yard / Driving Test
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Score from 0 to 10 (Optional if not tested yet)</p>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              <input 
                type="number" 
                name="drivingScore" 
                value={yardScore}
                onChange={handleYardScoreChange}
                placeholder="-"
                className={inputStyle} 
              />
              <div className="flex-1">
                <span className={`flex items-center justify-center w-full h-full min-h-[56px] px-3 text-sm font-black tracking-wide uppercase rounded-xl border transition-colors ${getResultBadge(yardResult)}`}>
                  {yardResult || "Not Tested"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TEST EVIDENCE / VAULT WIDGET */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col gap-3 mb-6 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                <span className="text-purple-600"><Icons.Folder /></span> Test Evidence
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Upload test sheets, scorecards, or videos.</p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsVaultModalOpen(true)}
              className="px-4 py-2 bg-white border-2 border-dashed border-purple-200 text-purple-600 hover:text-purple-700 font-bold text-xs rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Icons.Upload /> Open Vault
            </button>
          </div>
        </div>

        {/* DECISION WIDGET */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 shadow-sm mb-8">
          <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="text-purple-600"><Icons.ShieldCheck /></span> Final Decision
          </h3>
          <div className="space-y-5">
            <div>
              <label className={labelStyle}>Overall Status <span className="text-rose-500">*</span></label>
              <div className="relative">
                <select 
                  name="examinerStatus" 
                  value={finalStatus}
                  onChange={(e) => setFinalStatus(e.target.value)}
                  required 
                  className="w-full p-3.5 bg-white border-2 border-slate-300 text-slate-900 text-sm font-bold rounded-xl outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm transition-all hover:border-purple-300 appearance-none"
                >
                  <option value="">Choose Final Decision...</option>
                  <option value="Approved">🟢 APPROVED (Passed)</option>
                  <option value="Rejected">🔴 REJECTED (Failed/Retest Needed)</option>
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            <div>
              <label className={labelStyle}>Examiner Remarks / Feedback</label>
              <textarea 
                name="examinerRemarks" 
                defaultValue={getDefault(lead.examinerRemarks)} 
                rows={3} 
                placeholder="Required notes if rejected, optional if passed..." 
                className="w-full p-3.5 bg-white border-2 border-slate-300 text-slate-900 text-sm font-medium rounded-xl outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm transition-all hover:border-purple-300 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          disabled={loading || engScore === "" || finalStatus === ""} 
          className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
            loading || engScore === "" || finalStatus === "" 
              ? "bg-slate-200 text-slate-400 shadow-none cursor-not-allowed border border-slate-300" 
              : isEditMode 
                ? "bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95" 
                : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/30 hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
          }`}
        >
          <Icons.Save />
          {isEditMode ? "Update Evaluation" : "Submit"}
        </button>
      </form>
    </>
  );
}