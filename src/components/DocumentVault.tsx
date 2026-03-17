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

export default function DocumentVault({ leadId, existingDocs }: { leadId: string, existingDocs: any }) {
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // Parse existing documents safely
  const uploadedFiles = typeof existingDocs === 'object' && existingDocs !== null ? existingDocs : {};
  const fileEntries = Object.entries(uploadedFiles);

  // 🧠 SMART SORTING: Split files based on keywords in their name
  const isFinancial = (name: string) => /(receipt|fee|payment|invoice|financial|agreement)/i.test(name);
  const financialFiles = fileEntries.filter(([name]) => isFinancial(name));
  const clientFiles = fileEntries.filter(([name]) => !isFinancial(name));

  const clientDocOptions = [
    "Passport", "Emirates ID", "UAE Visa Copy", "CV / Resume", "Photograph", 
    "Driving License", "Intl. Driving License", "Police Clearance Certificate", 
    "Home Address Proof", "Experience Certificate", "Medical Report",
    "Signed Job Offer", "Signed Work Permit", "Approved Visa Copy", "Other Document"
  ];

  const financialDocOptions = [
    "Service Agreement Receipt", "Initial Test Fee Receipt", "Re-Test Fee Receipt", 
    "Job Offer Payment Receipt", "Work Permit Receipt", "Insurance Payment Receipt", 
    "School Fees Receipt", "Flight Ticket Receipt", "Other Financial Receipt"
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newStaged = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      docCategory: "Client" as const, 
      docType: "",
      customName: ""
    }));

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
    
    // 🛡️ AUTO-VERSIONING ENGINE: Grab existing keys so we don't overwrite!
    const existingKeys = Object.keys(uploadedFiles);
    const currentBatchKeys = new Set<string>();

    try {
      // ⚠️ TODO: Replace with real Cloud Upload logic ⚠️
      for (const staged of stagedFiles) {
        const baseName = staged.docType.includes("Other") ? staged.customName.trim() : staged.docType;
        let finalDocName = baseName;
        let version = 1;

        // 🔄 Loop until we find a name that DOES NOT exist in the database or the current upload batch!
        while (existingKeys.includes(finalDocName) || currentBatchKeys.has(finalDocName)) {
          version++;
          finalDocName = `${baseName} (v${version})`;
        }

        // Lock this name in for the batch
        currentBatchKeys.add(finalDocName);
        
        const fakeUploadedUrl = `https://your-storage-bucket.com/uploads/${leadId}/${staged.file.name}`;
        uploadedRecords[finalDocName] = fakeUploadedUrl;
      }

      await saveMultipleDocuments(leadId, uploadedRecords);
      alert(`✅ ${stagedFiles.length} documents uploaded successfully!`);
      setStagedFiles([]);
    } catch (error) {
      console.error(error);
      alert("Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  // 🛠️ HELPER TO RENDER INDIVIDUAL FILE ROWS
  const renderFileRow = (name: string, data: any, colorTheme: 'blue' | 'emerald') => {
    const isLegacy = typeof data === 'string';
    const fileUrl = isLegacy ? data : data.url;
    const uploadedBy = isLegacy ? "System / Legacy" : data.uploadedBy;
    const uploadedAt = isLegacy || !data.uploadedAt 
      ? "" 
      : new Date(data.uploadedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const isBlue = colorTheme === 'blue';

    return (
      <div key={name} className={`flex justify-between items-center p-3 rounded-lg border group ${
        isBlue ? 'bg-slate-700 border-slate-600' : 'bg-emerald-900/20 border-emerald-800/50'
      }`}>
        <div className="overflow-hidden pr-3">
          <p className={`text-xs font-bold truncate ${isBlue ? 'text-slate-200' : 'text-emerald-100'}`} title={name}>
            {name}
          </p>
          <p className={`text-[10px] mt-1 truncate ${isBlue ? 'text-slate-400' : 'text-emerald-500/80'}`}>
            👤 {uploadedBy} {uploadedAt && <span className="ml-1 opacity-75">• 🕒 {uploadedAt}</span>}
          </p>
        </div>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`text-[10px] font-bold px-3 py-1.5 rounded-md border shrink-0 transition-colors ${
            isBlue 
              ? 'text-blue-400 bg-slate-800 border-slate-600 hover:text-blue-300' 
              : 'text-emerald-400 bg-emerald-950 border-emerald-800 hover:text-emerald-300'
          }`}
        >
          View
        </a>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700 flex flex-col h-[850px]">
      
      <h2 className="text-lg font-bold text-white border-b border-slate-600 pb-3 mb-4 shrink-0 flex justify-between">
        <span>🗂️ Documents </span>
        <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-600">Total: {fileEntries.length} Files</span>
      </h2>

      {/* UPLOAD ZONE */}
      <div className="mb-4 shrink-0">
        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors">
          <p className="text-sm text-slate-300 font-bold">➕ Click to Upload Files or Receipts</p>
          <input type="file" multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {/* STAGING AREA */}
      {stagedFiles.length > 0 && (
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 mb-6 shrink-0 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-bold text-blue-400">Ready to Upload ({stagedFiles.length})</h3>
            <button 
              onClick={handleBulkUpload} disabled={uploading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading..." : "🚀 Upload to Vault"}
            </button>
          </div>
          
          <div className="space-y-3">
            {stagedFiles.map((staged) => (
              <div key={staged.id} className="bg-slate-800 p-3 rounded-md border border-slate-600 relative pr-8">
                <button onClick={() => removeStagedFile(staged.id)} className="absolute top-2 right-2 text-slate-500 hover:text-red-400 font-bold">✕</button>
                <p className="text-xs font-semibold text-slate-300 truncate mb-2">{staged.file.name}</p>
                
                <div className="flex gap-2 mb-2">
                  <select 
                    value={staged.docCategory}
                    onChange={(e) => updateStagedFile(staged.id, 'docCategory', e.target.value)}
                    className="w-1/3 p-1.5 bg-slate-700 border border-slate-500 text-slate-200 text-xs rounded outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Client">📄 Client Docs</option>
                    <option value="Financial">💳 Financial Docs</option>
                  </select>

                  <select 
                    value={staged.docType}
                    onChange={(e) => updateStagedFile(staged.id, 'docType', e.target.value)}
                    className="w-2/3 p-1.5 bg-slate-700 border border-slate-500 text-slate-200 text-xs rounded outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">-- Select Type --</option>
                    {(staged.docCategory === "Client" ? clientDocOptions : financialDocOptions).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {staged.docType.includes("Other") && (
                  <input 
                    type="text" placeholder="Enter custom document name..." 
                    value={staged.customName} onChange={(e) => updateStagedFile(staged.id, 'customName', e.target.value)}
                    className="w-full p-1.5 bg-slate-700 border border-slate-500 text-slate-200 text-xs rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPLIT VAULT VIEW */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden mt-2 pt-2 border-t border-slate-700">
        
        {/* LEFT VAULT: CLIENT DOCUMENTS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="p-3 bg-slate-700/50 border-b border-slate-600 shrink-0">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">📄 Official Documents</h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {clientFiles.length === 0 ? <p className="text-xs text-slate-500 text-center italic mt-2">No documents.</p> : 
              clientFiles.map(([name, data]) => renderFileRow(name, data, 'blue'))
            }
          </div>
        </div>

        {/* RIGHT VAULT: FINANCIAL & RECEIPTS */}
        <div className="flex-1 flex flex-col overflow-hidden bg-emerald-900/10 rounded-lg border border-emerald-900/30">
          <div className="p-3 bg-emerald-900/20 border-b border-emerald-900/50 shrink-0">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">💳 Financial & Receipts</h3>
          </div>
          <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-2">
            {financialFiles.length === 0 ? <p className="text-xs text-slate-500 text-center italic mt-2">No receipts.</p> : 
              financialFiles.map(([name, data]) => renderFileRow(name, data, 'emerald'))
            }
          </div>
        </div>

      </div>

    </div>
  );
}