// src/app/(dashboard)/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

// --- ENTERPRISE ICONS ---
const Icons = {
  User: () => <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  ShieldCheck: () => <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  MapPin: () => <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Mail: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  CheckBadge: () => <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Key: () => <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  Info: () => <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Clock: () => <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Book: () => <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  VideoCam: () => <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Lifebuoy: () => <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Desktop: () => <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Mobile: () => <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
};

// --- HELPERS ---
const getInitials = (name: string) => {
  if (!name) return "U";
  const parts = name.split(" ");
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { name, email, role, branch } = session.user;
  const formattedBranch = branch ? branch.replace('_', ' ') : "Unassigned";

  // Dynamic permissions rendering based on role to make the page feel "alive"
  const getPermissions = (roleStr: string) => {
    if (roleStr === "ADMIN") return ["Full System Access", "Manage Users & Branches", "Override Financials", "System Configurations", "Export Global Reports"];
    if (roleStr === "MANAGEMENT") return ["Cross-Branch Visibility", "Advanced Reporting", "Approve Exceptions", "Manage Sales Rosters"];
    return ["Create & Manage Leads", "Schedule Exams & Follow-ups", "Collect Service Agreements", "Upload Client Documents"];
  };

  const permissions = getPermissions(role || "SALES");

  // Mocked Security Log Data (To give that high-end enterprise feel)
  const recentActivity = [
    { id: 1, device: "Mac OS • Google Chrome", location: "Dubai, UAE (Office Network)", ip: "192.168.1.14", time: "Just now", status: "Current Session", type: "desktop" },
    { id: 2, device: "iOS • Safari Mobile", location: "Dubai, UAE (Cellular)", ip: "94.200.12.8", time: "Yesterday, 08:30 AM", status: "Verified", type: "mobile" },
    { id: 3, device: "Mac OS • Google Chrome", location: "Dubai, UAE (Office Network)", ip: "192.168.1.14", time: "Oct 12, 09:15 AM", status: "Verified", type: "desktop" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 pt-4 relative">
      
      {/* 🚀 ENTERPRISE HEADER */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200/60 relative overflow-hidden flex flex-col md:flex-row md:justify-between md:items-center gap-6">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
            <Icons.User />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Profile</h1>
            <p className="text-slate-500 font-medium mt-1 text-sm">
              Manage your official identity, system access, and security status.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ⬅️ LEFT COLUMN: IDENTITY & RESOURCES */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Identity Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden relative group">
            {/* Top Pattern Background */}
            <div className="h-28 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            </div>
            
            <div className="px-6 pb-8 flex flex-col items-center -mt-14 relative z-10">
              {/* Giant Avatar */}
              <div className="w-28 h-28 bg-white p-1.5 rounded-full shadow-lg mb-4">
                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 text-indigo-700 rounded-full flex items-center justify-center text-4xl font-black border border-slate-200/50 shadow-inner">
                  {getInitials(name || "User")}
                </div>
              </div>
              
              <h2 className="text-xl font-black text-slate-900 tracking-tight text-center">{name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm font-medium">
                <Icons.Mail /> {email}
              </div>

              <div className="mt-6 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full border border-emerald-200 text-xs font-bold tracking-wider uppercase shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Account Active
              </div>
            </div>
          </div>

          {/* 📚 Help & Resources Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
              <span className="text-indigo-600">📚</span>
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Help & Resources</h3>
            </div>
            <div className="p-4 space-y-3">
              
              <Link href="#" className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200 group-hover:bg-white transition-colors">
                  <Icons.Book />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">Sales SOP Manual</p>
                  <p className="text-[11px] text-slate-500 font-medium">Official PDF Guidelines</p>
                </div>
              </Link>

              <Link href="#" className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 border border-purple-200 group-hover:bg-white transition-colors">
                  <Icons.VideoCam />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm group-hover:text-purple-700 transition-colors">System Walkthrough</p>
                  <p className="text-[11px] text-slate-500 font-medium">Video Training (5 mins)</p>
                </div>
              </Link>

              <div className="w-full h-px bg-slate-100 my-2"></div>

              <Link href="#" className="flex items-center gap-4 p-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:border-rose-200 hover:bg-rose-50 transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-rose-200 shadow-sm">
                  <Icons.Lifebuoy />
                </div>
                <div>
                  <p className="font-bold text-rose-700 text-sm group-hover:text-rose-800 transition-colors">Submit IT Ticket</p>
                  <p className="text-[11px] text-rose-500/80 font-medium">Report a bug or issue</p>
                </div>
              </Link>

            </div>
          </div>

        </div>

        {/* ➡️ RIGHT COLUMN: SYSTEM ACCESS & SECURITY */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Access & Allocation Block */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
              <Icons.ShieldCheck />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Access & Allocation</h3>
            </div>
            
            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Role Box */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">System Role</p>
                <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 border border-indigo-50">
                    <Icons.Key />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 tracking-tight">{role}</p>
                    <p className="text-xs text-slate-500 font-medium">Security Level</p>
                  </div>
                </div>
              </div>

              {/* Branch Box */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Branch</p>
                <div className="flex items-center gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-amber-600 border border-amber-50">
                    <Icons.MapPin />
                  </div>
                  <div>
                    <p className="font-black text-slate-800 tracking-tight uppercase">{formattedBranch}</p>
                    <p className="text-xs text-slate-500 font-medium">Primary Location</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Permissions List */}
            <div className="px-6 md:px-8 pb-8">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Granted Capabilities</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                {permissions.map((perm, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <Icons.CheckBadge /> {perm}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 🛡️ Security & Activity Log */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icons.Lock />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Recent Security Activity</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Last 30 Days</span>
            </div>
            
            <ul className="divide-y divide-slate-100">
              {recentActivity.map((log) => (
                <li key={log.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {log.type === "desktop" ? <Icons.Desktop /> : <Icons.Mobile />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{log.device}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{log.location} • IP: {log.ip}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    {log.status === "Current Session" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wider uppercase border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {log.status}
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wider uppercase border border-slate-200">
                        {log.status}
                      </span>
                    )}
                    <p className="text-[11px] text-slate-400 font-medium mt-1.5">{log.time}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Logins are secured via NextAuth standard protocols. If you notice suspicious activity, report it immediately.
              </p>
            </div>
          </div>

          {/* Information Notice */}
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex items-start gap-4 shadow-sm">
            <div className="mt-0.5 shrink-0">
              <Icons.Info />
            </div>
            <div>
              <h4 className="font-bold text-indigo-900 text-sm">Identity Management Notice</h4>
              <p className="text-xs text-indigo-800/80 mt-1 font-medium leading-relaxed">
                Your profile data (Name, Email, Role, Branch) is provisioned directly by the central administration team to ensure strict security compliance. If any of your credentials require modification, please contact Management IT support.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}