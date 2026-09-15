"use client";

import { useState, useEffect, useTransition } from "react";
import { DashboardBarChart } from "@/components/dashboard-chart";
import { Counter } from "@/components/counter";
import { getDashboardData } from "./dashboard-action";
import {
  Package,
  Scissors,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  Palette,
  Ruler,
  Calendar,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const [data, setData] = useState({
    totalProduk: 0,
    totalWarna: 0,
    totalSize: 0,
    targetPotongBulanIni: 0,
    barangMasuk: 0,
    barangKeluar: 0,
    qtyReturn: 0,
    chartData: {
      labels: [],
      barangMasuk: [],
      barangKeluar: [],
    },
  });

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load Data dari Database
  const fetchMetrics = (month: number, year: number, showToast = false) => {
    startTransition(async () => {
      try {
        const res = await getDashboardData(month, year);
        setData(res);
        if (showToast) {
          toast.success("Data inventori berhasil disinkronkan!");
        }
      } catch (err) {
        toast.error("Gagal memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchMetrics(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  const handleSyncData = () => {
    fetchMetrics(selectedMonth, selectedYear, true);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              Ringkasan Operasional
            </h1>
            <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live System</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau statistik produksi harian dan alur keluar masuk barang.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncData}
            disabled={isPending}
            className="flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span>{isPending ? "Menyinkronkan..." : "Sync Data"}</span>
          </button>

          <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-800/80 p-1.5 rounded-xl">
            <Calendar className="h-4 w-4 text-zinc-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer pr-2"
            >
              <option value="1" className="bg-zinc-900">
                Januari
              </option>
              <option value="2" className="bg-zinc-900">
                Februari
              </option>
              <option value="3" className="bg-zinc-900">
                Maret
              </option>
              <option value="4" className="bg-zinc-900">
                April
              </option>
              <option value="5" className="bg-zinc-900">
                Mei
              </option>
              <option value="6" className="bg-zinc-900">
                Juni
              </option>
              <option value="7" className="bg-zinc-900">
                Juli
              </option>
              <option value="8" className="bg-zinc-900">
                Agustus
              </option>
              <option value="9" className="bg-zinc-900">
                September
              </option>
              <option value="10" className="bg-zinc-900">
                Oktober
              </option>
              <option value="11" className="bg-zinc-900">
                November
              </option>
              <option value="12" className="bg-zinc-900">
                Desember
              </option>
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-200 outline-none cursor-pointer border-l border-zinc-800 pl-2"
            >
              <option value="2025" className="bg-zinc-900">
                2025
              </option>
              <option value="2026" className="bg-zinc-900">
                2026
              </option>
              <option value="2027" className="bg-zinc-900">
                2027
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid dengan Auto Count */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Total Produk
              </span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-300">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
              <Counter value={data.totalProduk} />
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center space-x-1">
              <Palette className="h-3 w-3 text-zinc-500" />
              <span>
                <Counter value={data.totalWarna} /> Warna
              </span>
            </span>
            <span className="flex items-center space-x-1">
              <Ruler className="h-3 w-3 text-zinc-500" />
              <span>
                <Counter value={data.totalSize} /> Ukuran
              </span>
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Target Potong Bulan Ini
              </span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-amber-400">
                <Scissors className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
              <Counter value={data.targetPotongBulanIni} /> SPK
            </p>
          </div>
          <p className="mt-4 text-[11px] text-zinc-500">
            Total SPK diterbitkan bulan ini
          </p>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Barang Masuk
              </span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-emerald-400">
                <ArrowDownLeft className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
              <Counter value={data.barangMasuk} /> pcs
            </p>
          </div>
          <p className="mt-4 text-[11px] text-zinc-500">
            Dari setoran konveksi
          </p>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Barang Keluar
              </span>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-sky-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
              <Counter value={data.barangKeluar} /> pcs
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
            <span className="text-[11px] text-zinc-400">Retur Marketplace</span>
            <span className="flex items-center space-x-1 text-xs font-semibold text-red-500">
              <RotateCcw className="h-3 w-3 inline" />
              <span>
                <Counter value={data.qtyReturn} /> pcs Retur
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section Harian */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Grafik Barang Masuk vs Barang Keluar Harian
            </h2>
            <p className="text-xs text-zinc-400">
              Pergerakan unit per tanggal dalam bulan yang dipilih.
            </p>
          </div>
        </div>
        <div className="h-72 w-full pt-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            </div>
          ) : (
            <DashboardBarChart data={data.chartData} />
          )}
        </div>
      </div>
    </main>
  );
}
