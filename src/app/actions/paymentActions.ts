// src/app/actions/paymentActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type PaymentType = 
  | 'TEST' 
  | 'RETEST' 
  | 'SA' 
  | 'JOB_OFFER' 
  | 'WORK_PERMIT' 
  | 'INSURANCE' 
  | 'SCHOOL_FEES' 
  | 'FLIGHT_TICKET' 
  | 'OTHER_OPS' 
  | string;

export async function requestPaymentVerification(leadId: string, paymentType: PaymentType) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) throw new Error("Lead not found");

  const updateData: any = {};
  let actionText = "a custom payment";

  switch (paymentType) {
    case 'TEST': updateData.testFeeVerifyStatus = "Pending"; updateData.testFeeRejectReason = null; actionText = "Initial Test Fee"; break;
    case 'RETEST': updateData.reTestFeeVerifyStatus = "Pending"; updateData.reTestFeeRejectReason = null; actionText = "Re-Test Fee"; break;
    case 'SA': updateData.saFeeVerifyStatus = "Pending"; updateData.saFeeRejectReason = null; actionText = "Service Agreement Fee"; break;
    case 'JOB_OFFER': updateData.jobOfferVerifyStatus = "Pending"; updateData.jobOfferRejectReason = null; actionText = "Job Offer Fee"; break;
    case 'WORK_PERMIT': updateData.workPermitVerifyStatus = "Pending"; updateData.workPermitRejectReason = null; actionText = "Work Permit Fee"; break;
    case 'INSURANCE': updateData.insuranceVerifyStatus = "Pending"; updateData.insuranceRejectReason = null; actionText = "Insurance Fee"; break;
    case 'SCHOOL_FEES': updateData.schoolFeesVerifyStatus = "Pending"; updateData.schoolFeesRejectReason = null; actionText = "School Fees"; break;
    case 'FLIGHT_TICKET': updateData.flightTicketVerifyStatus = "Pending"; updateData.flightTicketRejectReason = null; actionText = "Flight Ticket"; break;
    case 'OTHER_OPS': updateData.otherPendingVerifyStatus = "Pending"; updateData.otherPendingRejectReason = null; actionText = "Misc Operations Fee"; break;
    default:
      const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse((lead.otherPayments as any) || "[]");
      updateData.otherPayments = otherPayments.map((p: any) => {
        if (p.id === paymentType) {
          actionText = p.name || "Custom Payment";
          return { ...p, status: "Pending", rejectReason: "" };
        }
        return p;
      });
      break;
  }

  const hrUsers = await prisma.user.findMany({ where: { role: 'HR' }, select: { id: true } });
  const notificationsData = hrUsers.map(hr => ({
    userId: hr.id,
    title: "Payment Verification Required",
    message: `${session.user.name || "Sales/Ops"} requested verification for ${lead.givenName}'s ${actionText}.`,
    link: `/hr/payments?tab=pending_sales`
  }));

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        ...updateData,
        activities: {
          create: {
            userId: session.user.id,
            action: "Payment Verification Requested",
            details: `${session.user.role === 'OPERATIONS' ? 'Operations' : 'Sales'} requested HR to verify ${actionText}.`,
          }
        }
      }
    }),
    ...(notificationsData.length > 0 ? [prisma.notification.createMany({ data: notificationsData })] : [])
  ]);

  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/operations/${leadId}`);
  revalidatePath(`/hr/${leadId}`);
  revalidatePath("/hr/payments");
}

export async function resolvePaymentVerification(
  leadId: string, 
  paymentType: PaymentType, 
  status: 'Approved' | 'Rejected',
  invoiceNo?: string,
  remark?: string
) {
  const session = await getServerSession(authOptions);
  if (!session || !["HR", "MANAGEMENT", "ADMIN"].includes(session.user.role)) {
    throw new Error("Unauthorized");
  }

  const lead = await prisma.lead.findUnique({ 
    where: { id: leadId },
    select: { givenName: true, surname: true, testDate: true, reTestDate: true, otherPayments: true }
  });
  if (!lead) throw new Error("Lead not found");

  const updateData: any = {};
  
  let detailsText = `HR ${status} a payment.`;
  const remarkText = remark ? (status === 'Approved' ? ` Remark: ${remark}` : ` Reason: ${remark}`) : '';

  const formatForTimeline = (dateObj: Date) => dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const scheduleActivities: any[] = [];
  const newNotifications: any[] = [];
  const examiners = await prisma.user.findMany({ where: { role: 'EXAMINER' }, select: { id: true } });

  const standardTypes = ['TEST', 'RETEST', 'SA', 'JOB_OFFER', 'WORK_PERMIT', 'INSURANCE', 'SCHOOL_FEES', 'FLIGHT_TICKET', 'OTHER_OPS'];

  if (standardTypes.includes(paymentType)) {
    if (paymentType === 'TEST') {
      updateData.testFeeVerifyStatus = status;
      if (status === 'Approved') { updateData.invoiceNumber = invoiceNo; updateData.testFeeApproveRemark = remark; }
      if (status === 'Rejected') updateData.testFeeRejectReason = remark;
      detailsText = `HR ${status} Initial Test Fee.${remarkText}`;
      
      // 🚀 TRIGGER INITIAL TEST SCHEDULED IF APPROVED
      if (status === 'Approved' && lead.testDate) {
        scheduleActivities.push({ userId: session.user.id, action: "Initial Test Scheduled", details: `Initial Test is scheduled for ${formatForTimeline(lead.testDate)}` });
        examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: "Initial Test Scheduled", message: `${lead.givenName} ${lead.surname} is scheduled for ${formatForTimeline(lead.testDate!)}`, link: `/examiner/${leadId}` }));
      }
    } else if (paymentType === 'RETEST') {
      updateData.reTestFeeVerifyStatus = status;
      if (status === 'Approved') { updateData.reTestInvoiceNumber = invoiceNo; updateData.reTestFeeApproveRemark = remark; }
      if (status === 'Rejected') updateData.reTestFeeRejectReason = remark;
      detailsText = `HR ${status} Re-Test Fee.${remarkText}`;

      // 🚀 TRIGGER RE-TEST SCHEDULED IF APPROVED
      if (status === 'Approved' && lead.reTestDate) {
        scheduleActivities.push({ userId: session.user.id, action: "Re-Test Scheduled", details: `Re-Test is scheduled for ${formatForTimeline(lead.reTestDate)}` });
        examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: "Re-Test Scheduled", message: `${lead.givenName} ${lead.surname} re-test is scheduled for ${formatForTimeline(lead.reTestDate!)}`, link: `/examiner/${leadId}` }));
      }
    } else if (paymentType === 'SA') {
      updateData.saFeeVerifyStatus = status;
      if (status === 'Approved') { updateData.serviceAgreementInvoice = invoiceNo; updateData.saFeeApproveRemark = remark; }
      if (status === 'Rejected') updateData.saFeeRejectReason = remark;
      detailsText = `HR ${status} Service Agreement Fee.${remarkText}`;
    } else if (paymentType === 'JOB_OFFER') {
      updateData.jobOfferVerifyStatus = status;
      if (status === 'Approved') { updateData.jobOfferInvoice = invoiceNo; updateData.jobOfferApproveRemark = remark; }
      if (status === 'Rejected') updateData.jobOfferRejectReason = remark;
      detailsText = `HR ${status} Job Offer Fee.${remarkText}`;
    } else if (paymentType === 'WORK_PERMIT') {
      updateData.workPermitVerifyStatus = status;
      if (status === 'Approved') { updateData.workPermitInvoice = invoiceNo; updateData.workPermitApproveRemark = remark; }
      if (status === 'Rejected') updateData.workPermitRejectReason = remark;
      detailsText = `HR ${status} Work Permit Fee.${remarkText}`;
    } else if (paymentType === 'INSURANCE') {
      updateData.insuranceVerifyStatus = status;
      if (status === 'Approved') { updateData.insuranceInvoice = invoiceNo; updateData.insuranceApproveRemark = remark; }
      if (status === 'Rejected') updateData.insuranceRejectReason = remark;
      detailsText = `HR ${status} Insurance Fee.${remarkText}`;
    } else if (paymentType === 'SCHOOL_FEES') {
      updateData.schoolFeesVerifyStatus = status;
      if (status === 'Approved') { updateData.schoolFeesInvoice = invoiceNo; updateData.schoolFeesApproveRemark = remark; }
      if (status === 'Rejected') updateData.schoolFeesRejectReason = remark;
      detailsText = `HR ${status} School Fees.${remarkText}`;
    } else if (paymentType === 'FLIGHT_TICKET') {
      updateData.flightTicketVerifyStatus = status;
      if (status === 'Approved') { updateData.flightTicketInvoice = invoiceNo; updateData.flightTicketApproveRemark = remark; }
      if (status === 'Rejected') updateData.flightTicketRejectReason = remark;
      detailsText = `HR ${status} Flight Ticket Fee.${remarkText}`;
    } else if (paymentType === 'OTHER_OPS') {
      updateData.otherPendingVerifyStatus = status;
      if (status === 'Approved') { updateData.otherPendingInvoice = invoiceNo; updateData.otherPendingApproveRemark = remark; }
      if (status === 'Rejected') updateData.otherPendingRejectReason = remark;
      detailsText = `HR ${status} Misc Ops Fee.${remarkText}`;
    }
  } 
  // DYNAMIC / CUSTOM PAYMENTS
  else {
    const otherPayments = Array.isArray(lead.otherPayments) ? lead.otherPayments : JSON.parse((lead.otherPayments as any) || "[]");
    let paymentName = "Custom Payment";
    
    updateData.otherPayments = otherPayments.map((p: any) => {
      if (p.id === paymentType) {
        paymentName = p.name || paymentName;
        
        // 🚀 TRIGGER DYNAMIC EXAM SCHEDULED IF APPROVED
        if (status === 'Approved' && p.testDate) {
          const pDate = new Date(p.testDate);
          scheduleActivities.push({ userId: session.user.id, action: `${paymentName} Scheduled`, details: `${paymentName} is scheduled for ${formatForTimeline(pDate)}` });
          examiners.forEach(ex => newNotifications.push({ userId: ex.id, title: `${paymentName} Scheduled`, message: `${lead.givenName} ${lead.surname} is scheduled for ${formatForTimeline(pDate)}`, link: `/examiner/${leadId}` }));
        }

        return { 
          ...p, 
          status, 
          invoice: status === 'Approved' ? (invoiceNo || p.invoice) : p.invoice, 
          approveRemark: status === 'Approved' ? remark : (p.approveRemark || ""),
          rejectReason: status === 'Rejected' ? remark : (p.rejectReason || "")
        };
      }
      return p;
    });

    detailsText = `HR ${status} ${paymentName}.${remarkText}`;
  }

  // 🚀 TIMELINE ORDERING HACK:
  // Push the Payment Action with the exact current time.
  // Push the Schedule Action with a +1 second offset so it stacks ON TOP.
  const now = new Date();
  const newActivities: any[] = [{
    userId: session.user.id,
    action: `Payment ${status}`,
    details: detailsText,
    createdAt: now
  }];

  scheduleActivities.forEach((act, index) => {
    newActivities.push({
      ...act,
      createdAt: new Date(now.getTime() + 1000 + index) // +1 second
    });
  });

  await prisma.$transaction([
    prisma.lead.update({
      where: { id: leadId },
      data: {
        ...updateData,
        activities: { create: newActivities }
      }
    }),
    ...(newNotifications.length > 0 ? [prisma.notification.createMany({ data: newNotifications })] : [])
  ]);

  revalidatePath("/hr/payments");
  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/operations/${leadId}`);
  revalidatePath(`/hr/${leadId}`);
}