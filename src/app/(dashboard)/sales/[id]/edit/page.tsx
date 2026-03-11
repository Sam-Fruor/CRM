// src/app/(dashboard)/sales/[id]/edit/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EditLeadForm from "./EditLeadForm"; 

export default async function EditRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id: id },
    include: {
      activities: {
        orderBy: { createdAt: "desc" },
        include: { user: true },
      }
    }
  });

  if (!lead) notFound();
  
  const safeLead = JSON.parse(JSON.stringify(lead));

  return <EditLeadForm lead={safeLead} />;
}