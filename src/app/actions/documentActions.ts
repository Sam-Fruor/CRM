// src/app/actions/documentActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// src/app/actions/documentActions.ts

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

  // 3. Save to database
  await prisma.lead.update({
    where: { id: leadId },
    data: { 
      documentFiles: updatedDocs,
      activities: {
        create: {
          userId: session.user.id,
          action: "Documents Uploaded",
          details: `Uploaded ${Object.keys(newDocs).length} files: ${newDocNames}`,
        }
      }
    }
  });

  // 👇 THE CACHE FIX: Force Next.js to refresh the Vault for ALL departments instantly!
  revalidatePath(`/sales/${leadId}`);
  revalidatePath(`/sales/${leadId}/edit`);
  revalidatePath(`/hr/${leadId}`);
  revalidatePath(`/operations/${leadId}`);
}