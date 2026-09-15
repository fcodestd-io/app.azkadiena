"use server";

import { db } from "@/db";
import { sizes, colors, productVariants } from "@/db/schema";
import { createAttributeSchema, updateAttributeSchema } from "./schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
} | null;

export async function getAttributes() {
  const [sizeList, colorList] = await Promise.all([
    db.query.sizes.findMany(),
    db.query.colors.findMany(),
  ]);

  return {
    sizes: sizeList,
    colors: colorList,
  };
}

export async function createAttributeAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = createAttributeSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, type } = validated.data;

  if (type === "size") {
    const existingSize = await db.query.sizes.findFirst({
      where: eq(sizes.name, name),
    });
    if (existingSize) {
      return { success: false, message: `Ukuran "${name}" sudah ada!` };
    }
    await db.insert(sizes).values({ name });
  } else {
    const existingColor = await db.query.colors.findFirst({
      where: eq(colors.name, name),
    });
    if (existingColor) {
      return { success: false, message: `Warna "${name}" sudah ada!` };
    }
    await db.insert(colors).values({ name });
  }

  revalidatePath("/dashboard/atribut");
  return {
    success: true,
    message: `Atribut ${type === "size" ? "Ukuran" : "Warna"} berhasil ditambahkan!`,
  };
}

export async function updateAttributeAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const data = Object.fromEntries(formData.entries());
  const validated = updateAttributeSchema.safeParse(data);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const { id, name, type } = validated.data;

  if (type === "size") {
    await db.update(sizes).set({ name }).where(eq(sizes.id, id));
  } else {
    await db.update(colors).set({ name }).where(eq(colors.id, id));
  }

  revalidatePath("/dashboard/atribut");
  return {
    success: true,
    message: `Atribut ${type === "size" ? "Ukuran" : "Warna"} berhasil diperbarui!`,
  };
}

export async function deleteAttributeAction(
  id: string,
  type: "size" | "color",
): Promise<ActionState> {
  // Cek apakah atribut sedang dipakai di varian produk
  if (type === "size") {
    const usedInVariants = await db.query.productVariants.findFirst({
      where: eq(productVariants.sizeId, id),
    });
    if (usedInVariants) {
      return {
        success: false,
        message: "Ukuran ini masih digunakan pada varian produk!",
      };
    }
    await db.delete(sizes).where(eq(sizes.id, id));
  } else {
    const usedInVariants = await db.query.productVariants.findFirst({
      where: eq(productVariants.colorId, id),
    });
    if (usedInVariants) {
      return {
        success: false,
        message: "Warna ini masih digunakan pada varian produk!",
      };
    }
    await db.delete(colors).where(eq(colors.id, id));
  }

  revalidatePath("/dashboard/atribut");
  return { success: true, message: `Atribut berhasil dihapus!` };
}
