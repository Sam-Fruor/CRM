// src/app/sales/calendar-events/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const branchCondition = session.user.role === "ADMIN" ? {} : { branch: session.user.branch as any };

  const leads = await prisma.lead.findMany({
    where: branchCondition,
    select: {
      id: true,
      givenName: true,
      surname: true,
      followUpDate: true,
      slotBookingDate: true,
      testDate: true,
    }
  });

  const events: any[] = [];

  leads.forEach(lead => {
    const fullName = `${lead.givenName} ${lead.surname}`;

    // 1. Add Follow-up Event (Indigo)
    if (lead.followUpDate) {
      events.push({
        id: `follow-${lead.id}`,
        title: `Call: ${fullName}`,
        start: lead.followUpDate,
        backgroundColor: '#6366f1', // tailwind indigo-500
        borderColor: '#4f46e5',     // tailwind indigo-600
        textColor: '#ffffff',
        url: `/sales/${lead.id}`
      });
    }

    // 2. Add Slot Booking Event (Emerald)
    if (lead.slotBookingDate) {
      events.push({
        id: `slot-${lead.id}`,
        title: `Slot: ${fullName}`,
        start: lead.slotBookingDate,
        backgroundColor: '#10b981', // tailwind emerald-500
        borderColor: '#059669',     // tailwind emerald-600
        textColor: '#ffffff',
        url: `/sales/${lead.id}`
      });
    }

    // 3. Add Test Date Event (Amber)
    if (lead.testDate) {
      events.push({
        id: `test-${lead.id}`,
        title: `Test: ${fullName}`,
        start: lead.testDate,
        backgroundColor: '#f59e0b', // tailwind amber-500
        borderColor: '#d97706',     // tailwind amber-600
        textColor: '#ffffff',
        url: `/sales/${lead.id}`
      });
    }
  });

  return NextResponse.json(events);
}