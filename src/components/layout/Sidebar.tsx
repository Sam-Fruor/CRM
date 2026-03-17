// src/components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const navigation = [
    // ADMIN & MANAGEMENT
    { name: "Master Overview", href: "/", roles: ["ADMIN", "MANAGEMENT"] },
    { name: "All Leads (Database)", href: "/admin/leads", roles: ["ADMIN", "MANAGEMENT"] },
    { name: "User Management", href: "/admin/users", roles: ["ADMIN"] },

    // SALES TEAM
    { name: "Sales Dashboard", href: "/sales", roles: ["ADMIN", "SALES"] },
    { name: "Leads Workspace", href: "/sales/leads", roles: ["ADMIN", "SALES"] },
    { name: "Exams & Result", href: "/sales/exams", roles: ["ADMIN", "SALES"] },
    { name: "Visual Pipeline", href: "/sales/pipeline", roles: ["ADMIN", "SALES"] },
    { name: "My Calendar", href: "/sales/calendar", roles: ["ADMIN", "SALES"] },
    { name: "Missing Documents", href: "/sales/missing-docs", roles: ["ADMIN", "SALES"] },
    { name: "Resource Center", href: "/sales/resources", roles: ["ADMIN", "SALES"] },

    // OTHER TEAMS
    { name: "Operations Queue", href: "/operations", roles: ["ADMIN", "OPERATIONS"] },
    { name: "HR Dashboard", href: "/hr", roles: ["ADMIN", "HR"] },
    // 👇 NEW TAB ADDED HERE 👇
    { name: "HR Verification", href: "/hr/verification", roles: ["ADMIN", "HR"] }, 
    { name: "Verify Payments", href: "/hr/payments", roles: ["ADMIN", "HR"] }, 
    { name: "Examiner Pending", href: "/examiner", roles: ["ADMIN", "EXAMINER"] },
  ];

  const filteredNav = navigation.filter((item) => 
    userRole && item.roles.includes(userRole)
  );

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen shadow-xl">
      <div className="h-16 flex items-center px-6 bg-slate-950 font-bold text-white tracking-wider shrink-0">
        EURO DRIVER CRM
      </div>

      {/* NAVIGATION LINKS */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/sales");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive ? "bg-blue-600 text-white shadow-sm" : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM UTILITY MENU (Profile & Sign Out) */}
      <div className="p-4 border-t border-slate-800 shrink-0 space-y-1">
        <Link
          href="/profile"
          className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
            pathname === "/profile" ? "bg-slate-700 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <span className="mr-3 text-lg">👤</span> My Profile
        </Link>
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center px-4 py-3 text-sm font-bold text-red-400 rounded-lg hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <span className="mr-3 text-lg">🚪</span> Sign Out
        </button>
      </div>
    </div>
  );
}