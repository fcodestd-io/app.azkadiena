"use server";

import { db } from "@/db";
import {
  cuttingTargets,
  cuttingTargetItems,
  goodsIn,
  goodsInItems,
} from "@/db/schema";
import { sql, eq, gte, lte, and, desc } from "drizzle-orm";

export async function getTargetVsGoodsInReport(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // 1. Fetch Aggregated SPK Target Potong Data
  const [targetSummary] = await db
    .select({
      totalSPK: sql<number>`count(distinct ${cuttingTargets.id})`,
      totalTargetQty: sql<number>`coalesce(sum(${cuttingTargetItems.qtyTarget}), 0)`,
      totalSelesaiQty: sql<number>`coalesce(sum(${cuttingTargetItems.qtySelesai}), 0)`,
    })
    .from(cuttingTargets)
    .leftJoin(
      cuttingTargetItems,
      eq(cuttingTargets.id, cuttingTargetItems.cuttingTargetId),
    )
    .where(
      and(
        gte(cuttingTargets.createdAt, startDate),
        lte(cuttingTargets.createdAt, endDate),
      ),
    );

  // 2. Fetch Aggregated Goods In Data
  const [goodsInSummary] = await db
    .select({
      totalGoodsIn: sql<number>`coalesce(sum(${goodsInItems.qty}), 0)`,
      totalReceipts: sql<number>`count(distinct ${goodsIn.id})`,
    })
    .from(goodsInItems)
    .innerJoin(goodsIn, eq(goodsInItems.goodsInId, goodsIn.id))
    .where(
      and(gte(goodsIn.createdAt, startDate), lte(goodsIn.createdAt, endDate)),
    );

  // 3. Daily Breakdown for Charts
  const [dailyTargets, dailyGoodsIn] = await Promise.all([
    db
      .select({
        day: sql<number>`extract(day from ${cuttingTargets.createdAt})`,
        qtyTarget: sql<number>`sum(${cuttingTargetItems.qtyTarget})`,
        qtySelesai: sql<number>`sum(${cuttingTargetItems.qtySelesai})`,
      })
      .from(cuttingTargets)
      .leftJoin(
        cuttingTargetItems,
        eq(cuttingTargets.id, cuttingTargetItems.cuttingTargetId),
      )
      .where(
        and(
          gte(cuttingTargets.createdAt, startDate),
          lte(cuttingTargets.createdAt, endDate),
        ),
      )
      .groupBy(sql`extract(day from ${cuttingTargets.createdAt})`),

    db
      .select({
        day: sql<number>`extract(day from ${goodsIn.createdAt})`,
        qty: sql<number>`sum(${goodsInItems.qty})`,
      })
      .from(goodsInItems)
      .innerJoin(goodsIn, eq(goodsInItems.goodsInId, goodsIn.id))
      .where(
        and(gte(goodsIn.createdAt, startDate), lte(goodsIn.createdAt, endDate)),
      )
      .groupBy(sql`extract(day from ${goodsIn.createdAt})`),
  ]);

  const labels = Array.from({ length: totalDaysInMonth }, (_, i) => `${i + 1}`);
  const targetQtyDaily = new Array(totalDaysInMonth).fill(0);
  const goodsInDaily = new Array(totalDaysInMonth).fill(0);

  dailyTargets.forEach((row) => {
    const idx = Number(row.day) - 1;
    if (idx >= 0 && idx < totalDaysInMonth) {
      targetQtyDaily[idx] = Number(row.qtyTarget || 0);
    }
  });

  dailyGoodsIn.forEach((row) => {
    const idx = Number(row.day) - 1;
    if (idx >= 0 && idx < totalDaysInMonth) {
      goodsInDaily[idx] = Number(row.qty || 0);
    }
  });

  // 4. Detailed Combined Table List dengan Relasi Items Varian untuk Accordion
  const detailedRecords = await db.query.goodsIn.findMany({
    where: and(
      gte(goodsIn.createdAt, startDate),
      lte(goodsIn.createdAt, endDate),
    ),
    with: {
      confection: true,
      cuttingTarget: {
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
      },
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

  const formattedDetails = detailedRecords.map((gi) => {
    const totalQtyMasuk = gi.items.reduce((acc, item) => acc + item.qty, 0);
    const targetCode = gi.cuttingTarget?.targetCode || "Non-SPK Direct";
    const totalTargetQty =
      gi.cuttingTarget?.items?.reduce((acc, item) => acc + item.qtyTarget, 0) ||
      0;

    // Formatting items rincian gabungan antara target vs barang masuk
    const items = gi.items.map((i) => {
      const targetItem = gi.cuttingTarget?.items?.find(
        (ti) => ti.productVariantId === i.productVariantId,
      );

      return {
        id: i.id,
        productName: i.variant?.product?.name || "-",
        colorName: i.variant?.color?.name || "-",
        sizeName: i.variant?.size?.name || "-",
        sku: i.variant?.sku || "-",
        qtyMasuk: i.qty,
        qtyTarget: targetItem?.qtyTarget || 0,
      };
    });

    return {
      id: gi.id,
      receiptCode: gi.receiptCode,
      targetCode,
      confectionName: gi.confection?.name || "-",
      operatorName: gi.operatorName,
      date: gi.createdAt.toISOString(),
      totalQtyMasuk,
      totalTargetQty,
      achievementPct:
        totalTargetQty > 0
          ? Math.min(Math.round((totalQtyMasuk / totalTargetQty) * 100), 100)
          : 100,
      items,
    };
  });

  const totalTargetQty = Number(targetSummary?.totalTargetQty || 0);
  const totalGoodsInQty = Number(goodsInSummary?.totalGoodsIn || 0);
  const overallAchievement =
    totalTargetQty > 0
      ? Math.round((totalGoodsInQty / totalTargetQty) * 100)
      : 0;

  return {
    summary: {
      totalSPK: Number(targetSummary?.totalSPK || 0),
      totalTargetQty,
      totalSelesaiQty: Number(targetSummary?.totalSelesaiQty || 0),
      totalGoodsInQty,
      totalReceipts: Number(goodsInSummary?.totalReceipts || 0),
      overallAchievement,
    },
    chartData: {
      labels,
      targetQty: targetQtyDaily,
      goodsInQty: goodsInDaily,
    },
    tableData: formattedDetails,
  };
}
