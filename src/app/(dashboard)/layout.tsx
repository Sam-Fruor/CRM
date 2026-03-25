// src/app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Secure the entire dashboard route on the server
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // 2. Render the authenticated shell
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        {/* 👇 CHANGED: Replaced p-8 with px-8 pb-8 pt-4 to tighten the top gap! */}
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          {children}
        </main>
      </div>
    </div>
  );
}