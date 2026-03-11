"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Role, Branch } from "@prisma/client";

export async function createUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  // Security check: Only Admins can create new staff accounts
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as Role;
  const branch = formData.get("branch") as Branch;

  // Hash the password so it's not readable in the database
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      branch,
    }
  });

  revalidatePath("/admin/users");
}

export async function deleteUser(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") throw new Error("Unauthorized");

  const userId = formData.get("userId") as string;

  // Prevent the admin from accidentally deleting themselves!
  if (userId === session.user.id) {
    throw new Error("You cannot delete your own account.");
  }

  await prisma.user.delete({
    where: { id: userId }
  });

  revalidatePath("/admin/users");
}