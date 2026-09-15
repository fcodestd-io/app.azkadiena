"use server";

import { db } from "@/db";
import {
  returns,
  returnItems,
  productVariants,
  stockMovements,
  marketplaces,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type ReturnItemPayload = {
  productVariantId: string;
  qtyBagus: number;
  qtyCacat: number;
};

// 1. Fetch Riwayat Retur Barang
export async function getReturnList() {
  return await db.query.returns.findMany({
    with: {
      marketplace: true,
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
    orderBy: [desc(returns.createdAt)],
  });
}

// 2. Fetch Opsi Marketplace & Varian Produk (dengan Barcode & SKU)
export async function getReturnFormOptions() {
  const [marketplaceList, rawProducts] = await Promise.all([
    db.query.marketplaces.findMany({
      orderBy: [desc(marketplaces.createdAt)],
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
  ]);

  const flatVariants = rawProducts.flatMap((p) =>
    p.variants.map((v) => ({
      id: v.id,
      productId: p.id,
      productName: p.name,
      colorName: v.color?.name || "",
      sizeName: v.size?.name || "",
      sku: v.sku,
      barcode: v.barcode,
      stock: v.stock,
      searchKey:
        `${p.name} ${v.size?.name || ""} ${v.color?.name || ""} ${v.sku} ${v.barcode}`.toLowerCase(),
    })),
  );

  return { marketplaceList, flatVariants };
}

// 3. Submit Transaksi Retur (Atomic WebSocket Transaction)
export async function createReturnTransaction(payload: {
  marketplaceId: string;
  items: ReturnItemPayload[];
}) {
  const session = await auth();
  const operatorName = session?.user?.name || "SPV Gudang";

  if (!payload.marketplaceId) {
    throw new Error("Pilih asal marketplace retur.");
  }

  if (!payload.items || payload.items.length === 0) {
    throw new Error("Tambahkan minimal 1 item barang retur.");
  }

  const returnCode = `RTR-${Date.now()}`;

  await db.transaction(async (tx) => {
    // A. Insert Header Retur
    const [header] = await tx
      .insert(returns)
      .values({
        returnCode,
        marketplaceId: payload.marketplaceId,
        operatorName,
      })
      .returning();

    for (const item of payload.items) {
      if (item.qtyBagus < 0 || item.qtyCacat < 0) {
        throw new Error("Jumlah retur tidak boleh bernilai negatif.");
      }

      if (item.qtyBagus === 0 && item.qtyCacat === 0) {
        continue;
      }

      // B. Insert Detail Item Retur
      const [insertedItem] = await tx
        .insert(returnItems)
        .values({
          returnId: header.id,
          productVariantId: item.productVariantId,
          qtyBagus: item.qtyBagus,
          qtyCacat: item.qtyCacat,
        })
        .returning();

      // C. Update Stok Utama HANYA dari Qty Bagus
      if (item.qtyBagus > 0) {
        const currentVariant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.productVariantId),
        });

        const stockBefore = currentVariant?.stock || 0;
        const stockAfter = stockBefore + item.qtyBagus;

        // Update stok fisik utama
        await tx
          .update(productVariants)
          .set({ stock: stockAfter })
          .where(eq(productVariants.id, item.productVariantId));

        // Catat Kartu Stok (Movement) untuk Qty Bagus yang masuk kembali
        await tx.insert(stockMovements).values({
          productVariantId: item.productVariantId,
          type: "return",
          qty: item.qtyBagus,
          stockBefore,
          stockAfter,
          referenceId: header.id,
          referenceItemId: insertedItem.id,
          operatorName,
        });
      }
    }
  });

  revalidatePath("/supervisor/warehouse/barang-retur");
  return { success: true };
}
