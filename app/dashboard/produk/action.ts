"use server";

import { db } from "@/db";
import {
  products,
  productVariants,
  sizes,
  colors,
  stockMovements,
} from "@/db/schema";
import { createProductSchema } from "./schema";
import { eq, desc, like, sql, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
} | null;

function generateSku(productName: string, colorName: string, sizeName: string) {
  const clean = (str: string) => str.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `${clean(productName)}-${clean(colorName)}-${clean(sizeName)}`;
}

function generateNumericBarcode(index: number) {
  const prefix = "899";
  const uniqueNum = String(Date.now() + index).slice(-9);
  return `${prefix}${uniqueNum}`;
}

export async function getProducts(page = 1, limit = 10, search = "") {
  const offset = (page - 1) * limit;

  const productList = await db.query.products.findMany({
    where: search ? like(products.name, `%${search}%`) : undefined,
    limit,
    offset,
    orderBy: [desc(products.createdAt)],
    with: {
      variants: {
        with: {
          size: true,
          color: true,
        },
      },
    },
  });

  const totalProducts = await db
    .select({ count: sql<number>`count(*)` })
    .from(products);

  return {
    products: productList,
    hasMore: offset + productList.length < Number(totalProducts[0]?.count || 0),
  };
}

export async function getAttributesForProduct() {
  const [sizeList, colorList] = await Promise.all([
    db.query.sizes.findMany(),
    db.query.colors.findMany(),
  ]);

  return { sizes: sizeList, colors: colorList };
}

// Action untuk tombol "Sync Data" di client: mengambil ulang data produk
// terbaru langsung dari database (bypass cache Next.js), dipakai lewat
// React `use()` + <Suspense> di client component.
// Limit dinaikkan agar sinkronisasi mencakup seluruh katalog produk yang
// biasanya ditampilkan; sesuaikan angkanya kalau katalog sudah sangat besar.
export async function syncProductsAction() {
  const { products: productList } = await getProducts(1, 500, "");
  return productList;
}

// Action Tambah Produk Baru
export async function createProductAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name") as string;
  const sizeIds = formData.getAll("sizeIds") as string[];
  const colorIds = formData.getAll("colorIds") as string[];

  const validated = createProductSchema.safeParse({ name, sizeIds, colorIds });

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  const [newProduct] = await db
    .insert(products)
    .values({ name: validated.data.name })
    .returning();

  const [selectedSizes, selectedColors] = await Promise.all([
    db.query.sizes.findMany({
      where: (s, { inArray }) => inArray(s.id, sizeIds),
    }),
    db.query.colors.findMany({
      where: (c, { inArray }) => inArray(c.id, colorIds),
    }),
  ]);

  const variantsToInsert = [];
  let indexCounter = 0;

  for (const color of selectedColors) {
    for (const size of selectedSizes) {
      const sku = generateSku(newProduct.name, color.name, size.name);
      const barcode = generateNumericBarcode(indexCounter++);

      variantsToInsert.push({
        productId: newProduct.id,
        sizeId: size.id,
        colorId: color.id,
        sku,
        barcode,
        stock: 0,
      });
    }
  }

  await db.insert(productVariants).values(variantsToInsert);

  revalidatePath("/dashboard/produk");
  return {
    success: true,
    message: `Produk "${newProduct.name}" berhasil dibuat!`,
  };
}

// Action Edit Produk & Sinkronisasi Varian (Add Baru / Delete Unchecked)
export async function updateProductAction(
  prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const sizeIds = formData.getAll("sizeIds") as string[];
  const colorIds = formData.getAll("colorIds") as string[];

  const validated = createProductSchema.safeParse({ name, sizeIds, colorIds });

  if (!validated.success) {
    return { success: false, errors: validated.error.flatten().fieldErrors };
  }

  // 1. Update nama produk
  await db
    .update(products)
    .set({ name: validated.data.name })
    .where(eq(products.id, id));

  // 2. Ambil varian lama
  const existingVariants = await db.query.productVariants.findMany({
    where: eq(productVariants.productId, id),
  });

  const [selectedSizes, selectedColors] = await Promise.all([
    db.query.sizes.findMany({
      where: (s, { inArray }) => inArray(s.id, sizeIds),
    }),
    db.query.colors.findMany({
      where: (c, { inArray }) => inArray(c.id, colorIds),
    }),
  ]);

  // Map kombinasi yang dipilih sekarang
  const targetCombinations = new Set();
  selectedColors.forEach((c) => {
    selectedSizes.forEach((s) => {
      targetCombinations.add(`${c.id}_${s.id}`);
    });
  });

  // Hapus varian yang di-uncheck
  for (const v of existingVariants) {
    const key = `${v.colorId}_${v.sizeId}`;
    if (!targetCombinations.has(key)) {
      await db.delete(productVariants).where(eq(productVariants.id, v.id));
    }
  }

  // Tambah varian baru jika belum ada
  const newVariantsToInsert = [];
  let indexCounter = 0;

  for (const color of selectedColors) {
    for (const size of selectedSizes) {
      const exists = existingVariants.some(
        (v) => v.colorId === color.id && v.sizeId === size.id,
      );

      if (!exists) {
        const sku = generateSku(name, color.name, size.name);
        const barcode = generateNumericBarcode(indexCounter++);

        newVariantsToInsert.push({
          productId: id,
          sizeId: size.id,
          colorId: color.id,
          sku,
          barcode,
          stock: 0,
        });
      }
    }
  }

  if (newVariantsToInsert.length > 0) {
    await db.insert(productVariants).values(newVariantsToInsert);
  }

  revalidatePath("/dashboard/produk");
  return {
    success: true,
    message: "Data produk dan varian berhasil diperbarui!",
  };
}

export async function deleteProductAction(id: string): Promise<ActionState> {
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/dashboard/produk");
  return { success: true, message: "Produk berhasil dihapus!" };
}

export async function getStockMovementsByVariant(
  variantId: string,
  page = 1,
  limit = 10,
) {
  const offset = (page - 1) * limit;

  return await db.query.stockMovements.findMany({
    where: eq(stockMovements.productVariantId, variantId),
    limit,
    offset,
    orderBy: [desc(stockMovements.createdAt)],
  });
}
