// src/app/actions/opsActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// src/app/actions/opsActions.ts

export async function updateOpsFile(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const parseFloatSafe = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  const newStatus = formData.get("caseStatus") as string;

  // 1. Fetch existing lead to check if the status ACTUALLY changed
  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { caseStatus: true }
  });

  // 2. Build a smart activity message
  let activityTitle = "Operations Ledger Updated";
  let activityMessage = "Operations updated the financial ledger or case remarks.";

  if (existingLead && existingLead.caseStatus !== newStatus) {
    activityTitle = "Operations Routed File";
    activityMessage = `Operations routed the file from "${existingLead.caseStatus}" to "${newStatus}". Financials were updated.`;
  }

  // Inside src/app/actions/opsActions.ts -> updateOpsFile()

  const parseDate = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  // ... (skip down to the prisma.lead.update section)

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      caseStatus: newStatus,
      
      // 👇 ADDED: Section 2 Profile Edits
      givenName: formData.get("givenName") as string || undefined,
      surname: formData.get("surname") as string || undefined,
      fatherName: formData.get("fatherName") as string || undefined, 
      dlNumber: formData.get("dlNumber") as string || undefined, 
      dob: parseDate(formData.get("dob")) || undefined,
      nationality: formData.get("nationality") as string || undefined,
      passportNum: formData.get("passportNum") as string || undefined,
      residentIdNum: formData.get("residentIdNum") as string || undefined,
      callingNumber: formData.get("callingNumber") as string || undefined,
      whatsappNumber: formData.get("whatsappNumber") as string || undefined,
      email: formData.get("email") as string || undefined,

      // 👇 ADDED: Section 3 Experience Edits
      experienceHome: parseInt(formData.get("experienceHome") as string) || undefined,
      experienceGCC: parseInt(formData.get("experienceGCC") as string) || undefined,
      previousAgency: formData.get("previousAgency") as string || undefined,
      previousCountry: formData.get("previousCountry") as string || undefined,

      // Ops Primary Ledger
      totalPayment: parseFloatSafe(formData.get("totalPayment")),
      opsRemarks: formData.get("opsRemarks") as string,

      activities: {
        create: {
          userId: session.user.id,
          action: activityTitle,
          details: activityMessage,
        }
      }
    }
  });

  revalidatePath("/operations");
  revalidatePath(`/operations/${leadId}`);
  revalidatePath("/hr/verification"); 
}