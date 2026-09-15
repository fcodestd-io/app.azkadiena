import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import {
  Scissors,
  PackagePlus,
  PackageMinus,
  RotateCcw,
  ClipboardCheck,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default async function SupervisorWarehouseDashboard() {
  const session = await auth();

  return (
    <div className="space-y-5">
      {/* Top Banner Profile / SPV Info */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400">Selamat Datang,</p>
            <h2 className="text-lg font-bold text-zinc-100">
              {session?.user?.name ?? "SPV Gudang"}
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Grid Menu Operasional Gudang */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold tracking-wider text-zinc-400 uppercase px-1">
          Menu Operasional
        </h3>

        {/* Menu 1: Stock Opname */}
        <Link
          href="/supervisor/warehouse/stock-opname"
          className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all active:scale-[0.98] active:bg-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">
                Stock Opname / Penyesuaian
              </h4>
              <p className="text-[11px] text-zinc-400">
                Pengecekan fisik & penyesuaian stok
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600" />
        </Link>

        {/* Menu 2: Target Potong */}
        <Link
          href="/supervisor/warehouse/target-potong"
          className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all active:scale-[0.98] active:bg-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Target Potong</h4>
              <p className="text-[11px] text-zinc-400">
                SPK pemotongan bahan konveksi
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600" />
        </Link>

        {/* Menu 3: Barang Masuk */}
        <Link
          href="/supervisor/warehouse/barang-masuk"
          className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all active:scale-[0.98] active:bg-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Barang Masuk</h4>
              <p className="text-[11px] text-zinc-400">
                Terima setoran produk dari konveksi
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600" />
        </Link>

        {/* Menu 4: Barang Keluar */}
        <Link
          href="/supervisor/warehouse/barang-keluar"
          className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all active:scale-[0.98] active:bg-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <PackageMinus className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Barang Keluar</h4>
              <p className="text-[11px] text-zinc-400">
                Pengiriman stok ke marketplace/toko
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600" />
        </Link>

        {/* Menu 5: Barang Retur */}
        <Link
          href="/supervisor/warehouse/barang-retur"
          className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 transition-all active:scale-[0.98] active:bg-zinc-800"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Barang Retur</h4>
              <p className="text-[11px] text-zinc-400">
                Cek barang kembali & stok cacat
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-zinc-600" />
        </Link>
      </div>

    </div>
  );
}
