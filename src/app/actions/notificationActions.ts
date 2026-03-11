// src/app/actions/notificationActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getMyNotifications() {
  const session = await getServerSession(authOptions);
  if (!session) return [];
  
  return await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10 // Only grab the 10 most recent alerts
  });
}

export async function markNotificationAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { isRead: true }
  });
}

// 👇 NEW: Delete a single notification
export async function clearNotification(id: string) {
  await prisma.notification.delete({
    where: { id }
  });
}

// 👇 NEW: Delete all notifications for the current user
export async function clearAllNotifications() {
  const session = await getServerSession(authOptions);
  if (!session) return;

  await prisma.notification.deleteMany({
    where: { userId: session.user.id }
  });
}