// src/components/DocumentVault.tsx
"use client";

import { useState } from "react";
import { saveMultipleDocuments } from "@/app/actions/documentActions";

type StagedFile = {
  id: string;
  file: File;
  docCategory: "Client" | "Financial";
  docType: string;
  customName: string;
};

interface DocumentVaultProps {
  leadId: string;
  existingDocs: any;
  defaultCategory?: string; 
  defaultType?: string;     
  onUploadSuccess?: () => void; 
}

// --- ENTERPRISE ICONS (All missing icons added! 🚀) ---
const Icons = {
  Upload: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  Document: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Receipt: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  User: () => <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Eye: () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Delete: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  Folder: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  Check: () => <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  Cross: () => <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

export default function DocumentVault({ 
  leadId, 
  existingDocs, 
  defaultCategory = "Client", 
  defaultType = "",
  onUploadSuccess 
}: DocumentVaultProps) {
  
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // Parse existing documents safely
  const uploadedFiles = typeof existingDocs === 'object' && existingDocs !== null ? existingDocs : {};
  const fileEntries = Object.entries(uploadedFiles);

  // 🧠 SMART SORTING: Split files based on keywords in their category or name
  const isFinancial = (name: string, data: any) => {
    if (data?.category === "Financial") return true;
    return /(receipt|fee|payment|invoice|financial|agreement)/i.test(name);
  };
  
  const financialFiles = fileEntries.filter(([name, data]) => isFinancial(name, data));
  const clientFiles = fileEntries.filter(([name, data]) => !isFinancial(name, data));

  const clientDocOptions = [
    "Passport", "Emirates ID", "UAE Visa Copy", "CV / Resume", "Photograph", 
    "Driving License", "Intl. Driving License", "Police Clearance Certificate", 
    "Home Address Proof", "Experience Certificate", "Medical Report",
    "Signed Job Offer", "Signed Work Permit", "Approved Visa Copy", "Other Document"
  ];

  const financialDocOptions = [
    "Service Agreement Receipt", "Initial Test Receipt", "Re-Test Receipt", 
    "Job Offer Payment Receipt", "Work Permit Receipt", "Insurance Payment Receipt", 
    "School Fees Receipt", "Flight Ticket Receipt", "Other Financial Receipt"
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newStaged = files.map(file => {
      let finalDocType = defaultType;
      let finalCustomName = "";
      const currentOptions = defaultCategory === "Financial" ? financialDocOptions : clientDocOptions;
      
      if (defaultType && !currentOptions.includes(defaultType)) {
        finalDocType = defaultCategory === "Financial" ? "Other Financial Receipt" : "Other Document";
        finalCustomName = defaultType;
      }

      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        docCategory: (defaultCategory as "Client" | "Financial") || "Client", 
        docType: finalDocType,
        customName: finalCustomName
      };
    });

    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = ''; 
  };

  const updateStagedFile = (id: string, field: keyof StagedFile, value: string) => {
    setStagedFiles(prev => prev.map(f => {
      if (f.id === id) {
        if (field === 'docCategory') return { ...f, [field]: value as any, docType: "", customName: "" };
        return { ...f, [field]: value };
      }
      return f;
    }));
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBulkUpload = async () => {
    for (const f of stagedFiles) {
      if (!f.docType) return alert(`Please select a document type for ${f.file.name}`);
      if (f.docType.includes("Other") && !f.customName) return alert(`Please provide a custom name for ${f.file.name}`);
    }

    setUploading(true);
    const uploadedRecords: Record<string, string> = {};
    
    const existingKeys = Object.keys(uploadedFiles);
    const currentBatchKeys = new Set<string>();

    try {
      // ⚠️ TODO: Replace with real Cloud Upload logic ⚠️
      for (const staged of stagedFiles) {
        const baseName = staged.docType.includes("Other") ? staged.customName.trim() : staged.docType;
        let finalDocName = baseName;
        let version = 1;

        while (existingKeys.includes(finalDocName) || currentBatchKeys.has(finalDocName)) {
          version++;
          finalDocName = `${baseName} (v${version})`;
        }

        currentBatchKeys.add(finalDocName);
        
        const fakeUploadedUrl = `https://your-storage-bucket.com/uploads/${leadId}/${staged.file.name}`;
        uploadedRecords[finalDocName] = fakeUploadedUrl;
      }

      await saveMultipleDocuments(leadId, uploadedRecords);
      alert(`✅ ${stagedFiles.length} documents uploaded successfully!`);
      setStagedFiles([]);
      
      if (onUploadSuccess) onUploadSuccess(); 

    } catch (error) {
      console.error(error);
      alert("Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  const renderFileRow = (name: string, data: any, colorTheme: 'blue' | 'emerald') => {
    const isLegacy = typeof data === 'string';
    const fileUrl = isLegacy ? data : data.url;
    const uploadedBy = isLegacy ? "System" : data.uploadedBy;
    const uploadedAt = isLegacy || !data.uploadedAt 
      ? "" 
      : new Date(data.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const isBlue = colorTheme === 'blue';

    return (
      <div key={name} className={`flex justify-between items-center p-3.5 rounded-xl border group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        isBlue 
          ? 'bg-white border-slate-200 hover:border-indigo-300' 
          : 'bg-emerald-50/50 border-emerald-100 hover:border-emerald-300 hover:bg-white'
      }`}>
        <div className="overflow-hidden pr-4 flex-1">
          <p className={`text-sm font-bold truncate tracking-tight mb-1 ${isBlue ? 'text-slate-800' : 'text-emerald-900'}`} title={name}>
            {name}
          </p>
          <div className={`flex items-center gap-2 text-[11px] font-medium truncate ${isBlue ? 'text-slate-500' : 'text-emerald-700/70'}`}>
            <span className="flex items-center gap-1"><Icons.User /> {uploadedBy}</span>
            {uploadedAt && <span className="opacity-60 text-[10px]">• {uploadedAt}</span>}
          </div>
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg border shrink-0 transition-all shadow-sm ${
            isBlue 
              ? 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:bg-indigo-600 hover:text-white' 
              : 'text-emerald-700 bg-white border-emerald-200 hover:bg-emerald-600 hover:text-white'
          }`}
        >
          <Icons.Eye /> View
        </a>
      </div>
    );
  };

  return (
    <div className="bg-slate-50/50 rounded-2xl flex flex-col h-[750px]">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Secure Vault</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Drag & drop files or click to upload</p>
        </div>
        <span className="text-xs font-bold bg-white text-slate-600 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
          {fileEntries.length} Total Files
        </span>
      </div>

      {/* UPLOAD ZONE */}
      <div className="mb-6 shrink-0">
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-indigo-200 border-dashed rounded-xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 transition-all duration-200 group">
          <div className="flex items-center gap-3 text-indigo-600 group-hover:text-indigo-700">
            <div className="bg-white p-2 rounded-full shadow-sm group-hover:shadow border border-indigo-100"><Icons.Upload /></div>
            <p className="text-sm font-bold tracking-wide">
              {defaultType ? `Upload ${defaultType}` : "Click to Select Files..."}
            </p>
          </div>
          <input type="file" multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {/* STAGING AREA */}
      {stagedFiles.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-lg shadow-indigo-100/50 mb-6 shrink-0 max-h-72 overflow-y-auto custom-scrollbar relative animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-indigo-900 tracking-tight">Ready to Upload</h3>
              <p className="text-[11px] text-slate-500 font-medium">{stagedFiles.length} file(s) selected</p>
            </div>
            <button 
              onClick={handleBulkUpload} disabled={uploading}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow-sm transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {uploading ? (
                <span className="animate-pulse">Uploading...</span>
              ) : (
                <><Icons.Upload /> Upload to Vault</>
              )}
            </button>
          </div>
          
          <div className="space-y-3">
            {stagedFiles.map((staged) => (
              <div key={staged.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative pr-10 group transition-colors hover:border-indigo-300">
                <button onClick={() => removeStagedFile(staged.id)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 bg-white hover:bg-rose-50 w-7 h-7 flex items-center justify-center rounded-full border border-slate-200 hover:border-rose-200 transition-colors shadow-sm">
                  <Icons.Delete />
                </button>
                <p className="text-sm font-bold text-slate-800 truncate mb-3 w-[90%]">{staged.file.name}</p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select 
                    value={staged.docCategory}
                    onChange={(e) => updateStagedFile(staged.id, 'docCategory', e.target.value)}
                    className="w-full sm:w-1/3 p-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                  >
                    <option value="Client">📄 Client Docs</option>
                    <option value="Financial">💳 Financial Docs</option>
                  </select>

                  <select 
                    value={staged.docType}
                    onChange={(e) => updateStagedFile(staged.id, 'docType', e.target.value)}
                    className="w-full sm:w-2/3 p-2.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                  >
                    <option value="">-- Select Document Type --</option>
                    {(staged.docCategory === "Client" ? clientDocOptions : financialDocOptions).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {staged.docType.includes("Other") && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                    <input 
                      type="text" placeholder="Enter custom document name..." 
                      value={staged.customName} onChange={(e) => updateStagedFile(staged.id, 'customName', e.target.value)}
                      className="w-full p-2.5 bg-white border border-indigo-300 text-slate-900 text-xs font-semibold rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPLIT VAULT VIEW */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        
        {/* LEFT VAULT: CLIENT DOCUMENTS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 shrink-0 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md"><Icons.Document /></div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Official Documents</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-slate-50/30">
            {clientFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="mb-2 opacity-50"><Icons.Folder /></div>
                <p className="text-xs font-medium italic">No client documents.</p>
              </div>
            ) : (
              clientFiles.map(([name, data]) => renderFileRow(name, data, 'blue'))
            )}
          </div>
        </div>

        {/* RIGHT VAULT: FINANCIAL & RECEIPTS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 bg-emerald-50/50 border-b border-emerald-100 shrink-0 flex items-center gap-2">
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md"><Icons.Receipt /></div>
            <h3 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Financial & Receipts</h3>
          </div>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-3 bg-slate-50/30">
            {financialFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="mb-2 opacity-50"><Icons.Receipt /></div>
                <p className="text-xs font-medium italic">No financial receipts.</p>
              </div>
            ) : (
              financialFiles.map(([name, data]) => renderFileRow(name, data, 'emerald'))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}