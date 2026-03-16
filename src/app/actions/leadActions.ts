// src/app/actions/leadActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createLead(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");


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

  // 🧠 SMART FEEDBACK SENSOR
  let finalFeedbackStatus = formData.get("feedbackStatus") as string | undefined;
  if (finalFeedbackStatus === "Others") {
    finalFeedbackStatus = formData.get("feedbackStatusOther") as string || "Others";
  }

  // 🕒 AUTO-SLOT BOOKING
  const tDate = parseDate(formData.get("testDate"));
  let sBookingDate = parseDate(formData.get("slotBookingDate"));
  if (tDate && !sBookingDate) {
    sBookingDate = new Date(); // Auto-book today if a test is scheduled
  }

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
      feedbackStatus: finalFeedbackStatus,
      slotBookingDate: sBookingDate,
      testDate: tDate,
      
      // Payments (Initial Creation)
      testFeesAmount: parseFloatSafe(formData.get("testFeesAmount")),
      totalPayment: parseFloatSafe(formData.get("totalPayment")),
      invoiceNumber: formData.get("invoiceNumber") as string,
      paymentDate: parseDate(formData.get("paymentDate")),
      
      serviceAgreementAmount: parseFloatSafe(formData.get("serviceAgreementAmount")),
      serviceAgreementInvoice: formData.get("serviceAgreementInvoice") as string,
      serviceAgreementPaymentDate: parseDate(formData.get("serviceAgreementPaymentDate")),
      
      // Follow-ups
      lastCallDate: parseDate(formData.get("lastCallDate")),
      followUpDate: parseDate(formData.get("followUpDate")),
      followUpRemarks: formData.get("followUpRemarks") as string,
      salesRemarks: formData.get("salesRemarks") as string,
      
      // Document Dates & JSON
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

  // 1. Fetch existing lead to check old test date and status
  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { testDate: true, examinerStatus: true }
  });

  const newTestDate = parseDate(formData.get("testDate"));
  const oldTestDateTimestamp = existingLead?.testDate?.getTime();
  const newTestDateTimestamp = newTestDate?.getTime();

  // 2. THE RETAKE SENSOR
  let newExaminerStatus = undefined; 
  let activityMessage = "Core Profile details (Sections 1-4) were updated.";

  if (
    existingLead?.examinerStatus === "Denied" && // 👈 Changed "Rejected" to "Denied"
    newTestDateTimestamp && 
    newTestDateTimestamp !== oldTestDateTimestamp
  ) {
    newExaminerStatus = "Pending";
    activityMessage = "Exam Retake Scheduled: New test date selected. Sent back to Examiner Queue.";
  }

  // 3. Update ONLY Core Profile Data (Prevents wiping financials!)
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
      
      slotBookingDate: parseDate(formData.get("slotBookingDate")),
      testDate: newTestDate,
      examinerStatus: newExaminerStatus,
      
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
          action: newExaminerStatus ? "Retake Scheduled" : "Core Profile Updated",
          details: activityMessage,
        }
      }
    }
  });

  revalidatePath("/sales");
  revalidatePath("/examiner"); 
}


