// src/app/(dashboard)/operations/[id]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

// Import the massive new unified component!
import OpsViewLead from "./ViewLead"; 

export default async function OpsFilePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  // 1. Authenticate User
  const session = await getServerSession(authOptions);
  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // 2. 🚀 AUTO-CORRECT OLD LINKS
  let activeTab = resolvedSearchParams.tab || "ops"; 
  if (activeTab === "details") {
    activeTab = "ops"; // Automatically redirect old table links to the new Ops tab!
  }

  // 3. Fetch all necessary Lead data
  const lead = await prisma.lead.findUnique({
    where: { id: resolvedParams.id },
    include: {
      activities: { orderBy: { createdAt: "desc" }, include: { user: true } },
      testEvaluations: { orderBy: { createdAt: "asc" } } 
    }
  });

  if (!lead) notFound();

  // 4. Render the new 6-tab Unified Interface
  return <OpsViewLead lead={lead} activeTab={activeTab} />;
}