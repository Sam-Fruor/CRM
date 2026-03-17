// src/app/(dashboard)/hr/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import HRViewLead from "./ViewLead"; 

export default async function HRFileView({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const activeTab = resolvedSearchParams.tab || "details";

  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: true }
      },
      testEvaluations: {
        orderBy: { createdAt: "desc" } 
      }
    }
  });

  if (!lead) notFound();

  return <HRViewLead lead={lead} activeTab={activeTab} />;
}