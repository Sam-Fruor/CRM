// src/app/(dashboard)/sales/exams/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ExamClient from "./ExamClient";

export default async function SalesExamCenter() {
  const session = await getServerSession(authOptions);

  if (!session || !["SALES", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    redirect("/login");
  }

  // 🛡️ SECURITY: Branch Isolation
  const branchFilter = session.user.branch === "MASTER" ? {} : { branch: session.user.branch as any };

  // Fetch all leads currently in Stage 1 that are dealing with exams
  const activeExamLeads = await prisma.lead.findMany({
    where: {
      caseStatus: "Stage 1 Under Process",
      ...branchFilter
    },
    orderBy: { testDate: "asc" }
  });

  return <ExamClient initialLeads={activeExamLeads} />;
}