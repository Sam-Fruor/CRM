// src/app/(dashboard)/admin/users/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUser } from "@/app/actions/userActions";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      await createUser(formData);
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Failed to create user. Make sure the email is unique.");
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg outline-none focus:ring-2 focus:ring-blue-500";
  const labelStyle = "block text-sm font-bold text-slate-700 mb-1.5";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/users" className="text-slate-400 hover:text-blue-600 transition-colors font-semibold">
          ← Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add New Employee</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelStyle}>Full Name <span className="text-red-500">*</span></label>
              <input type="text" name="name" required className={inputStyle} placeholder="e.g. Mehak" />
            </div>
            <div>
              <label className={labelStyle}>Email Address <span className="text-red-500">*</span></label>
              <input type="email" name="email" required className={inputStyle} placeholder="mehak@eurodriver.com" />
            </div>
          </div>

          <div>
            <label className={labelStyle}>Temporary Password <span className="text-red-500">*</span></label>
            <input type="text" name="password" required className={inputStyle} placeholder="Must be at least 6 characters" minLength={6} />
            <p className="text-xs text-slate-500 mt-1">Provide this password to the employee so they can log in.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div>
              <label className={labelStyle}>System Role <span className="text-red-500">*</span></label>
              <select name="role" required className={inputStyle}>
                <option value="">Select a role...</option>
                <option value="SALES">Sales Representative</option>
                <option value="OPERATIONS">Operations</option>
                <option value="HR">HR Verification</option>
                <option value="EXAMINER">Examiner</option>
                <option value="MANAGEMENT">Management</option>
                <option value="ADMIN">System Admin</option>
              </select>
            </div>
            <div>
              <label className={labelStyle}>Assigned Branch <span className="text-red-500">*</span></label>
              <select name="branch" required className={inputStyle}>
                <option value="">Select a branch...</option>
                <option value="BRANCH_A">Branch A</option>
                <option value="BRANCH_B">Branch B</option>
                <option value="BRANCH_C">Branch C</option>
                <option value="MASTER">Master (All Branches)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Note: Examiners should be assigned to MASTER.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <Link href="/admin/users" className="px-6 py-2.5 rounded-lg font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-50">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className={`px-8 py-2.5 rounded-lg font-bold text-white shadow-sm ${loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}