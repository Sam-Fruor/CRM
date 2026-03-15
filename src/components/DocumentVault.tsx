// src/app/(dashboard)/hr/[id]/DocumentVault.tsx
"use client";

import { useState } from "react";
import { saveMultipleDocuments } from "@/app/actions/documentActions";

type StagedFile = {
  id: string;
  file: File;
  docType: string;
  customName: string;
};

export default function DocumentVault({ leadId, existingDocs }: { leadId: string, existingDocs: any }) {
  const [uploading, setUploading] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);

  // Parse existing documents
  const uploadedFiles = typeof existingDocs === 'object' && existingDocs !== null ? existingDocs : {};
  const fileEntries = Object.entries(uploadedFiles);

  const documentOptions = [
    "Yard Test Report", "Yard Video", "Signed Service Agreement", "Passport", "Emirates ID", 
    "UAE Visa Copy", "CV / Resume", "Photograph", "Driving License", "Police Clearance Certificate", 
    "Home Address Proof", "Office Address Proof", "Intl. Driving License", "Experience Certificate", 
    "Signed Job Offer Letter", "Signed Work Permit", "Signed Employment Contract", "Visa Submission Receipt", 
    "Insurance Document", "Visa Appointment Info", "Approved Visa Copy", "Visa Rejection Letter", 
    "School Fees Receipt", "Flight Ticket", "Other"
  ];

  // Handle multiple file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newStaged = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      docType: "",
      customName: ""
    }));

    setStagedFiles(prev => [...prev, ...newStaged]);
    e.target.value = ''; // Reset input so they can add more if needed
  };

  const updateStagedFile = (id: string, field: 'docType' | 'customName', value: string) => {
    setStagedFiles(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const removeStagedFile = (id: string) => {
    setStagedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleBulkUpload = async () => {
    // Validation
    for (const f of stagedFiles) {
      if (!f.docType) return alert(`Please select a document type for ${f.file.name}`);
      if (f.docType === "Other" && !f.customName) return alert(`Please provide a custom name for ${f.file.name}`);
    }

    setUploading(true);
    const uploadedRecords: Record<string, string> = {};

    try {
      // ⚠️ TODO: YOUR CLOUD STORAGE LOGIC LOOP GOES HERE ⚠️
      // You will loop through `stagedFiles`, upload them to Supabase/AWS, and get the URLs
      
      for (const staged of stagedFiles) {
        const finalDocName = staged.docType === "Other" ? staged.customName : staged.docType;
        
        // 👉 SIMULATED UPLOAD URL:
        const fakeUploadedUrl = `https://your-storage-bucket.com/uploads/${leadId}/${staged.file.name}`;
        
        // Add to our payload
        uploadedRecords[finalDocName] = fakeUploadedUrl;
      }

      // Save all to database at once!
      await saveMultipleDocuments(leadId, uploadedRecords);
      
      alert(`✅ ${stagedFiles.length} documents uploaded successfully!`);
      setStagedFiles([]); // Clear staging area
    } catch (error) {
      console.error(error);
      alert("Failed to upload documents.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700 flex flex-col h-[800px]">
      <h2 className="text-lg font-bold text-white border-b border-slate-600 pb-3 mb-4 flex justify-between items-center shrink-0">
        <span>🗂️ Document Vault</span>
        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">{fileEntries.length} Files</span>
      </h2>

      {/* MULTIPLE FILE SELECTOR */}
      <div className="mb-4 shrink-0">
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/50 hover:bg-slate-700 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="text-sm text-slate-300 font-bold">Click to select multiple files</p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB</p>
          </div>
          <input type="file" multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {/* STAGING AREA (Only shows if files are selected) */}
      {stagedFiles.length > 0 && (
        <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30 mb-6 shrink-0 max-h-64 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-end mb-3">
            <h3 className="text-sm font-bold text-blue-400">Ready to Upload ({stagedFiles.length})</h3>
            <button 
              onClick={handleBulkUpload}
              disabled={uploading}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {uploading ? "Uploading All..." : "🚀 Upload All Files"}
            </button>
          </div>
          
          <div className="space-y-3">
            {stagedFiles.map((staged) => (
              <div key={staged.id} className="bg-slate-800 p-3 rounded-md border border-slate-600 relative pr-8">
                <button 
                  onClick={() => removeStagedFile(staged.id)}
                  className="absolute top-2 right-2 text-slate-500 hover:text-red-400 font-bold"
                >
                  ✕
                </button>
                <p className="text-xs font-semibold text-slate-300 truncate mb-2">{staged.file.name}</p>
                <select 
                  value={staged.docType}
                  onChange={(e) => updateStagedFile(staged.id, 'docType', e.target.value)}
                  className="w-full p-1.5 bg-slate-700 border border-slate-500 text-slate-200 text-xs rounded outline-none focus:ring-1 focus:ring-blue-500 mb-2"
                >
                  <option value="">-- Tag Document Type --</option>
                  {documentOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {staged.docType === "Other" && (
                  <input 
                    type="text" 
                    placeholder="Enter custom document name..." 
                    value={staged.customName}
                    onChange={(e) => updateStagedFile(staged.id, 'customName', e.target.value)}
                    className="w-full p-1.5 bg-slate-700 border border-slate-500 text-slate-200 text-xs rounded outline-none focus:ring-1 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMPLETED / UPLOADED FILES LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 mt-2 border-t border-slate-700 pt-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Documents</h3>
        {fileEntries.length === 0 ? (
          <p className="text-xs text-slate-500 text-center italic mt-4">No documents uploaded yet.</p>
        ) : (
          fileEntries.map(([name, url]) => (
            <div key={name} className="flex items-center justify-between p-3 bg-slate-700 border border-slate-600 rounded-lg group">
              <div className="flex items-center gap-3 overflow-hidden">
                <span className="text-2xl shrink-0">📄</span>
                <p className="text-sm font-semibold text-slate-200 truncate" title={name}>{name}</p>
              </div>
              <a 
                href={url as string} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-slate-800 px-3 py-1.5 rounded-md border border-slate-600 shrink-0 transition-colors"
              >
                View
              </a>
            </div>
          ))
        )}
      </div>

    </div>
  );
}