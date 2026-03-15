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

  // 1. Fetch the existing lead to check their old test date and status
  const existingLead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: { testDate: true, examinerStatus: true }
  });

  const newTestDate = parseDate(formData.get("testDate"));
  const oldTestDateTimestamp = existingLead?.testDate?.getTime();
  const newTestDateTimestamp = newTestDate?.getTime();

  // 2. THE RETAKE SENSOR: 
  // If they were Denied, and Sales picked a NEW test date, reset them to Pending!
  let newExaminerStatus = undefined; // Undefined means Prisma won't touch the column
  let activityMessage = "Stage 1 information or documents were updated.";

  if (
    existingLead?.examinerStatus === "Rejected" && 
    newTestDateTimestamp && 
    newTestDateTimestamp !== oldTestDateTimestamp
  ) {
    newExaminerStatus = "Pending";
    activityMessage = "Exam Retake Scheduled: New test date selected. Sent back to Examiner Queue.";
  }

  // 3. Update the database
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
      
      // Save the new test date, and apply the reset if triggered
      testDate: newTestDate,
      examinerStatus: newExaminerStatus,
      
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
          action: newExaminerStatus ? "Retake Scheduled" : "Lead Updated",
          details: activityMessage,
        }
      }
    }
  });

  revalidatePath("/sales");
  revalidatePath("/examiner"); // Ensure the Examiner queue refreshes too!
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

  // 1. Move the Lead to Stage 2
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

  // 2. 🔔 NOTIFY ALL HR USERS 🔔
  // Find all users with the role of HR or ADMIN
  const hrUsers = await prisma.user.findMany({
    where: {
      role: { in: ["HR", "ADMIN"] }
    }
  });

  // Create a notification for each HR user
  if (hrUsers.length > 0) {
    const notifications = hrUsers.map((hr) => ({
      userId: hr.id,
      title: "📥 New File Transferred!",
      message: `${updatedLead.givenName} ${updatedLead.surname} has been transferred by Sales and is ready for Agreement processing.`,
      link: `/hr/${updatedLead.id}`
    }));

    await prisma.notification.createMany({
      data: notifications
    });
  }

  revalidatePath("/sales");
  revalidatePath(`/sales/${leadId}`);
}

// Add this to the bottom of src/app/actions/leadActions.ts

export async function checkDuplicateLead(phone: string, passport: string) {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Unauthorized" };

  if (!phone && !passport) return { duplicate: false };

  // Scan the ENTIRE database (ignoring what branch the user is in)
  const duplicate = await prisma.lead.findFirst({
    where: {
      OR: [
        ...(phone ? [{ callingNumber: phone }] : []),
        ...(passport ? [{ passportNum: passport }] : [])
      ]
    },
    select: { id: true, branch: true } // Only grab ID and Branch for speed
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
  const examinerStatus = formData.get("examinerStatus") as string; // "Approved" or "Denied"
  const examinerRemarks = formData.get("examinerRemarks") as string;

  // 1. Create the permanent detailed test record
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

  // 2. Update the main Lead profile routing
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      examinerStatus,
      englishScore,
      englishTestResult,
      drivingScore,
      yardTestResult,
      examinerRemarks,
      // Push back to Sales if they fail
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

  // 4. NEW: Send Notification to the Sales Rep!
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

// Add this to the bottom of src/app/actions/leadActions.ts

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

  // 1. Find the Examiner's MOST RECENT test log for this client
  const latestEvaluation = await prisma.testEvaluation.findFirst({
    where: { leadId: leadId },
    orderBy: { createdAt: "desc" }
  });

  // 2. Silently update that specific history log (No new row created!)
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

  // 3. Silently update the main Lead profile
  await prisma.lead.update({
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

  // NO ActivityLog created. NO Notification sent. Completely silent correction.
}

