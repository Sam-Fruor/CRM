// src/app/actions/paymentActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type PaymentType = 'TEST' | 'RETEST' | 'SA' | string; // 👈 string added for custom IDs

export async function requestPaymentVerification(leadId: string, paymentType: PaymentType) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const updateData: any = {};
  let actionText = "a custom payment";

  if (paymentType === 'TEST') {
    updateData.testFeeVerifyStatus = "Pending";
    updateData.testFeeRejectReason = null; 
    actionText = "Initial Test Fee";
  } else if (paymentType === 'RETEST') {
    updateData.reTestFeeVerifyStatus = "Pending";
    updateData.reTestFeeRejectReason = null;
    actionText = "Re-Test Fee";
  } else if (paymentType === 'SA') {
    updateData.saFeeVerifyStatus = "Pending";
    updateData.saFeeRejectReason = null;
    actionText = "Service Agreement Fee";
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...updateData,
      activities: {
        create: {
          userId: session.user.id,
          action: "Payment Verification Requested",
          details: `Sales requested HR to verify ${actionText}.`,
        }
      }
    }
  });

  revalidatePath(`/sales/${leadId}`);
  revalidatePath("/hr/payments");
}

export async function resolvePaymentVerification(
  leadId: string, 
  paymentType: PaymentType, 
  status: 'Approved' | 'Rejected',
  invoiceNo?: string,
  rejectReason?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const updateData: any = {};
  let detailsText = `HR/Management ${status.toLowerCase()} a payment.`;

  // STANDARD PAYMENTS
  if (['TEST', 'RETEST', 'SA'].includes(paymentType)) {
    if (paymentType === 'TEST') {
      updateData.testFeeVerifyStatus = status;
      if (status === 'Approved' && invoiceNo) updateData.invoiceNumber = invoiceNo;
      if (status === 'Rejected' && rejectReason) updateData.testFeeRejectReason = rejectReason;
      detailsText = `HR ${status} Initial Test Fee. ${rejectReason ? `Reason: ${rejectReason}` : ''}`;
    }
    if (paymentType === 'RETEST') {
      updateData.reTestFeeVerifyStatus = status;
      if (status === 'Approved' && invoiceNo) updateData.reTestInvoiceNumber = invoiceNo;
      if (status === 'Rejected' && rejectReason) updateData.reTestFeeRejectReason = rejectReason;
      detailsText = `HR ${status} Re-Test Fee. ${rejectReason ? `Reason: ${rejectReason}` : ''}`;
    }
    if (paymentType === 'SA') {
      updateData.saFeeVerifyStatus = status;
      if (status === 'Approved' && invoiceNo) updateData.serviceAgreementInvoice = invoiceNo;
      if (status === 'Rejected' && rejectReason) updateData.saFeeRejectReason = rejectReason;
      detailsText = `HR ${status} Service Agreement Fee. ${rejectReason ? `Reason: ${rejectReason}` : ''}`;
    }
  } 
  // DYNAMIC / CUSTOM PAYMENTS (Attempt 3+, Fines, Misc)
  else {
    const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse((lead.otherPayments as any) || "[]");
    
    let paymentName = "Custom Payment";
    
    updateData.otherPayments = otherPayments.map((p: any) => {
      if (p.id === paymentType) {
        paymentName = p.name || paymentName;
        return { 
          ...p, 
          status, 
          invoice: status === 'Approved' ? (invoiceNo || p.invoice) : p.invoice, 
          rejectReason: status === 'Rejected' ? rejectReason : "" 
        };
      }
      return p;
    });

    detailsText = `HR ${status} ${paymentName}. ${rejectReason ? `Reason: ${rejectReason}` : ''}`;
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      ...updateData,
      activities: {
        create: {
          userId: session.user.id,
          action: `Payment ${status}`,
          details: detailsText,
        }
      }
    }
  });

  revalidatePath("/hr/payments");
  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/hr/${leadId}`);
}