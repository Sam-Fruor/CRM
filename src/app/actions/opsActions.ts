// src/app/actions/opsActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateOpsFile(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !["OPERATIONS", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const parseDateSafe = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { caseStatus: true, documentFiles: true, documentStatus: true, otherPayments: true }
  });

  // ==========================================
  // 📂 FILE UPLOAD & DOCUMENT VAULT SYNC
  // ==========================================
  const currentFiles = (existingLead?.documentFiles as Record<string, any>) || {};
  const currentStatus = (existingLead?.documentStatus as Record<string, any>) || {};

  const processVaultFile = async (file: File | null, category: string, docType: string, statusKey?: string) => {
    if (file && file.size > 0) {
      // ⚠️ TODO: Replace with your actual cloud storage upload function
      const fileUrl = `/uploads/${file.name}`; 
      
      const newFileEntry = {
        name: file.name,
        url: fileUrl,
        category: category, 
        documentType: docType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.name || "Operations"
      };
      
      currentFiles[`file_${Date.now()}_${Math.floor(Math.random() * 1000)}`] = newFileEntry;
      if (statusKey) currentStatus[statusKey] = true;
    }
  };

  // Process any official documents Ops might upload
  await processVaultFile(formData.get("doc_cv") as File | null, "Client", "CV / Resume", "resumeUploaded");
  await processVaultFile(formData.get("doc_passport") as File | null, "Client", "Passport", "passportUploaded");
  await processVaultFile(formData.get("doc_dl") as File | null, "Client", "Driving License", "dlUploaded");
  await processVaultFile(formData.get("doc_eid") as File | null, "Client", "Emirates ID", "residentIdUploaded");

  // ==========================================
  // 🚀 PARSE DYNAMIC CUSTOM PAYMENTS ("Other / Misc")
  // ==========================================
  // We need to loop through whatever HR already set up for dynamic payments
  // and see if Operations typed any dates or remarks into the matching inputs.
  const currentOtherPayments = Array.isArray(existingLead?.otherPayments) 
    ? existingLead!.otherPayments 
    : JSON.parse((existingLead?.otherPayments as any) || "[]");

  const updatedOtherPayments = currentOtherPayments.map((p: any) => {
    const formDate = formData.get(`date_${p.id}`);
    const formRemarks = formData.get(`remarks_${p.id}`);
    return {
      ...p,
      // Update if Operations typed something, otherwise keep the old data
      date: formDate ? new Date(formDate as string).toISOString() : p.date,
      remarks: formRemarks !== null ? formRemarks : p.remarks
    };
  });

  // ==========================================
  // 💾 DATABASE UPDATE
  // ==========================================
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      caseStatus: formData.get("caseStatus") as string || existingLead?.caseStatus,
      // 🪪 TAB 1: PROFILE EDITS
      leadSource: formData.get("leadSource") as string || undefined,
      category: formData.get("category") as string || undefined,
      countryPreferred: formData.get("countryPreferred") as string || undefined,
      givenName: formData.get("givenName") as string || undefined,
      surname: formData.get("surname") as string || undefined,
      fatherName: formData.get("fatherName") as string || undefined, 
      dob: parseDateSafe(formData.get("dob")),
      nationality: formData.get("nationality") as string || undefined,
      callingNumber: formData.get("callingNumber") as string || undefined,
      whatsappNumber: formData.get("whatsappNumber") as string || undefined,
      email: formData.get("email") as string || undefined,
      experienceHome: formData.get("experienceHome") ? parseInt(formData.get("experienceHome") as string) : undefined,
      experienceGCC: formData.get("experienceGCC") ? parseInt(formData.get("experienceGCC") as string) : undefined,
      previousAgency: formData.get("previousAgency") as string || undefined,
      previousCountry: formData.get("previousCountry") as string || undefined,

      // 🪪 TAB 2: DOCUMENT DATES & NUMBERS
      passportNum: formData.get("passportNum") as string || undefined,
      passportIssueDate: parseDateSafe(formData.get("passportIssueDate")),
      passportExpiry: parseDateSafe(formData.get("passportExpiry")),

      dlNumber: formData.get("dlNumber") as string || undefined,
      dlIssueDate: parseDateSafe(formData.get("dlIssueDate")),
      dlExpiry: parseDateSafe(formData.get("dlExpiry")),

      residentIdNum: formData.get("residentIdNum") as string || undefined,
      residentIdIssueDate: parseDateSafe(formData.get("residentIdIssueDate")),
      residentIdExp: parseDateSafe(formData.get("residentIdExp")),

      documentFiles: currentFiles,
      documentStatus: currentStatus,

      // ⚙️ TAB 5: OPERATIONS PAYMENT COLLECTION (Dates & Remarks Only)
      jobOfferPaymentDate: parseDateSafe(formData.get("jobOfferPaymentDate")),
      jobOfferPaymentRemarks: formData.get("jobOfferPaymentRemarks") as string || undefined,

      workPermitPaymentDate: parseDateSafe(formData.get("workPermitPaymentDate")),
      workPermitPaymentRemarks: formData.get("workPermitPaymentRemarks") as string || undefined,

      insurancePaymentDate: parseDateSafe(formData.get("insurancePaymentDate")),
      insurancePaymentRemarks: formData.get("insurancePaymentRemarks") as string || undefined,

      schoolFeesPaymentDate: parseDateSafe(formData.get("schoolFeesPaymentDate")),
      schoolFeesPaymentRemarks: formData.get("schoolFeesPaymentRemarks") as string || undefined,

      flightTicketPaymentDate: parseDateSafe(formData.get("flightTicketPaymentDate")),
      flightTicketPaymentRemarks: formData.get("flightTicketPaymentRemarks") as string || undefined,

      otherPendingPaymentDate: parseDateSafe(formData.get("otherPendingPaymentDate")),
      otherPendingPaymentRemarks: formData.get("otherPendingPaymentRemarks") as string || undefined,
      
      // 🚀 INJECT THE NEWLY PARSED DYNAMIC PAYMENTS HERE:
      otherPayments: updatedOtherPayments,
      
      opsLastActionDate: parseDateSafe(formData.get("opsLastActionDate")),
      opsNextFollowUpDate: parseDateSafe(formData.get("opsNextFollowUpDate")),

      opsRemarks: formData.get("opsRemarks") as string || undefined,

      activities: {
        create: {
          userId: session.user.id,
          action: "Operations File Updated",
          details: "Operations updated the case file, payment collections, or documents.",
        }
      }
    }
  });

  revalidatePath("/operations");
  revalidatePath(`/operations/${leadId}`);
  revalidatePath("/hr/verification"); 
}