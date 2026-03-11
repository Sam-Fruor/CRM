"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitTestResults(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !["EXAMINER", "ADMIN", "MANAGEMENT"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const examinerStatus = formData.get("examinerStatus") as string;
  
  // 1. Get the lead first so we know who the Sales Rep is
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });

  // 2. Keep the file in Stage 1 so Sales is forced to review it
  const newCaseStatus = "Stage 1 Under Process";

  // 3. Update the Lead
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      englishScore: parseInt(formData.get("englishScore") as string) || null,
      drivingScore: parseInt(formData.get("drivingScore") as string) || null,
      englishTestResult: formData.get("englishTestResult") as string,
      yardTestResult: formData.get("yardTestResult") as string,
      examinerStatus: examinerStatus,
      examinerRemarks: formData.get("examinerRemarks") as string,
      caseStatus: newCaseStatus,
      activities: {
        create: {
          userId: session.user.id,
          action: "Test Results Submitted",
          details: `Examiner marked client as ${examinerStatus}.`,
        }
      }
    }
  });

  // 4. 🔥 FIRE THE NOTIFICATION TO THE SALES REP
  if (lead?.salesRepId) {
    await prisma.notification.create({
      data: {
        userId: lead.salesRepId,
        title: examinerStatus === "Approved" ? "✅ Test Passed!" : "🔴 Test Failed",
        message: `${lead.givenName} ${lead.surname} was graded by the Examiner. Result: ${examinerStatus}.`,
        link: `/sales/${lead.id}`
      }
    });
  }

  revalidatePath("/examiner");
}