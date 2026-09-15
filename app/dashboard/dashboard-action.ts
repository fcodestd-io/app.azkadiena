"use server";

import { db } from "@/db";
import {
  products,
  colors,
  sizes,
  cuttingTargets,
  goodsInItems,
  goodsIn,
  goodsOutItems,
  goodsOut,
  returnItems,
  returns,
} from "@/db/schema";
import { sql, eq, gte, lte, and } from "drizzle-orm";

export async function getDashboardData(month: number, year: number) {
  // 1. Tanggal Mulai dan Akhir Bulan yang Dipilih
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const totalDaysInMonth = new Date(year, month, 0).getDate();

  // 2. Fetch Aggregations (Produk, Warna, Size, SPK Target Potong)
  const [
    productsCount,
    colorsCount,
    sizesCount,
    targetsCount,
    goodsInTotal,
    goodsOutTotal,
    returnsTotal,
    dailyGoodsIn,
    dailyGoodsOut,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(products),
    db.select({ count: sql<number>`count(*)` }).from(colors),
    db.select({ count: sql<number>`count(*)` }).from(sizes),

    // Count Target Potong SPK Bulan Ini
    db
      .select({ count: sql<number>`count(*)` })
      .from(cuttingTargets)
      .where(
        and(
          gte(cuttingTargets.createdAt, startDate),
          lte(cuttingTargets.createdAt, endDate),
        ),
      ),

    // Total Barang Masuk Bulan Ini
    db
      .select({ total: sql<number>`coalesce(sum(${goodsInItems.qty}), 0)` })
      .from(goodsInItems)
      .innerJoin(goodsIn, eq(goodsInItems.goodsInId, goodsIn.id))
      .where(
        and(gte(goodsIn.createdAt, startDate), lte(goodsIn.createdAt, endDate)),
      ),

    // Total Barang Keluar Bulan Ini
    db
      .select({ total: sql<number>`coalesce(sum(${goodsOutItems.qty}), 0)` })
      .from(goodsOutItems)
      .innerJoin(goodsOut, eq(goodsOutItems.goodsOutId, goodsOut.id))
      .where(
        and(
          gte(goodsOut.createdAt, startDate),
          lte(goodsOut.createdAt, endDate),
        ),
      ),

    // Total Qty Return (Bagus + Cacat) Bulan Ini
    db
      .select({
        total: sql<number>`coalesce(sum(${returnItems.qtyBagus} + ${returnItems.qtyCacat}), 0)`,
      })
      .from(returnItems)
      .innerJoin(returns, eq(returnItems.returnId, returns.id))
      .where(
        and(gte(returns.createdAt, startDate), lte(returns.createdAt, endDate)),
      ),

    // Grouping Goods In per Hari
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

    // Grouping Goods Out per Hari
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
  ]);

  // 3. Mapping Chart Data per Tanggal 1 s/d Total Hari
  const labels = Array.from({ length: totalDaysInMonth }, (_, i) => `${i + 1}`);
  const barangMasukDaily = new Array(totalDaysInMonth).fill(0);
  const barangKeluarDaily = new Array(totalDaysInMonth).fill(0);

  dailyGoodsIn.forEach((row) => {
    const dayIndex = Number(row.day) - 1;
    if (dayIndex >= 0 && dayIndex < totalDaysInMonth) {
      barangMasukDaily[dayIndex] = Number(row.qty);
    }
  });

  dailyGoodsOut.forEach((row) => {
    const dayIndex = Number(row.day) - 1;
    if (dayIndex >= 0 && dayIndex < totalDaysInMonth) {
      barangKeluarDaily[dayIndex] = Number(row.qty);
    }
  });

  return {
    totalProduk: Number(productsCount[0]?.count || 0),
    totalWarna: Number(colorsCount[0]?.count || 0),
    totalSize: Number(sizesCount[0]?.count || 0),
    targetPotongBulanIni: Number(targetsCount[0]?.count || 0),
    barangMasuk: Number(goodsInTotal[0]?.total || 0),
    barangKeluar: Number(goodsOutTotal[0]?.total || 0),
    qtyReturn: Number(returnsTotal[0]?.total || 0),
    chartData: {
      labels,
      barangMasuk: barangMasukDaily,
      barangKeluar: barangKeluarDaily,
    },
  };
}
