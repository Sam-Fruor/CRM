// src/app/(dashboard)/admin/users/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteUserButton from "./DeleteUserButton"; // <-- Import the new client component

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex justify-between items-center bg-slate-900 p-8 rounded-xl shadow-md text-white">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Add, remove, and manage system access for your staff.</p>
        </div>
        <Link 
          href="/admin/users/form" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors"
        >
          + Add New User
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider bg-slate-50">
                <th className="p-4 font-semibold">Employee Details</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Branch</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-700 text-sm">{user.role}</span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">
                      {user.branch.replace("BRANCH_", "Branch ")}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {/* 👇 Use the new Client Component here */}
                    {session.user.id !== user.id && (
                      <DeleteUserButton userId={user.id} userName={user.name} />
                    )}
                    {session.user.id === user.id && (
                      <span className="text-xs font-bold text-slate-400 italic">Current User</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}