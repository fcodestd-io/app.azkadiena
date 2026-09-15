"use server";

import { db } from "@/db";
import {
  products,
  productVariants,
  colors,
  sizes,
  stockAdjustments,
  stockAdjustmentItems,
  stockMovements,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type OpnameInputItem = {
  productVariantId: string;
  qtySebelum: number;
  qtySesudah: number;
  selisih: number;
};

// 1. Fetch Semua Produk & Varian Sekaligus (Client-Side Search Ready)
export async function getAllOpnameProducts() {
  const data = await db.query.products.findMany({
    with: {
      variants: {
        with: {
          color: true,
          size: true,
        },
      },
    },
    orderBy: [desc(products.createdAt)],
  });

  return data;
}

// 2. Fetch Kartu Stok Audit Movement per Varian
export async function getVariantMovements(variantId: string) {
  return await db.query.stockMovements.findMany({
    where: eq(stockMovements.productVariantId, variantId),
    orderBy: [desc(stockMovements.createdAt)],
    limit: 20,
  });
}

// 3. Fetch Riwayat Stock Opname
export async function getOpnameHistory() {
  return await db.query.stockAdjustments.findMany({
    with: {
      items: {
        with: {
          variant: {
            with: {
              product: true,
              color: true,
              size: true,
            },
          },
        },
      },
    },
    orderBy: [desc(stockAdjustments.createdAt)],
    limit: 15,
  });
}

// 4. Submit Stock Opname (operatorName diambil dari Session User)
export async function submitStockOpname(payload: {
  title: string;
  items: OpnameInputItem[];
}) {
  const session = await auth();
  const operatorName = session?.user?.name || "SPV Gudang";

  if (!payload.items || payload.items.length === 0) {
    throw new Error("Pilih setidaknya satu varian untuk di-opname.");
  }

  const adjustmentCode = `ADJ-${Date.now()}`;

  await db.transaction(async (tx) => {
    // A. Buat Header Stock Adjustment
    const [header] = await tx
      .insert(stockAdjustments)
      .values({
        adjustmentCode,
        title: payload.title || "Stock Opname Rutin",
        operatorName,
      })
      .returning();

    for (const item of payload.items) {
      // B. Buat Detail Item Stock Adjustment
      const [adjItem] = await tx
        .insert(stockAdjustmentItems)
        .values({
          stockAdjustmentId: header.id,
          productVariantId: item.productVariantId,
          qtySebelum: item.qtySebelum,
          qtySesudah: item.qtySesudah,
          selisih: item.selisih,
        })
        .returning();

      // C. Update Stok Fisik Utama di Product Variants
      await tx
        .update(productVariants)
        .set({ stock: item.qtySesudah })
        .where(eq(productVariants.id, item.productVariantId));

      // D. Buat Catatan Audit di Stock Movements (Kartu Stok)
      await tx.insert(stockMovements).values({
        productVariantId: item.productVariantId,
        type: "adjustment",
        qty: item.selisih,
        stockBefore: item.qtySebelum,
        stockAfter: item.qtySesudah,
        referenceId: header.id,
        referenceItemId: adjItem.id,
        operatorName,
      });
    }
  });

  revalidatePath("/supervisor/warehouse/stock-opname");
  return { success: true };
}
