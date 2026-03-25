// src/app/actions/hrActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// TASK 1: HR Signs Agreement & Sends to Ops
export async function processAgreement(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const enrollmentAmount = parseFloat(formData.get("enrollmentAmount") as string) || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      serviceAgreementPending: enrollmentAmount, 
      caseStatus: "Stage 2: Ops - Welcome & Docs", // 🏓 PING TO OPS!
      activities: {
        create: {
          userId: session.user.id,
          action: "Agreement Signed",
          details: `HR confirmed the service agreement is signed. Sent to Ops for Welcome Email and document collection.`,
        }
      }
    }
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/${leadId}`);
}

// TASK 2: HR Uploads Job Offer & Requests Payment from Ops
export async function processJobOffer(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const jobOfferPending = parseFloat(formData.get("jobOfferPending") as string) || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      jobOfferPending: jobOfferPending,
      caseStatus: "Stage 2: Ops - Collect Job Offer Payment", // 🏓 PING TO OPS!
      activities: {
        create: {
          userId: session.user.id,
          action: "Job Offer Secured",
          details: `HR secured the Job Offer. Ops pinged to collect $${jobOfferPending || 0} payment.`,
        }
      }
    }
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/${leadId}`);
}

// TASK 3: HR Uploads Work Permit & Requests Final Payment from Ops
export async function processWorkPermit(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const workPermitPending = parseFloat(formData.get("workPermitPending") as string) || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      workPermitPending: workPermitPending,
      caseStatus: "Stage 2: Ops - Collect WP Payment", // 🏓 PING TO OPS!
      activities: {
        create: {
          userId: session.user.id,
          action: "Work Permit Secured",
          details: `HR secured the Work Permit. Ops pinged to collect $${workPermitPending || 0} payment before sharing.`,
        }
      }
    }
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/${leadId}`);
}

// MASTER UPDATE HR FILE ROUTINE
export async function updateHRFile(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const parseFloatSafe = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  };

  const parseDate = (val: FormDataEntryValue | null) => {
    if (!val || typeof val !== 'string') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  const newStatus = formData.get("caseStatus") as string;

  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { caseStatus: true, updatedAt: true, otherPayments: true } 
  });

  let activityTitle = "HR Profile Updated";
  let activityMessage = "HR updated the client's profile data or financial ledger.";

  if (existingLead && existingLead.caseStatus !== newStatus) {
    const msSpent = Date.now() - existingLead.updatedAt.getTime();
    const daysSpent = Math.floor(msSpent / (1000 * 60 * 60 * 24));
    const timeText = daysSpent === 0 ? "less than a day" : `${daysSpent} days`;

    activityTitle = "Stage Advanced";
    activityMessage = `HR moved the file to "${newStatus}". (File spent ${timeText} in "${existingLead.caseStatus}").`;
  }

  // 🚀 2. PARSE DYNAMIC CUSTOM PAYMENTS (WITH STRICT BACKEND LOCKING)
  const customPaymentIds = formData.getAll("customPaymentIds") as string[];
  const existingOtherPayments = Array.isArray(existingLead?.otherPayments) 
    ? existingLead!.otherPayments 
    : JSON.parse((existingLead?.otherPayments as any) || "[]");
  
  // 🔒 BACKEND PROTECTION: Find any approved payments that were accidentally/maliciously deleted from the UI
  const forcedPreservedPayments = existingOtherPayments.filter((ep: any) => 
    ep.status === 'Approved' && !customPaymentIds.includes(ep.id)
  );

  const updatedOtherPayments = customPaymentIds.map(id => {
    const existing = existingOtherPayments.find((ep: any) => ep.id === id) || {};
    
    // 🔒 BACKEND PROTECTION: If it's already approved, completely ignore the form data and keep it locked!
    if (existing.status === 'Approved') {
      return existing; 
    }

    return {
      ...existing,
      id,
      name: formData.get(`customName_${id}`) as string,
      amount: parseFloatSafe(formData.get(`customAmount_${id}`)),
      status: existing.status || "Unsubmitted"
    };
  });

  const finalOtherPayments = [...forcedPreservedPayments, ...updatedOtherPayments];

  // 3. Update the Database
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      caseStatus: newStatus,
      
      givenName: formData.get("givenName") as string,
      surname: formData.get("surname") as string,
      fatherName: formData.get("fatherName") as string, 
      dlNumber: formData.get("dlNumber") as string, 
      dob: parseDate(formData.get("dob")),
      nationality: formData.get("nationality") as string,
      passportNum: formData.get("passportNum") as string,
      passportExpiry: parseDate(formData.get("passportExpiry")),
      residentIdNum: formData.get("residentIdNum") as string,
      residentIdExp: parseDate(formData.get("residentIdExp")),
      callingNumber: formData.get("callingNumber") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
      email: formData.get("email") as string,
      
      // Payments Tracker (Read the UI values. Since the UI locks them to readOnly, it submits the safe existing value).
      testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
      totalPayment: parseFloatSafe(formData.get("totalPayment")),
      serviceAgreementPending: parseFloatSafe(formData.get("serviceAgreementPending")),
      jobOfferPending: parseFloatSafe(formData.get("jobOfferPending")),
      workPermitPending: parseFloatSafe(formData.get("workPermitPending")),
      insurancePending: parseFloatSafe(formData.get("insurancePending")),
      schoolFeesPending: parseFloatSafe(formData.get("schoolFeesPending")),
      flightTicketPending: parseFloatSafe(formData.get("flightTicketPending")),
      otherPending: parseFloatSafe(formData.get("otherPending")),
      
      // 🚀 INJECT THE NEWLY ASSEMBLED AND SECURED CUSTOM PAYMENTS ARRAY
      otherPayments: finalOtherPayments,

      lastEmailDate: parseDate(formData.get("lastEmailDate")),
      hrNextFollowUpDate: parseDate(formData.get("hrNextFollowUpDate")),
      hrRemarks: formData.get("hrRemarks") as string,

      activities: {
        create: {
          userId: session.user.id,
          action: activityTitle,
          details: activityMessage,
        }
      }
    }
  });

  revalidatePath("/hr");
  revalidatePath(`/hr/verification`);
  revalidatePath(`/hr/${leadId}`);
  revalidatePath(`/operations/verification`);
}

export async function saveDocumentRecord(leadId: string, docName: string, fileUrl: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // 1. Fetch the current documents JSON
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { documentFiles: true } });
  
  // 2. Parse it safely
  const currentDocs = typeof lead?.documentFiles === 'object' && lead?.documentFiles !== null 
    ? (lead.documentFiles as Record<string, string>) 
    : {};

  // 3. Add the new document to the JSON object
  currentDocs[docName] = fileUrl;

  // 4. Save it back to the database
  await prisma.lead.update({
    where: { id: leadId },
    data: { 
      documentFiles: currentDocs,
      activities: {
        create: {
          userId: session.user.id,
          action: "Document Uploaded",
          details: `Uploaded new file: ${docName}`,
        }
      }
    }
  });

  revalidatePath(`/hr/${leadId}`);
}

export async function saveMultipleDocuments(leadId: string, newDocs: Record<string, string>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // 1. Fetch current documents
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { documentFiles: true } });
  const currentDocs = typeof lead?.documentFiles === 'object' && lead?.documentFiles !== null 
    ? (lead.documentFiles as Record<string, string>) 
    : {};

  // 2. Merge old documents with the new ones
  const updatedDocs = { ...currentDocs, ...newDocs };
  const newDocNames = Object.keys(newDocs).join(", ");

  // 3. Save to database in one single transaction
  await prisma.lead.update({
    where: { id: leadId },
    data: { 
      documentFiles: updatedDocs,
      activities: {
        create: {
          userId: session.user.id,
          action: "Bulk Documents Uploaded",
          details: `Uploaded ${Object.keys(newDocs).length} files: ${newDocNames}`,
        }
      }
    }
  });

  revalidatePath(`/hr/${leadId}`);
}