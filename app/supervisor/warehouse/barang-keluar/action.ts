"use server";

import { db } from "@/db";
import {
  goodsOut,
  goodsOutItems,
  productVariants,
  stockMovements,
  marketplaces,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type GoodsOutItemPayload = {
  productVariantId: string;
  qty: number;
};

// 1. Fetch Riwayat Transaksi Barang Keluar
export async function getGoodsOutList() {
  return await db.query.goodsOut.findMany({
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
    orderBy: [desc(goodsOut.createdAt)],
  });
}

// 2. Fetch Option Marketplace & Varian Produk (dengan Search Key & Barcode)
export async function getGoodsOutFormOptions() {
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

// 3. Submit Transaksi Barang Keluar (Atomic WebSocket Transaction)
export async function createGoodsOutTransaction(payload: {
  marketplaceId: string;
  items: GoodsOutItemPayload[];
}) {
  const session = await auth();
  const operatorName = session?.user?.name || "SPV Gudang";

  if (!payload.marketplaceId) {
    throw new Error("Pilih tujuan marketplace / saluran penjualan.");
  }
  if (!payload.items || payload.items.length === 0) {
    throw new Error("Tambahkan minimal 1 item barang keluar.");
  }

  const outCode = `BK-${Date.now()}`;

  await db.transaction(async (tx) => {
    // A. Insert Header Goods Out
    const [header] = await tx
      .insert(goodsOut)
      .values({
        outCode,
        marketplaceId: payload.marketplaceId,
        operatorName,
      })
      .returning();

    for (const item of payload.items) {
      // B. Cek Stok Terkini
      const currentVariant = await tx.query.productVariants.findFirst({
        where: eq(productVariants.id, item.productVariantId),
        with: {
          product: true,
          color: true,
          size: true,
        },
      });

      if (!currentVariant) {
        throw new Error("Varian produk tidak ditemukan.");
      }

      if (currentVariant.stock < item.qty) {
        throw new Error(
          `Stok tidak mencukupi untuk ${currentVariant.product.name} (${currentVariant.color.name} - ${currentVariant.size.name}). Stok tersedia: ${currentVariant.stock} pcs, diminta: ${item.qty} pcs.`,
        );
      }

      // C. Insert Item Goods Out
      const [insertedItem] = await tx
        .insert(goodsOutItems)
        .values({
          goodsOutId: header.id,
          productVariantId: item.productVariantId,
          qty: item.qty,
        })
        .returning();

      const stockBefore = currentVariant.stock;
      const stockAfter = stockBefore - item.qty;

      // D. Update Stok Fisik Utama
      await tx
        .update(productVariants)
        .set({ stock: stockAfter })
        .where(eq(productVariants.id, item.productVariantId));

      // E. Catat Kartu Stok Movement
      await tx.insert(stockMovements).values({
        productVariantId: item.productVariantId,
        type: "out",
        qty: item.qty,
        stockBefore,
        stockAfter,
        referenceId: header.id,
        referenceItemId: insertedItem.id,
        operatorName,
      });
    }
  });

  revalidatePath("/supervisor/warehouse/barang-keluar");
  return { success: true };
}
