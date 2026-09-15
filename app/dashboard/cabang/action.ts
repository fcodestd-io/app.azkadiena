"use server";

import { db } from "@/db";
import { confections } from "@/db/schema";
import { createConfectionSchema, updateConfectionSchema } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
} | null;

export async function getConfections() {
  return await db.query.confections.findMany({
    orderBy: (confections, { desc }) => [desc(confections.createdAt)],
  });
}

export async function createConfectionAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = createConfectionSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, supervisorName } = validated.data;

  const existingConfection = await db.query.confections.findFirst({
    where: eq(confections.name, name),
  });

  if (existingConfection) {
    return {
      success: false,
      message: "Nama cabang konveksi sudah terdaftar!",
    };
  }

  await db.insert(confections).values({
    name,
    supervisorName,
  });

  revalidatePath("/dashboard/cabang");
  return { success: true, message: "Cabang konveksi berhasil ditambahkan!" };
}

export async function updateConfectionAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = updateConfectionSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { id, name, supervisorName } = validated.data;

  const targetConfection = await db.query.confections.findFirst({
    where: eq(confections.id, id),
  });

  if (!targetConfection) {
    return { success: false, message: "Cabang konveksi tidak ditemukan!" };
  }

  await db
    .update(confections)
    .set({
      name,
      supervisorName,
    })
    .where(eq(confections.id, id));

  revalidatePath("/dashboard/cabang");
  return {
    success: true,
    message: "Data cabang konveksi berhasil diperbarui!",
  };
}

export async function deleteConfectionAction(id: string): Promise<ActionState> {
  const targetConfection = await db.query.confections.findFirst({
    where: eq(confections.id, id),
  });

  if (!targetConfection) {
    return { success: false, message: "Cabang konveksi tidak ditemukan!" };
  }

  await db.delete(confections).where(eq(confections.id, id));

  revalidatePath("/dashboard/cabang");
  return { success: true, message: "Cabang konveksi berhasil dihapus!" };
}