export async function updateLeadPipelineStatus(leadId: string, newStatus: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

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


export async function transferToStage2(leadId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const updatedLead = await prisma.lead.update({
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

  const hrUsers = await prisma.user.findMany({
    where: { role: { in: ["HR", "ADMIN"] } }
  });

  if (hrUsers.length > 0) {
    const notifications = hrUsers.map((hr) => ({
      userId: hr.id,
      title: "📥 New File Transferred!",
      message: `${updatedLead.givenName} ${updatedLead.surname} has been transferred by Sales and is ready for Agreement processing.`,
      link: `/hr/${updatedLead.id}`
    }));

    await prisma.notification.createMany({ data: notifications });
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${leadId}`);
}


export async function checkDuplicateLead(phone: string, passport: string, excludeLeadId?: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  // Clean up any accidental spaces from typing
  const cleanPhone = phone?.trim();
  const cleanPassport = passport?.trim();

  if (!cleanPhone && !cleanPassport) return { duplicate: false };

  // 🔎 Scan the database, but IGNORE the current lead if we are editing
  const duplicate = await prisma.lead.findFirst({
    where: {
      AND: [
        {
          OR: [
            ...(cleanPhone ? [{ callingNumber: cleanPhone }] : []),
            ...(cleanPassport ? [{ passportNum: cleanPassport }] : [])
          ]
        },
        ...(excludeLeadId ? [{ NOT: { id: excludeLeadId } }] : []) // 🛡️ The Edit-Mode Shield
      ]
    },
    select: { id: true, branch: true } 
  });

  if (duplicate) {
    return {
      duplicate: true,
      branch: duplicate.branch.replace("BRANCH_", "Branch "),
      shortId: duplicate.id.slice(-6).toUpperCase()
    };
  }

  return { duplicate: false };
}


export async function submitTestEvaluation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (!["EXAMINER", "ADMIN"].includes(session.user.role))) {
    throw new Error("Unauthorized");
  }

  const leadId = formData.get("leadId") as string;
  const englishScore = parseInt(formData.get("englishScore") as string) || null;
  const englishTestResult = formData.get("englishTestResult") as string;
  const drivingScore = parseInt(formData.get("drivingScore") as string) || null;
  const yardTestResult = formData.get("yardTestResult") as string;
  const examinerStatus = formData.get("examinerStatus") as string; 
  const examinerRemarks = formData.get("examinerRemarks") as string;

  await prisma.testEvaluation.create({
    data: {
      leadId,
      englishScore,
      englishTestResult,
      drivingScore,
      yardTestResult,
      status: examinerStatus,
      remarks: examinerRemarks,
    }
  });

  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      examinerStatus,
      englishScore,
      englishTestResult,
      drivingScore,
      yardTestResult,
      examinerRemarks,
      feedbackStatus: examinerStatus === "Rejected" ? "Client is for Next Test" : undefined 
    }
  });

  await prisma.activityLog.create({
    data: {
      leadId,
      action: `Evaluation Submitted: ${examinerStatus}`,
      details: examinerRemarks ? `Remarks: ${examinerRemarks}` : null,
      userId: session.user.id,
    }
  });

  if (updatedLead.salesRepId) {
    await prisma.notification.create({
      data: {
        userId: updatedLead.salesRepId,
        title: `Test ${examinerStatus}: ${updatedLead.givenName} ${updatedLead.surname}`,
        message: `Examiner graded candidate. English: ${englishTestResult}, Driving: ${yardTestResult}.`,
        link: `/sales/${leadId}`
      }
    });
  }
}


export async function editTestEvaluation(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || (!["EXAMINER", "ADMIN"].includes(session.user.role))) {
    throw new Error("Unauthorized");
  }

  const leadId = formData.get("leadId") as string;
  const englishScore = parseInt(formData.get("englishScore") as string) || null;
  const englishTestResult = formData.get("englishTestResult") as string;
  const drivingScore = parseInt(formData.get("drivingScore") as string) || null;
  const yardTestResult = formData.get("yardTestResult") as string;
  const examinerStatus = formData.get("examinerStatus") as string; 
  const examinerRemarks = formData.get("examinerRemarks") as string;

  const latestEvaluation = await prisma.testEvaluation.findFirst({
    where: { leadId: leadId },
    orderBy: { createdAt: "desc" }
  });

  if (latestEvaluation) {
    await prisma.testEvaluation.update({
      where: { id: latestEvaluation.id },
      data: {
        englishScore,
        englishTestResult,
        drivingScore,
        yardTestResult,
        status: examinerStatus,
        remarks: examinerRemarks,
      }
    });
  }

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      examinerStatus,
      englishScore,
      englishTestResult,
      drivingScore,
      yardTestResult,
      examinerRemarks,
      // 👈 FIXED: Look for "Denied" instead of "Rejected"
      feedbackStatus: examinerStatus === "Denied" ? "Client is for Next Test" : undefined 
    }
  });
}