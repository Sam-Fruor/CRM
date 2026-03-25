// src/app/actions/salesActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updateSalesProcessing(leadId: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const parseFloatSafe = (val: FormDataEntryValue | null) => val ? parseFloat(val.toString()) : null;
  const parseDateSafe = (val: FormDataEntryValue | null) => val ? new Date(val.toString()) : null;
  
  const formatForTimeline = (dateObj: Date) => {
    return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  let finalFeedbackStatus = formData.get("feedbackStatus") as string | undefined;
  if (finalFeedbackStatus === "Others") {
    finalFeedbackStatus = formData.get("feedbackStatusOther") as string || "Others";
  }
  if (!finalFeedbackStatus) finalFeedbackStatus = undefined;

  // 🔎 1. Fetch Existing Data to compare date changes AND verification status
  const existingLead = await prisma.lead.findUnique({ 
    where: { id: leadId }, 
    select: { 
      givenName: true, surname: true, testDate: true, reTestDate: true, otherPayments: true, 
      slotBookingDate: true, documentFiles: true, documentStatus: true, 
      testFeeVerifyStatus: true, reTestFeeVerifyStatus: true 
    } 
  });
  
  const newTestDate = parseDateSafe(formData.get("testDate"));
  const newReTestDate = parseDateSafe(formData.get("reTestDate"));

  let newSlotBookingDate = existingLead?.slotBookingDate;
  if (newTestDate && existingLead?.testDate?.getTime() !== newTestDate.getTime()) {
    newSlotBookingDate = new Date(); 
  }

  const otherPaymentsJson = formData.get("otherPayments") as string;
  const otherPaymentsData = otherPaymentsJson ? JSON.parse(otherPaymentsJson) : [];

  // ==========================================
  // 🔔 SMART DATE TRACKING & NOTIFICATIONS (ONLY IF ALREADY APPROVED)
  // ==========================================
  const examiners = await prisma.user.findMany({ where: { role: 'EXAMINER' }, select: { id: true } });
  
  const now = new Date();
  
  // Base save action goes in FIRST (oldest timestamp)
  const newTimelineActivities: any[] = [{
    userId: session.user.id,
    action: "Sales Updates Saved",
    details: "Updated profile details, financial ledgers, follow-ups, and synced documents.",
    createdAt: now
  }];
  
  const newNotifications: any[] = [];

  // 📅 A. Check Initial Test Date Changes (Only log if HR has approved!)
  if (existingLead?.testFeeVerifyStatus === 'Approved' && newTestDate && (!existingLead?.testDate || existingLead.testDate.getTime() !== newTestDate.getTime())) {
    const actionLabel = "Initial Test Rescheduled";
    const detailText = `Sales rescheduled the Initial Test for ${formatForTimeline(newTestDate)}`;
    
    // Offset by +1 second to place it on top of the Save action
    newTimelineActivities.push({ userId: session.user.id, action: actionLabel, details: detailText, createdAt: new Date(now.getTime() + 1000) });
    examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: actionLabel, message: `${existingLead?.givenName} ${existingLead?.surname} is rescheduled for ${formatForTimeline(newTestDate)}`, link: `/examiner/${leadId}` }));
  }

  // 📅 B. Check Re-Test Date Changes (Only log if HR has approved!)
  if (existingLead?.reTestFeeVerifyStatus === 'Approved' && newReTestDate && (!existingLead?.reTestDate || existingLead.reTestDate.getTime() !== newReTestDate.getTime())) {
    const actionLabel = "Re-Test Rescheduled";
    const detailText = `Sales rescheduled the Re-Test for ${formatForTimeline(newReTestDate)}`;
    
    newTimelineActivities.push({ userId: session.user.id, action: actionLabel, details: detailText, createdAt: new Date(now.getTime() + 2000) });
    examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: actionLabel, message: `${existingLead?.givenName} ${existingLead?.surname} re-test is rescheduled for ${formatForTimeline(newReTestDate)}`, link: `/examiner/${leadId}` }));
  }

  // 📅 C. Check Dynamic Test Date Changes (Only log if HR has approved!)
  const existingDynamicPayments = Array.isArray(existingLead?.otherPayments) ? existingLead.otherPayments : JSON.parse((existingLead?.otherPayments as any) || "[]");
  
  otherPaymentsData.forEach((p: any, index: number) => {
    const existingP = existingDynamicPayments.find((ep: any) => ep.id === p.id);
    if (p.status === 'Approved' && p.testDate && (!existingP || existingP.testDate !== p.testDate)) {
      const parsedDynamicDate = new Date(p.testDate);
      const actionLabel = `${p.name} Rescheduled`;
      const detailText = `Sales rescheduled ${p.name} for ${formatForTimeline(parsedDynamicDate)}`;

      newTimelineActivities.push({ userId: session.user.id, action: actionLabel, details: detailText, createdAt: new Date(now.getTime() + 3000 + index) });
      examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: actionLabel, message: `${existingLead?.givenName} ${existingLead?.surname} ${p.name} is rescheduled for ${formatForTimeline(parsedDynamicDate)}`, link: `/examiner/${leadId}` }));
    }
  });

  // ==========================================
  // 📂 FILE UPLOAD & DOCUMENT VAULT SYNC
  // ==========================================
  const currentFiles = (existingLead?.documentFiles as Record<string, any>) || {};
  const currentStatus = (existingLead?.documentStatus as Record<string, any>) || {};

  const processVaultFile = async (file: File | null, category: string, docType: string, statusKey?: string) => {
    if (file && file.size > 0) {
      const fileUrl = `/uploads/${file.name}`; // Temporary mock URL
      const newFileEntry = {
        name: file.name,
        url: fileUrl,
        category: category, 
        documentType: docType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: session.user.name || "Sales Rep"
      };
      currentFiles[`file_${Date.now()}_${Math.floor(Math.random() * 1000)}`] = newFileEntry;
      if (statusKey) currentStatus[statusKey] = true;
    }
  };

  await processVaultFile(formData.get("initialTestReceipt") as File | null, "Financial", "Initial Test Receipt");
  await processVaultFile(formData.get("reTestReceipt") as File | null, "Financial", "Re-Test Receipt");
  await processVaultFile(formData.get("saReceipt") as File | null, "Financial", "Service Agreement Receipt");
  
  for (const payment of otherPaymentsData) {
    const receiptFile = formData.get(`otherReceipt_${payment.id}`) as File | null;
    await processVaultFile(receiptFile, "Financial", `Misc Receipt - ${payment.name}`);
  }

  await processVaultFile(formData.get("doc_cv") as File | null, "Client", "CV / Resume", "resumeUploaded");
  await processVaultFile(formData.get("doc_passport") as File | null, "Client", "Passport", "passportUploaded");
  await processVaultFile(formData.get("doc_dl") as File | null, "Client", "Driving License", "dlUploaded");
  await processVaultFile(formData.get("doc_eid") as File | null, "Client", "Emirates ID", "residentIdUploaded");

  // ==========================================
  // 💾 DATABASE UPDATE
  // ==========================================
  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        feedbackStatus: finalFeedbackStatus,
        slotBookingDate: newSlotBookingDate,
        testDate: newTestDate,

        leadSource: formData.get("leadSource") as string || undefined,
        category: formData.get("category") as string || undefined,
        countryPreferred: formData.get("countryPreferred") as string || undefined,
        givenName: formData.get("givenName") as string || undefined,
        fatherName: formData.get("fatherName") as string || undefined,
        dob: parseDateSafe(formData.get("dob")),
        callingNumber: formData.get("callingNumber") as string || undefined,
        whatsappNumber: formData.get("whatsappNumber") as string || undefined,
        email: formData.get("email") as string || undefined,
        nationality: formData.get("nationality") as string || undefined,
        experienceHome: formData.get("experienceHome") ? parseInt(formData.get("experienceHome") as string) : null,
        experienceGCC: formData.get("experienceGCC") ? parseInt(formData.get("experienceGCC") as string) : null,
        previousAgency: formData.get("previousAgency") as string || undefined,
        previousCountry: formData.get("previousCountry") as string || undefined,

        passportIssueDate: parseDateSafe(formData.get("passportIssueDate")),
        passportExpiry: parseDateSafe(formData.get("passportExpiry")),
        passportNum: formData.get("passportNum") as string || undefined,
        dlIssueDate: parseDateSafe(formData.get("dlIssueDate")),
        dlExpiry: parseDateSafe(formData.get("dlExpiry")),
        dlNumber: formData.get("dlNumber") as string || undefined,
        residentIdIssueDate: parseDateSafe(formData.get("residentIdIssueDate")),
        residentIdExp: parseDateSafe(formData.get("residentIdExp")),
        residentIdNum: formData.get("residentIdNum") as string || undefined,
        
        testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
        invoiceNumber: formData.get("invoiceNumber") as string || undefined,
        paymentDate: parseDateSafe(formData.get("paymentDate")),
        testFeeRemarks: formData.get("testFeeRemarks") as string || undefined,

        reTestDate: newReTestDate,
        reTestFeesAmount: parseFloatSafe(formData.get("reTestFeesAmount")),
        reTestInvoiceNumber: formData.get("reTestInvoiceNumber") as string || undefined,
        reTestPaymentDate: parseDateSafe(formData.get("reTestPaymentDate")),
        reTestFeeRemarks: formData.get("reTestFeeRemarks") as string || undefined,

        serviceAgreementAmount: parseFloatSafe(formData.get("serviceAgreementAmount")),
        serviceAgreementTotal: parseFloatSafe(formData.get("serviceAgreementTotal")),
        serviceAgreementInvoice: formData.get("serviceAgreementInvoice") as string || undefined,
        serviceAgreementPaymentDate: parseDateSafe(formData.get("serviceAgreementPaymentDate")),
        saFeeRemarks: formData.get("saFeeRemarks") as string || undefined,

        otherPayments: otherPaymentsData,
        documentFiles: currentFiles,
        documentStatus: currentStatus,

        lastCallDate: parseDateSafe(formData.get("lastCallDate")),
        followUpDate: parseDateSafe(formData.get("followUpDate")),
        followUpRemarks: formData.get("followUpRemarks") as string || undefined,
        salesRemarks: formData.get("salesRemarks") as string || undefined,

        documentsLastCallDate: parseDateSafe(formData.get("documentsLastCallDate")),
        documentsFollowUpDate: parseDateSafe(formData.get("documentsFollowUpDate")),
        documentsFollowUpRemarks: formData.get("documentsFollowUpRemarks") as string || undefined,
        documentsSalesRemarks: formData.get("documentsSalesRemarks") as string || undefined,

        testingLastCallDate: parseDateSafe(formData.get("testingLastCallDate")),
        testingFollowUpDate: parseDateSafe(formData.get("testingFollowUpDate")),
        testingFollowUpRemarks: formData.get("testingFollowUpRemarks") as string || undefined,
        testingSalesRemarks: formData.get("testingSalesRemarks") as string || undefined,

        saLastCallDate: parseDateSafe(formData.get("saLastCallDate")),
        saFollowUpDate: parseDateSafe(formData.get("saFollowUpDate")),
        saFollowUpRemarks: formData.get("saFollowUpRemarks") as string || undefined,
        saSalesRemarks: formData.get("saSalesRemarks") as string || undefined,
        
        activities: {
          create: newTimelineActivities
        }
      }
    }),
    ...(newNotifications.length > 0 ? [prisma.notification.createMany({ data: newNotifications })] : [])
  ]);

  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/examiner/${leadId}`);
}