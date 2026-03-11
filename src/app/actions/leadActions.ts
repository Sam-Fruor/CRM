// src/app/actions/leadActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Document Checklist (Added Video)
  const documentStatus = {
    resumeUploaded: formData.get("resumeUploaded") === "on",
    passportUploaded: formData.get("passportUploaded") === "on",
    dlUploaded: formData.get("dlUploaded") === "on",
    residentIdUploaded: formData.get("residentIdUploaded") === "on",
    videoUploaded: formData.get("videoUploaded") === "on",
    otherUploaded: formData.get("otherUploaded") === "on",
  };

  const parseDate = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  const parseFloatSafe = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  await prisma.lead.create({
    data: {
      branch: session.user.branch as any,
      salesRepId: session.user.id,
      
      // Routing & Classification
      leadSource: formData.get("leadSource") as string || "Direct",
      leadSourceOther: formData.get("leadSourceOther") as string,
      category: formData.get("category") as string || "Pending",
      categoryOther: formData.get("categoryOther") as string,
      countryPreferred: formData.get("countryPreferred") as string || "Pending",
      countryOther: formData.get("countryOther") as string,
      
      // Client Information
      givenName: formData.get("givenName") as string,
      surname: formData.get("surname") as string,
      dob: parseDate(formData.get("dob")),
      fatherName: formData.get("fatherName") as string,
      nationality: formData.get("nationality") as string,
      email: formData.get("email") as string,
      callingNumber: formData.get("callingNumber") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
      homeCountryNumber: formData.get("homeCountryNumber") as string,
      homeAddress: formData.get("homeAddress") as string,
      
      // Identification Numbers
      passportNum: formData.get("passportNum") as string,
      dlNumber: formData.get("dlNumber") as string,
      residentIdNum: formData.get("residentIdNum") as string,
      
      // Experience
      experienceHome: parseInt(formData.get("experienceHome") as string) || 0,
      experienceGCC: parseInt(formData.get("experienceGCC") as string) || 0,
      previousAgency: formData.get("previousAgency") as string,
      previousCountry: formData.get("previousCountry") as string,
      
      // Sales / Stage 1 Processing
      caseStatus: "Stage 1 Under Process", 
      feedbackStatus: formData.get("feedbackStatus") as string,
      slotBookingDate: parseDate(formData.get("slotBookingDate")),
      testDate: parseDate(formData.get("testDate")),
      
      // Payments
      testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
      totalPayment: parseFloatSafe(formData.get("totalPayment")),
      invoiceNumber: formData.get("invoiceNumber") as string,
      paymentDate: parseDate(formData.get("paymentDate")),
      
      // Follow-ups
      lastCallDate: parseDate(formData.get("lastCallDate")),
      followUpDate: parseDate(formData.get("followUpDate")),
      followUpRemarks: formData.get("followUpRemarks") as string,
      salesRemarks: formData.get("salesRemarks") as string,
      
      // Document Dates & JSON
      documentStatus: documentStatus,
      passportIssueDate: parseDate(formData.get("passportIssueDate")),
      passportExpiry: parseDate(formData.get("passportExpiry")),
      dlIssueDate: parseDate(formData.get("dlIssueDate")),
      dlExpiry: parseDate(formData.get("dlExpiry")),
      residentIdIssueDate: parseDate(formData.get("residentIdIssueDate")),
      residentIdExp: parseDate(formData.get("residentIdExp")),

      activities: {
        create: {
          userId: session.user.id,
          action: "Lead Created",
          details: "Initial Step 1 information added by Sales.",
        }
      }
    }
  });

  revalidatePath("/sales");
}

export async function updateLeadStage1(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const documentStatus = {
    resumeUploaded: formData.get("resumeUploaded") === "on",
    passportUploaded: formData.get("passportUploaded") === "on",
    dlUploaded: formData.get("dlUploaded") === "on",
    residentIdUploaded: formData.get("residentIdUploaded") === "on",
    videoUploaded: formData.get("videoUploaded") === "on",
    otherUploaded: formData.get("otherUploaded") === "on",
  };

  const parseDate = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  const parseFloatSafe = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      leadSource: formData.get("leadSource") as string,
      leadSourceOther: formData.get("leadSourceOther") as string,
      category: formData.get("category") as string,
      categoryOther: formData.get("categoryOther") as string,
      countryPreferred: formData.get("countryPreferred") as string,
      countryOther: formData.get("countryOther") as string,
      
      givenName: formData.get("givenName") as string,
      surname: formData.get("surname") as string,
      dob: parseDate(formData.get("dob")),
      fatherName: formData.get("fatherName") as string,
      nationality: formData.get("nationality") as string,
      email: formData.get("email") as string,
      callingNumber: formData.get("callingNumber") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
      homeCountryNumber: formData.get("homeCountryNumber") as string,
      homeAddress: formData.get("homeAddress") as string,
      
      passportNum: formData.get("passportNum") as string,
      dlNumber: formData.get("dlNumber") as string,
      residentIdNum: formData.get("residentIdNum") as string,
      
      experienceHome: parseInt(formData.get("experienceHome") as string) || 0,
      experienceGCC: parseInt(formData.get("experienceGCC") as string) || 0,
      previousAgency: formData.get("previousAgency") as string,
      previousCountry: formData.get("previousCountry") as string,
      
      feedbackStatus: formData.get("feedbackStatus") as string,
      slotBookingDate: parseDate(formData.get("slotBookingDate")),
      testDate: parseDate(formData.get("testDate")),
      
      testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
      totalPayment: parseFloatSafe(formData.get("totalPayment")),
      invoiceNumber: formData.get("invoiceNumber") as string,
      paymentDate: parseDate(formData.get("paymentDate")),
      
      lastCallDate: parseDate(formData.get("lastCallDate")),
      followUpDate: parseDate(formData.get("followUpDate")),
      followUpRemarks: formData.get("followUpRemarks") as string,
      salesRemarks: formData.get("salesRemarks") as string,
      
      documentStatus: documentStatus,
      passportIssueDate: parseDate(formData.get("passportIssueDate")),
      passportExpiry: parseDate(formData.get("passportExpiry")),
      dlIssueDate: parseDate(formData.get("dlIssueDate")),
      dlExpiry: parseDate(formData.get("dlExpiry")),
      residentIdIssueDate: parseDate(formData.get("residentIdIssueDate")),
      residentIdExp: parseDate(formData.get("residentIdExp")),

      activities: {
        create: {
          userId: session.user.id,
          action: "Lead Updated",
          details: "Stage 1 information or documents were updated.",
        }
      }
    }
  });

  revalidatePath("/sales");
}

// Add this to the bottom of src/app/actions/leadActions.ts

export async function updateLeadPipelineStatus(leadId: string, newStatus: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // Map the pipeline columns back to your database dropdown values
  let dbStatus = newStatus;
  if (newStatus === "Pending") dbStatus = "";
  if (newStatus === "Following Up") dbStatus = "Not Responding"; 

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      feedbackStatus: dbStatus,
      activities: {
        create: {
          userId: session.user.id,
          action: "Pipeline Moved",
          details: `Moved client to ${newStatus} on the visual board.`,
        }
      }
    }
  });

  revalidatePath("/sales/pipeline");
}

// Add this to the bottom of src/app/actions/leadActions.ts

export async function transferToStage2(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      caseStatus: "Stage 2 (Ops & HR)",
      activities: {
        create: {
          userId: session.user.id,
          action: "Transferred to Stage 2",
          details: "Sales has officially handed off this file to Operations and HR.",
        }
      }
    }
  });

  revalidatePath("/sales");
  revalidatePath(`/sales/${leadId}`);
}