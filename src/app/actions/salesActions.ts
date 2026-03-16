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

  // 🧠 Smart Feedback Dropdown
  let finalFeedbackStatus = formData.get("feedbackStatus") as string | undefined;
  if (finalFeedbackStatus === "Others") {
    finalFeedbackStatus = formData.get("feedbackStatusOther") as string || "Others";
  }
  if (!finalFeedbackStatus) finalFeedbackStatus = undefined;

  // 🕒 SMART SLOT BOOKING (Auto-picks "Today" if a new Test Date is set)
  const existingLead = await prisma.lead.findUnique({ 
    where: { id: leadId }, 
    select: { testDate: true, slotBookingDate: true } 
  });
  
  const newTestDate = parseDateSafe(formData.get("testDate"));
  let newSlotBookingDate = existingLead?.slotBookingDate;
  
  if (newTestDate && existingLead?.testDate?.getTime() !== newTestDate.getTime()) {
    newSlotBookingDate = new Date(); // They changed the test date, mark booking as today!
  }

  // ♾️ Parse dynamic Other Payments
  const otherPaymentsJson = formData.get("otherPayments") as string;
  const otherPaymentsData = otherPaymentsJson ? JSON.parse(otherPaymentsJson) : [];

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      feedbackStatus: finalFeedbackStatus,
      
      // Auto-Scheduled Dates
      slotBookingDate: newSlotBookingDate,
      testDate: newTestDate,
      
      // Initial Test Fees
      testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
      invoiceNumber: formData.get("invoiceNumber") as string || undefined,
      paymentDate: parseDateSafe(formData.get("paymentDate")),

      // Re-Test Fees
      reTestDate: parseDateSafe(formData.get("reTestDate")),
      reTestFeesAmount: parseFloatSafe(formData.get("reTestFeesAmount")),
      reTestInvoiceNumber: formData.get("reTestInvoiceNumber") as string || undefined,
      reTestPaymentDate: parseDateSafe(formData.get("reTestPaymentDate")),

      // Service Agreement Fees
      serviceAgreementAmount: parseFloatSafe(formData.get("serviceAgreementAmount")),
      serviceAgreementInvoice: formData.get("serviceAgreementInvoice") as string || undefined,
      serviceAgreementPaymentDate: parseDateSafe(formData.get("serviceAgreementPaymentDate")),

      // Dynamic Ledger
      otherPayments: otherPaymentsData,

      // Remarks & Follow-ups
      lastCallDate: parseDateSafe(formData.get("lastCallDate")),
      followUpDate: parseDateSafe(formData.get("followUpDate")),
      followUpRemarks: formData.get("followUpRemarks") as string || undefined,
      salesRemarks: formData.get("salesRemarks") as string || undefined,
      
      activities: {
        create: {
          userId: session.user.id,
          action: "Sales Ledger Updated",
          details: "Updated test schedules, financial ledgers, and feedback status.",
        }
      }
    }
  });

  revalidatePath(`/sales/${leadId}`);
}