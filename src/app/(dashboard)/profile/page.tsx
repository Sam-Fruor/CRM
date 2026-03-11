// src/app/(dashboard)/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 text-sm mt-1">View your official system profile and access level.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-6 mb-8 border-b border-slate-100 pb-6">
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold">
            {session.user.name?.[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{session.user.name}</h2>
            <p className="text-slate-500">{session.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Role</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold">
              {session.user.role}
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Branch</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold">
              {session.user.branch.replace('_', ' ')}
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
          ℹ️ Your profile information is managed by the system administrator. If your name, email, or role needs to be updated, please contact Management.
        </div>
      </div>
    </div>
  );
}