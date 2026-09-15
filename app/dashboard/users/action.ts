"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createUserSchema, updateUserSchema } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
} | null;

export async function getUsers() {
  return await db.query.users.findMany({
    columns: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export async function createUserAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = createUserSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { username, password, role } = validated.data;

  // Cek duplikasi username
  const existingUser = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (existingUser) {
    return {
      success: false,
      message: "Username sudah digunakan!",
    };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    username,
    password: hashedPassword,
    role,
  });

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil ditambahkan!" };
}

export async function updateUserAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = updateUserSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { id, username, password, role } = validated.data;

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!targetUser) {
    return { success: false, message: "User tidak ditemukan!" };
  }

  // Proteksi: Owner tidak boleh diubah rolenya
  let updatedRole = role;
  if (targetUser.role === "owner") {
    updatedRole = "owner";
  }

  const updateData: { username: string; role: any; password?: string } = {
    username,
    role: updatedRole,
  };

  if (password && password.trim() !== "") {
    updateData.password = await bcrypt.hash(password, 10);
  }

  await db.update(users).set(updateData).where(eq(users.id, id));

  revalidatePath("/dashboard/users");
  return { success: true, message: "Data user berhasil diperbarui!" };
}

export async function deleteUserAction(id: string): Promise<ActionState> {
  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, id),
  });

  if (!targetUser) {
    return { success: false, message: "User tidak ditemukan!" };
  }

  // Proteksi: Owner TIDAK BISA dihapus
  if (targetUser.role === "owner") {
    return { success: false, message: "User Owner tidak dapat dihapus!" };
  }

  await db.delete(users).where(eq(users.id, id));

  revalidatePath("/dashboard/users");
  return { success: true, message: "User berhasil dihapus!" };
}
