"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Counter } from "@/components/counter";
import { getSalesVsReturnsReport } from "./action";
import {
  PackageMinus,
  RotateCcw,
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  ShoppingBag,
  User,
  Search,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  BadgePercent,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
);

export default function LaporanPenjualanVsReturPage() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "keluar" | "retur">(
    "all",
  );

  // Accordion Expand State
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const [reportData, setReportData] = useState<{
    summary: {
      totalKeluarQty: number;
      totalDokumenKeluar: number;
      totalReturBagus: number;
      totalReturCacat: number;
      totalReturQty: number;
      netSalesQty: number;
      returnRatio: number;
    };
    chartData: {
      labels: string[];
      goodsOutQty: number[];
      returnsQty: number[];
    };
    tableData: any[];
  }>({
    summary: {
      totalKeluarQty: 0,
      totalDokumenKeluar: 0,
      totalReturBagus: 0,
      totalReturCacat: 0,
      totalReturQty: 0,
      netSalesQty: 0,
      returnRatio: 0,
    },
    chartData: {
      labels: [],
      goodsOutQty: [],
      returnsQty: [],
    },
    tableData: [],
  });

  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const toggleRowAccordion = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchReport = (month: number, year: number, showToast = false) => {
    startTransition(async () => {
      try {
        const res = await getSalesVsReturnsReport(month, year);
        setReportData(res);
        if (showToast) {
          toast.success("Laporan Penjualan vs Retur disinkronkan!");
        }
      } catch {
        toast.error("Gagal memuat data laporan.");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    fetchReport(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  // Chart Configuration
  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "#a1a1aa",
          font: { family: "Inter, sans-serif", size: 12, weight: "600" },
          usePointStyle: true,
          boxWidth: 8,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "#18181b",
        borderColor: "#27272a",
        borderWidth: 1,
        titleColor: "#f4f4f5",
        bodyColor: "#d4d4d8",
        padding: 12,
        cornerRadius: 12,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(39, 39, 42, 0.4)", drawBorder: false },
        ticks: { color: "#71717a", font: { size: 11 } },
      },
      y: {
        grid: { color: "rgba(39, 39, 42, 0.4)", drawBorder: false },
        ticks: { color: "#71717a", font: { size: 11 } },
      },
    },
  };

  const chartCombinedData = {
    labels: reportData.chartData.labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Barang Keluar (Penjualan)",
        backgroundColor: "rgba(56, 189, 248, 0.85)",
        borderColor: "#38bdf8",
        borderRadius: 6,
        borderSkipped: false,
        data: reportData.chartData.goodsOutQty,
        barPercentage: 0.6,
      },
      {
        type: "bar" as const,
        label: "Barang Retur (Pengembalian)",
        backgroundColor: "rgba(244, 63, 94, 0.85)",
        borderColor: "#f43f5e",
        borderRadius: 6,
        borderSkipped: false,
        data: reportData.chartData.returnsQty,
        barPercentage: 0.6,
      },
    ],
  };

  const filteredTableData = reportData.tableData.filter((item) => {
    const matchesSearch =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.marketplaceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.operatorName.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === "all") return matchesSearch;
    return matchesSearch && item.type === filterType;
  });

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl flex items-center gap-2">
            
              Laporan Penjualan vs Retur Marketplace
            </h1>
            <span className="inline-flex items-center space-x-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span>Desktop First</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau perbandingan total produk keluar ke marketplace dengan retur
            fisik (bagus & cacat).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchReport(selectedMonth, selectedYear, true)}
            disabled={isPending}
            className="flex items-center space-x-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-sky-500/50 hover:bg-zinc-800 hover:text-zinc-100 active:scale-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
            ) : (
              <RefreshCw className="h-4 w-4 text-zinc-400" />
            )}
            <span>{isPending ? "Sinkronisasi..." : "Sync Data"}</span>
          </button>

          <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-xl shadow-lg">
            <Calendar className="h-4 w-4 text-zinc-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer pr-2"
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
              className="bg-transparent text-xs font-medium text-zinc-200 outline-none cursor-pointer border-l border-zinc-800 pl-2"
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

      {/* KPI Summary Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Barang Keluar
              </span>
              <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-2.5 text-sky-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-100">
              <Counter value={reportData.summary.totalKeluarQty} />{" "}
              <span className="text-sm font-medium text-zinc-500">pcs</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Total Pengiriman</span>
            <span className="font-bold text-sky-400">
              <Counter value={reportData.summary.totalDokumenKeluar} /> Dokumen
            </span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Retur Masuk
              </span>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-rose-400">
                <RotateCcw className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-100">
              <Counter value={reportData.summary.totalReturQty} />{" "}
              <span className="text-sm font-medium text-zinc-500">pcs</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />{" "}
              <Counter value={reportData.summary.totalReturBagus} /> Bagus
            </span>
            <span className="flex items-center gap-1 text-rose-400">
              <AlertTriangle className="h-3 w-3" />{" "}
              <Counter value={reportData.summary.totalReturCacat} /> Cacat
            </span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Penjualan Bersih (Net)
              </span>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400">
                <PackageMinus className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-100">
              <Counter value={reportData.summary.netSalesQty} />{" "}
              <span className="text-sm font-medium text-zinc-500">pcs</span>
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Status Terjual</span>
            <span className="font-bold text-emerald-400">Sukses Terpakai</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-5 backdrop-blur-md flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Rasio Retur (%)
              </span>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5 text-amber-400">
                <BadgePercent className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-100">
              <Counter value={reportData.summary.returnRatio} />%
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Tingkat Retur</span>
            <span
              className={`font-bold ${reportData.summary.returnRatio <= 5 ? "text-emerald-400" : "text-rose-400"}`}
            >
              {reportData.summary.returnRatio <= 5
                ? "Rendah (Aman)"
                : "Tinggi (Evaluasi)"}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Chart JS Section */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-md space-y-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              Grafik Komparasi Harian: Barang Keluar vs Retur
            </h2>
            <p className="text-xs text-zinc-400">
              Perbandingan tren pengiriman stok ke marketplace (Biru) dengan
              fisik retur yang masuk (Merah) per tanggal.
            </p>
          </div>
        </div>

        <div className="h-80 w-full pt-2">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            </div>
          ) : (
            <Bar data={chartCombinedData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Table dengan Accordion Item Detail */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md shadow-2xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Rincian Transaksi Combined Keluar vs Retur
            </h2>
            <p className="text-xs text-zinc-400">
              Klik baris transaksi untuk melihat rincian item varian produk di
              dalamnya.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Toggle */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === "all"
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterType("keluar")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === "keluar"
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Barang Keluar
              </button>
              <button
                onClick={() => setFilterType("retur")}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterType === "retur"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Retur
              </button>
            </div>

            {/* Desktop Search Filter */}
            <div className="relative min-w-[240px]">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari Kode, Marketplace..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-10 pr-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-sky-500/50 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Accordion Data Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-800/80">
          <table className="w-full text-left text-xs text-zinc-300 border-collapse">
            <thead className="bg-zinc-950/80 text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
              <tr>
                <th className="w-10 px-3 py-3 text-center"></th>
                <th className="px-4 py-3 font-semibold">Tipe Transaksi</th>
                <th className="px-4 py-3 font-semibold">Kode Transaksi</th>
                <th className="px-4 py-3 font-semibold">
                  Saluran / Marketplace
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Qty Keluar
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Retur Bagus
                </th>
                <th className="px-4 py-3 font-semibold text-center">
                  Retur Cacat
                </th>
                <th className="px-4 py-3 font-semibold">Operator</th>
                <th className="px-4 py-3 font-semibold text-right">
                  Tanggal Transaksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 bg-zinc-900/30">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-sky-400" />
                    <span className="text-xs mt-2 block">
                      Memuat rincian transaksi...
                    </span>
                  </td>
                </tr>
              ) : filteredTableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-zinc-500">
                    Tidak ada transaksi penjualan atau retur ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTableData.map((row) => {
                  const isExpanded = !!expandedRows[row.id];

                  return (
                    <React.Fragment key={row.id}>
                      {/* Row Utama */}
                      <tr
                        onClick={() => toggleRowAccordion(row.id)}
                        className={`hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                          isExpanded ? "bg-zinc-800/30" : ""
                        }`}
                      >
                        <td className="px-3 py-3.5 text-center text-zinc-500">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-sky-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.type === "keluar" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-bold text-sky-400">
                              <ArrowUpRight className="h-3 w-3" /> Keluar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-400">
                              <RotateCcw className="h-3 w-3" /> Retur
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-zinc-100 whitespace-nowrap">
                          {row.code}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
                            <ShoppingBag className="h-3.5 w-3.5 text-zinc-500" />
                            <span>{row.marketplaceName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-sky-400">
                          {row.totalQtyKeluar > 0
                            ? `-${row.totalQtyKeluar} pcs`
                            : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-emerald-400">
                          {row.totalReturBagus > 0
                            ? `+${row.totalReturBagus} pcs`
                            : "-"}
                        </td>
                        <td className="px-4 py-3.5 text-center font-extrabold text-rose-400">
                          {row.totalReturCacat > 0
                            ? `${row.totalReturCacat} pcs`
                            : "-"}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-zinc-400">
                            <User className="h-3 w-3" />
                            <span>{row.operatorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap font-mono text-[11px] text-zinc-400">
                          {new Date(row.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>

                      {/* Accordion Detail Items */}
                      {isExpanded && (
                        <tr className="bg-zinc-950/60 border-y border-zinc-800/80">
                          <td colSpan={9} className="p-4">
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider pb-1 border-b border-zinc-800">
                                <span className="flex items-center gap-1.5 text-zinc-300">
                                  <Package className="h-3.5 w-3.5 text-sky-400" />
                                  Detail Item Transaksi ({row.items.length}{" "}
                                  Varian)
                                </span>
                                <span>Status Unit</span>
                              </div>

                              <div className="divide-y divide-zinc-800/50">
                                {row.items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between py-2 text-xs"
                                  >
                                    <div>
                                      <p className="font-bold text-zinc-200">
                                        {item.productName}
                                      </p>
                                      <p className="text-[10px] text-zinc-400">
                                        {item.colorName} - {item.sizeName} |
                                        SKU: {item.sku}
                                      </p>
                                    </div>

                                    <div className="text-right">
                                      {row.type === "keluar" ? (
                                        <span className="font-extrabold text-sky-400">
                                          -{item.qtyKeluar} pcs
                                        </span>
                                      ) : (
                                        <div className="flex items-center gap-3">
                                          <span className="font-bold text-emerald-400">
                                            Bagus: +{item.qtyBagus}
                                          </span>
                                          <span className="font-bold text-rose-400">
                                            Cacat: {item.qtyCacat}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
