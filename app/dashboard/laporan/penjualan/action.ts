"use server";

import { db } from "@/db";
import { goodsOut, goodsOutItems, returns, returnItems } from "@/db/schema";
import { sql, eq, gte, lte, and, desc } from "drizzle-orm";

export async function getSalesVsReturnsReport(month: number, year: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // 1. Fetch Summary Goods Out
  const [goodsOutSummary] = await db
    .select({
      totalKeluarQty: sql<number>`coalesce(sum(${goodsOutItems.qty}), 0)`,
      totalDokumenKeluar: sql<number>`count(distinct ${goodsOut.id})`,
    })
    .from(goodsOutItems)
    .innerJoin(goodsOut, eq(goodsOutItems.goodsOutId, goodsOut.id))
    .where(
      and(gte(goodsOut.createdAt, startDate), lte(goodsOut.createdAt, endDate)),
    );

  // 2. Fetch Summary Returns
  const [returnsSummary] = await db
    .select({
      totalReturBagus: sql<number>`coalesce(sum(${returnItems.qtyBagus}), 0)`,
      totalReturCacat: sql<number>`coalesce(sum(${returnItems.qtyCacat}), 0)`,
      totalDokumenRetur: sql<number>`count(distinct ${returns.id})`,
    })
    .from(returnItems)
    .innerJoin(returns, eq(returnItems.returnId, returns.id))
    .where(
      and(gte(returns.createdAt, startDate), lte(returns.createdAt, endDate)),
    );

  // 3. Daily Breakdown for Charts
  const [dailyGoodsOut, dailyReturns] = await Promise.all([
    db
      .select({
        day: sql<number>`extract(day from ${goodsOut.createdAt})`,
        qty: sql<number>`sum(${goodsOutItems.qty})`,
      })
      .from(goodsOutItems)
      .innerJoin(goodsOut, eq(goodsOutItems.goodsOutId, goodsOut.id))
      .where(
        and(
          gte(goodsOut.createdAt, startDate),
          lte(goodsOut.createdAt, endDate),
        ),
      )
      .groupBy(sql`extract(day from ${goodsOut.createdAt})`),

    db
      .select({
        day: sql<number>`extract(day from ${returns.createdAt})`,
        qty: sql<number>`sum(${returnItems.qtyBagus} + ${returnItems.qtyCacat})`,
      })
      .from(returnItems)
      .innerJoin(returns, eq(returnItems.returnId, returns.id))
      .where(
        and(gte(returns.createdAt, startDate), lte(returns.createdAt, endDate)),
      )
      .groupBy(sql`extract(day from ${returns.createdAt})`),
  ]);

  const labels = Array.from({ length: totalDaysInMonth }, (_, i) => `${i + 1}`);
  const goodsOutDaily = new Array(totalDaysInMonth).fill(0);
  const returnsDaily = new Array(totalDaysInMonth).fill(0);

  dailyGoodsOut.forEach((row) => {
    const idx = Number(row.day) - 1;
    if (idx >= 0 && idx < totalDaysInMonth) {
      goodsOutDaily[idx] = Number(row.qty || 0);
    }
  });

  dailyReturns.forEach((row) => {
    const idx = Number(row.day) - 1;
    if (idx >= 0 && idx < totalDaysInMonth) {
      returnsDaily[idx] = Number(row.qty || 0);
    }
  });

  // 4. Detailed Records dengan Relasi Items Varian untuk Accordion
  const [goodsOutRecords, returnRecords] = await Promise.all([
    db.query.goodsOut.findMany({
      where: and(
        gte(goodsOut.createdAt, startDate),
        lte(goodsOut.createdAt, endDate),
      ),
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
    }),
    db.query.returns.findMany({
      where: and(
        gte(returns.createdAt, startDate),
        lte(returns.createdAt, endDate),
      ),
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
    }),
  ]);

  const formattedGoodsOut = goodsOutRecords.map((go) => ({
    id: go.id,
    type: "keluar" as const,
    code: go.outCode,
    marketplaceName: go.marketplace?.name || "Toko Direct",
    operatorName: go.operatorName,
    date: go.createdAt.toISOString(),
    totalQtyKeluar: go.items.reduce((acc, item) => acc + item.qty, 0),
    totalReturBagus: 0,
    totalReturCacat: 0,
    items: go.items.map((i) => ({
      id: i.id,
      productName: i.variant?.product?.name || "-",
      colorName: i.variant?.color?.name || "-",
      sizeName: i.variant?.size?.name || "-",
      sku: i.variant?.sku || "-",
      qtyKeluar: i.qty,
      qtyBagus: 0,
      qtyCacat: 0,
    })),
  }));

  const formattedReturns = returnRecords.map((r) => ({
    id: r.id,
    type: "retur" as const,
    code: r.returnCode,
    marketplaceName: r.marketplace?.name || "Marketplace",
    operatorName: r.operatorName,
    date: r.createdAt.toISOString(),
    totalQtyKeluar: 0,
    totalReturBagus: r.items.reduce((acc, item) => acc + item.qtyBagus, 0),
    totalReturCacat: r.items.reduce((acc, item) => acc + item.qtyCacat, 0),
    items: r.items.map((i) => ({
      id: i.id,
      productName: i.variant?.product?.name || "-",
      colorName: i.variant?.color?.name || "-",
      sizeName: i.variant?.size?.name || "-",
      sku: i.variant?.sku || "-",
      qtyKeluar: 0,
      qtyBagus: i.qtyBagus,
      qtyCacat: i.qtyCacat,
    })),
  }));

  const combinedTableData = [...formattedGoodsOut, ...formattedReturns].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const totalKeluar = Number(goodsOutSummary?.totalKeluarQty || 0);
  const totalReturBagus = Number(returnsSummary?.totalReturBagus || 0);
  const totalReturCacat = Number(returnsSummary?.totalReturCacat || 0);
  const totalRetur = totalReturBagus + totalReturCacat;

  const returnRatio =
    totalKeluar > 0 ? Number(((totalRetur / totalKeluar) * 100).toFixed(1)) : 0;
  const netSalesQty = totalKeluar - totalRetur;

  return {
    summary: {
      totalKeluarQty: totalKeluar,
      totalDokumenKeluar: Number(goodsOutSummary?.totalDokumenKeluar || 0),
      totalReturBagus,
      totalReturCacat,
      totalReturQty: totalRetur,
      netSalesQty,
      returnRatio,
    },
    chartData: {
      labels,
      goodsOutQty: goodsOutDaily,
      returnsQty: returnsDaily,
    },
    tableData: combinedTableData,
  };
}
