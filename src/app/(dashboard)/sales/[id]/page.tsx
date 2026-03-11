// src/app/(dashboard)/sales/[id]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import ViewLead from "./ViewLead"; 

export default async function ViewLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  // Fetch the lead and the activity timeline
  const lead = await prisma.lead.findUnique({
    where: { id: id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }
    }
  });

  if (!lead) {
    notFound();
  }

  // Sanitize dates for the client component
  const safeLead = JSON.parse(JSON.stringify(lead));

  // ALWAYS return the read-only view page
  return <ViewLead lead={safeLead} />;
}