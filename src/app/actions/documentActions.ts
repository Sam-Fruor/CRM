// src/app/actions/documentActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveMultipleDocuments(leadId: string, newDocs: Record<string, string>) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  // 1. Fetch current documents
  const lead = await prisma.lead.findUnique({ 
    where: { id: leadId }, 
    select: { documentFiles: true } 
  });
  
  const currentDocs = typeof lead?.documentFiles === 'object' && lead?.documentFiles !== null 
    ? (lead.documentFiles as Record<string, any>) 
    : {};

  // 2. Enrich new documents with metadata
  const enrichedNewDocs: Record<string, any> = {};
  const uploaderName = `${session.user.name || "Unknown"} (${session.user.role})`;
  const now = new Date().toISOString();

  for (const [docName, url] of Object.entries(newDocs)) {
    enrichedNewDocs[docName] = { url, uploadedBy: uploaderName, uploadedAt: now };
  }

  // 3. Merge old documents with the new ones
  const updatedDocs = { ...currentDocs, ...enrichedNewDocs };
  const newDocNames = Object.keys(newDocs).join(", ");

  // 🤖 SMART AUTO-SYNC ENGINE: Scan the vault and update the Checklist Automatically!
  const allFileNames = Object.keys(updatedDocs).map(k => k.toLowerCase());
  const autoDocumentStatus = {
    resumeUploaded: allFileNames.some(k => k.includes("cv") || k.includes("resume")),
    dlUploaded: allFileNames.some(k => k.includes("driving license") || k.includes("dl")),
    residentIdUploaded: allFileNames.some(k => k.includes("emirates id") || k.includes("resident id")),
    passportUploaded: allFileNames.some(k => k.includes("passport")),
    videoUploaded: allFileNames.some(k => k.includes("video") || k.includes("yard")),
    otherUploaded: allFileNames.some(k => k.includes("other")),
  };

  // 4. Save everything to the database
  await prisma.lead.update({
    where: { id: leadId },
    data: { 
      documentFiles: updatedDocs,
      documentStatus: autoDocumentStatus, // 👈 The database is now automatically checked!
      activities: {
        create: {
          userId: session.user.id,
          action: "Documents Uploaded",
          details: `Uploaded ${Object.keys(newDocs).length} files: ${newDocNames}`,
        }
      }
    }
  });

  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/sales/${leadId}/edit`);
  revalidatePath(`/hr/${leadId}`);
  revalidatePath(`/operations/${leadId}`);
}