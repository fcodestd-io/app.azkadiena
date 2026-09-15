"use server";

import { db } from "@/db";
import {
  goodsIn,
  goodsInItems,
  productVariants,
  stockMovements,
  cuttingTargetItems,
  confections,
  cuttingTargets,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type GoodsInItemPayload = {
  productVariantId: string;
  qty: number;
};

// 1. Fetch Semua Riwayat Penerimaan Barang Masuk
export async function getGoodsInList() {
  return await db.query.goodsIn.findMany({
    with: {
      confection: true,
      cuttingTarget: true,
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
    orderBy: [desc(goodsIn.createdAt)],
  });
}

// 2. Fetch Master Konveksi & Target Potong yang berstatus 'started'
export async function getGoodsInFormOptions() {
  const [confectionList, activeCuttingTargets, rawProducts] = await Promise.all(
    [
      db.query.confections.findMany({
        orderBy: [desc(confections.createdAt)],
      }),
      db.query.cuttingTargets.findMany({
        where: eq(cuttingTargets.status, "started"),
        orderBy: [desc(cuttingTargets.createdAt)],
      }),
      db.query.products.findMany({
        with: {
          variants: {
            with: {
              color: true,
              size: true,
            },
          },
        },
      }),
    ],
  );

  // Flatten varian produk agar mudah di-search
  const flatVariants = rawProducts.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      productName: p.name,
      colorName: v.color?.name || "",
      sizeName: v.size?.name || "",
      sku: v.sku,
      stock: v.stock,
      // String pencarian multi-kata (e.g. "Gamis Abaya XL Red")
      searchKey:
        `${p.name} ${v.size?.name || ""} ${v.color?.name || ""} ${v.sku}`.toLowerCase(),
    })),
  );

  return { confectionList, activeCuttingTargets, flatVariants };
}

// 3. Process Barang Masuk Transaction
export async function createGoodsInTransaction(payload: {
  confectionId: string;
  cuttingTargetId?: string | null;
  items: GoodsInItemPayload[];
}) {
  const session = await auth();
  const operatorName = session?.user?.name || "SPV Gudang";

  if (!payload.confectionId) {
    throw new Error("Pilih konveksi pengirim barang.");
  }
  if (!payload.items || payload.items.length === 0) {
    throw new Error("Tambahkan minimal 1 item barang masuk.");
  }

  const receiptCode = `BM-${Date.now()}`;

  await db.transaction(async (tx) => {
    // A. Insert Header Goods In
    const [header] = await tx
      .insert(goodsIn)
      .values({
        receiptCode,
        confectionId: payload.confectionId,
        cuttingTargetId: payload.cuttingTargetId || null,
        operatorName,
      })
      .returning();

    for (const item of payload.items) {
      // B. Insert Item Goods In
      const [insertedItem] = await tx
        .insert(goodsInItems)
        .values({
          goodsInId: header.id,
          productVariantId: item.productVariantId,
          qty: item.qty,
        })
        .returning();

      // C. Get Current Stock Variant
      const currentVariant = await tx.query.productVariants.findFirst({
        where: eq(productVariants.id, item.productVariantId),
      });

      const stockBefore = currentVariant?.stock || 0;
      const stockAfter = stockBefore + item.qty;

      // D. Update Stok Fisik Utama
      await tx
        .update(productVariants)
        .set({ stock: stockAfter })
        .where(eq(productVariants.id, item.productVariantId));

      // E. Catat Kartu Stok (Stock Movement)
      await tx.insert(stockMovements).values({
        productVariantId: item.productVariantId,
        type: "in",
        qty: item.qty,
        stockBefore,
        stockAfter,
        referenceId: header.id,
        referenceItemId: insertedItem.id,
        operatorName,
      });

      // F. UPDATE TARGET POTONG (Jika terhubung dengan SPK Target Potong 'started')
      if (payload.cuttingTargetId) {
        const targetItem = await tx.query.cuttingTargetItems.findFirst({
          where: and(
            eq(cuttingTargetItems.cuttingTargetId, payload.cuttingTargetId),
            eq(cuttingTargetItems.productVariantId, item.productVariantId),
          ),
        });

        if (targetItem) {
          await tx
            .update(cuttingTargetItems)
            .set({
              qtySelesai: targetItem.qtySelesai + item.qty,
            })
            .where(eq(cuttingTargetItems.id, targetItem.id));
        }
      }
    }
  });

  revalidatePath("/supervisor/warehouse/barang-masuk");
  return { success: true };
}
