// src/app/(dashboard)/sales/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ViewLead from "./ViewLead"; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ViewLeadPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Get current tab, default to details
  const activeTab = resolvedSearchParams.tab || "details";

  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: true },
      },
      testEvaluations: {
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!lead) {
    notFound();
  }

  // Sanitize dates for the client component
  const safeLead = JSON.parse(JSON.stringify(lead));

  // Pass the active tab down to the UI component
  return <ViewLead lead={safeLead} activeTab={activeTab} />;
}