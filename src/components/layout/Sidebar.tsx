// src/components/layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

// 🎨 ENTERPRISE SVG ICONS
const Icons = {
  Menu: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  Overview: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Database: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Dashboard: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Leads: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Exams: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  Pipeline: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>,
  Calendar: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  MissingDocs: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Resources: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Queue: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  HR: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Payments: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Examiner: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  UserCircle: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  LogOut: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  
  // 🚀 COLLAPSE STATE
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 🚀 AUTO-COLLAPSE LOGIC BASED ON ROUTE
  useEffect(() => {
    // These are the root "Dashboard" pages for each portal
    const mainDashboards = ["/", "/sales", "/hr", "/operations", "/examiner"];
    
    if (mainDashboards.includes(pathname)) {
      setIsCollapsed(false); // Open wide on main dashboards
    } else {
      setIsCollapsed(true);  // Automatically shrink on sub-pages (tables, forms, profiles)
    }
  }, [pathname]);

  const navigation = [
    // ADMIN & MANAGEMENT
    { name: "Master Overview", href: "/", roles: ["ADMIN", "MANAGEMENT"], group: "System & Management", icon: <Icons.Overview /> },
    { name: "All Leads (Database)", href: "/admin/leads", roles: ["ADMIN", "MANAGEMENT"], group: "System & Management", icon: <Icons.Database /> },
    { name: "User Management", href: "/admin/users", roles: ["ADMIN"], group: "System & Management", icon: <Icons.Users /> },

    // SALES TEAM
    { name: "Sales Dashboard", href: "/sales", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Dashboard /> },
    { name: "Leads Workspace", href: "/sales/leads", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Leads /> },
    { name: "Exams & Result", href: "/sales/exams", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Exams /> },
    { name: "Visual Pipeline", href: "/sales/pipeline", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Pipeline /> },
    { name: "My Calendar", href: "/sales/calendar", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Calendar /> },
    { name: "Missing Documents", href: "/sales/missing-docs", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.MissingDocs /> },
    { name: "Resource Center", href: "/sales/resources", roles: ["ADMIN", "SALES"], group: "Sales & Pipeline", icon: <Icons.Resources /> },

    // OTHER TEAMS
    { name: "Operations Queue", href: "/operations", roles: ["ADMIN", "OPERATIONS"], group: "Operations Team", icon: <Icons.Queue /> },
    { name: "Operations Verification", href: "/operations/verification", roles: ["ADMIN", "OPERATIONS"], group: "Operations Team", icon: <Icons.Shield /> },
    
    { name: "HR Dashboard", href: "/hr", roles: ["ADMIN", "HR"], group: "Human Resources", icon: <Icons.HR /> },
    { name: "HR Verification", href: "/hr/verification", roles: ["ADMIN", "HR"], group: "Human Resources", icon: <Icons.Shield /> }, 
    { name: "Verify Payments", href: "/hr/payments", roles: ["ADMIN", "HR"], group: "Human Resources", icon: <Icons.Payments /> }, 
    { name: "Archived Leads", href: "/hr/archived", roles: ["ADMIN", "HR"], group: "Human Resources", icon: <Icons.Payments /> }, 
    
    { name: "Examiner Pending", href: "/examiner", roles: ["ADMIN", "EXAMINER"], group: "Testing & Evaluations", icon: <Icons.Examiner /> },
  ];

  const filteredNav = navigation.filter((item) => 
    userRole && item.roles.includes(userRole)
  );

  return (
    // 🚀 DYNAMIC WIDTH: Smoothly animates between w-64 (256px) and w-20 (80px)
    <div className={`bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col min-h-screen shadow-2xl transition-all duration-300 ease-in-out z-50 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      
      {/* HEADER / LOGO & HAMBURGER */}
      <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-5'} bg-slate-950 border-b border-slate-800 shrink-0 transition-all`}>
        
        {!isCollapsed && (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white font-black text-lg shrink-0">
              E
            </div>
            <div className="font-black text-white tracking-widest text-sm">
              EURO DRIVER
            </div>
          </div>
        )}

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <Icons.Menu />
        </button>
      </div>

      {/* NAVIGATION LINKS */}
      <nav className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {filteredNav.map((item, index) => {
          
          const isActive = (() => {
            if (item.href === "/") return pathname === "/";
            if (pathname === item.href) return true;

            if (pathname.startsWith(item.href + "/")) {
              if (item.href === "/hr" && (pathname.startsWith("/hr/verification") || pathname.startsWith("/hr/payments"))) return false;
              if (item.href === "/operations" && pathname.startsWith("/operations/verification")) return false;
              if (item.href === "/sales" && (
                pathname.startsWith("/sales/leads") || 
                pathname.startsWith("/sales/exams") || 
                pathname.startsWith("/sales/pipeline") || 
                pathname.startsWith("/sales/calendar") || 
                pathname.startsWith("/sales/missing-docs") || 
                pathname.startsWith("/sales/resources") ||
                pathname.startsWith("/sales/form") 
              )) return false;
              return true;
            }
            return false;
          })();

          // Detect when to show a section header
          const showGroup = index === 0 || item.group !== filteredNav[index - 1].group;

          return (
            <React.Fragment key={item.name}>
              
              {/* Group Headers vs Simple Dividers based on state */}
              {showGroup && !isCollapsed && (
                <div className="px-3 mt-6 mb-2 text-[10px] font-bold tracking-widest text-slate-500 uppercase overflow-hidden whitespace-nowrap">
                  {item.group}
                </div>
              )}
              {showGroup && isCollapsed && index !== 0 && (
                <div className="my-3 border-t border-slate-800/80 mx-2"></div>
              )}

              <Link
                href={item.href}
                title={isCollapsed ? item.name : undefined} // Tooltip shows up only when collapsed
                className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} text-sm font-semibold rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400" 
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <span className={`shrink-0 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
                  {item.icon}
                </span>
                
                {!isCollapsed && (
                  <span className="overflow-hidden whitespace-nowrap opacity-100 transition-opacity duration-300">
                    {item.name}
                  </span>
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* BOTTOM UTILITY MENU */}
      <div className={`border-t border-slate-800 shrink-0 space-y-1 bg-slate-950 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <Link
          href="/profile"
          title={isCollapsed ? "My Profile" : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} text-sm font-semibold rounded-lg transition-all duration-200 group ${
            pathname === "/profile" 
              ? "bg-indigo-500/10 text-indigo-400" 
              : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
          }`}
        >
          <span className={`shrink-0 ${pathname === "/profile" ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"} transition-colors`}>
            <Icons.UserCircle />
          </span>
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">My Profile</span>}
        </Link>
        
        <button 
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={isCollapsed ? "Sign Out" : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5'} text-sm font-semibold text-rose-400/90 rounded-lg hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-200 group`}
        >
          <span className="shrink-0 text-rose-500/70 group-hover:text-rose-400 transition-colors">
            <Icons.LogOut />
          </span>
          {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">Sign Out</span>}
        </button>
      </div>
    </div>
  );
}