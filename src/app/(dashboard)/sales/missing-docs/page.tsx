// src/app/(dashboard)/sales/missing-docs/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MissingDocsClient from "./MissingDocsClient";

export default async function MissingDocsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    redirect("/login");
  }

  // 1. Fetch leads for this branch
  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };
  const allLeads = await prisma.lead.findMany({
    where: branchCondition,
    orderBy: { updatedAt: "asc" }, // Show oldest updated first to highlight urgent chases
  });

  // 2. Smart Filter: Find active leads with missing documents
  const missingDocsQueue = allLeads.map(lead => {
    const docs = (lead.documentStatus as any) || {};
    const missing = [];
    
    // Check our core 5 requirements
    if (!docs.resumeUploaded) missing.push("CV/Resume");
    if (!docs.dlUploaded) missing.push("Driving Licence");
    if (!docs.residentIdUploaded) missing.push("Resident ID");
    if (!docs.passportUploaded) missing.push("Passport");
    if (!docs.videoUploaded) missing.push("Driving Video");

    return { ...lead, missingList: missing };
  }).filter(lead => 
    lead.missingList.length > 0 && 
    !["Not Interested", "Not Eligible"].includes(lead.feedbackStatus || "") &&
    lead.caseStatus === "Stage 1 Under Process"
  );

  return <MissingDocsClient initialLeads={missingDocsQueue} />;
}