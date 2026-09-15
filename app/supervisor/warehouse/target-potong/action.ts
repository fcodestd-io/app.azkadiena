"use server";

import { db } from "@/db";
import {
  cuttingTargets,
  cuttingTargetItems,
  products,
  TargetStatus,
} from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type TargetItemPayload = {
  productVariantId: string;
  qtyTarget: number;
};

// 1. Fetch Semua SPK Target Potong
export async function getCuttingTargets() {
  return await db.query.cuttingTargets.findMany({
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
    orderBy: [desc(cuttingTargets.createdAt)],
  });
}

// 2. Fetch Opsi Varian untuk Picker Modal
export async function getVariantPickerOptions() {
  return await db.query.products.findMany({
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
}

// 3. Create SPK Header + Items (operatorName diambil otomatis dari Session)
export async function createCuttingTargetSPK(payload: {
  title: string;
  items: TargetItemPayload[];
}) {
  const session = await auth();
  const operatorName = session?.user?.name || "SPV Gudang";

  if (!payload.items || payload.items.length === 0) {
    throw new Error("Tambahkan minimal 1 item produk ke dalam list SPK.");
  }

  // Format Code: TP-YYYYMMDD-RANDOM
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const targetCode = `TP-${dateStr}-${randomSuffix}`;

  await db.transaction(async (tx) => {
    // A. Insert Header SPK
    const [header] = await tx
      .insert(cuttingTargets)
      .values({
        targetCode,
        operatorName,
        status: "started",
      })
      .returning();

    // B. Insert Items
    for (const item of payload.items) {
      await tx.insert(cuttingTargetItems).values({
        cuttingTargetId: header.id,
        productVariantId: item.productVariantId,
        qtyTarget: item.qtyTarget,
        qtySelesai: 0,
      });
    }
  });

  revalidatePath("/supervisor/warehouse/target-potong");
  return { success: true };
}

// 4. Update Status SPK (Started -> Finished / Canceled)
export async function updateCuttingTargetStatus(
  targetId: string,
  status: TargetStatus,
) {
  await db
    .update(cuttingTargets)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(cuttingTargets.id, targetId));

  revalidatePath("/supervisor/warehouse/target-potong");
  return { success: true };
}
