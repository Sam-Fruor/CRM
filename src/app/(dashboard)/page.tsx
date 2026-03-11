// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardHome() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // 🚦 The Traffic Director: Route users based on their exact role
  switch (session.user.role) {
    case "SALES":
      redirect("/sales");
    case "OPERATIONS":
      redirect("/operations");
    case "HR":
      redirect("/hr");
    case "EXAMINER":
      redirect("/examiner");
    case "ADMIN":
    case "MANAGEMENT":
      break;
    default:
      redirect("/login");
  }

  // 👇 Only ADMIN and MANAGEMENT will ever see this HTML
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Master Overview</h1>
      <p className="text-slate-600">
        Welcome back, {session.user.name}. Select a department from the sidebar to view specific branch queues, or view global reports here.
      </p>
    </div>
  );
}