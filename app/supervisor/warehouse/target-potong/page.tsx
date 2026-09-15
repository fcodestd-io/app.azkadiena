"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  getCuttingTargets,
  getVariantPickerOptions,
  createCuttingTargetSPK,
  updateCuttingTargetStatus,
} from "./action";
import { TargetStatus } from "@/db/schema";
import {
  Scissors,
  Plus,
  Search,
  X,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Package,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  FileText,
} from "lucide-react";

type TempItem = {
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  sku: string;
  stock: number;
  qtyTarget: number;
};

export default function TargetPotongPage() {
  const [targets, setTargets] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showSPKModal, setShowSPKModal] = useState(false);
  const [spkTitle, setSpkTitle] = useState("");
  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  // Picker Modal State
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");

  const [selectedTargetForStatus, setSelectedTargetForStatus] = useState<{
    id: string;
    newStatus: TargetStatus;
  } | null>(null);

  const [expandedTargets, setExpandedTargets] = useState<
    Record<string, boolean>
  >({});
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    try {
      const [targetsRes, variantsRes] = await Promise.all([
        getCuttingTargets(),
        getVariantPickerOptions(),
      ]);
      setTargets(targetsRes);
      setRawProducts(variantsRes);
    } catch {
      toast.error("Gagal memuat data target potong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ------------------------------------------------------------------
  // MULTI-WORD LIVE SEARCH FILTER (e.g. "Gamis XL Red")
  // ------------------------------------------------------------------
  const flatVariants = useMemo(() => {
    return rawProducts.flatMap((p) =>
      p.variants.map((v: any) => ({
        id: v.id,
        productId: p.id,
        productName: p.name,
        colorName: v.color?.name || "-",
        sizeName: v.size?.name || "-",
        sku: v.sku,
        stock: v.stock,
        // Composite Key Pencarian Multi-Kata
        searchKey:
          `${p.name} ${v.size?.name || ""} ${v.color?.name || ""} ${v.sku}`.toLowerCase(),
      })),
    );
  }, [rawProducts]);

  const filteredPickerVariants = useMemo(() => {
    if (!pickerSearch.trim()) return flatVariants;

    // Pecah kata kunci pencarian berdasarkan spasi
    const keywords = pickerSearch.toLowerCase().trim().split(/\s+/);

    return flatVariants.filter((item) =>
      // Setiap kata kunci harus ada di dalam searchKey
      keywords.every((kw) => item.searchKey.includes(kw)),
    );
  }, [flatVariants, pickerSearch]);

  const toggleAccordion = (id: string) => {
    setExpandedTargets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectVariantFromPicker = (v: any) => {
    const isExist = tempItems.some((item) => item.variantId === v.id);
    if (isExist) {
      toast.warning("Varian produk ini sudah ada di dalam list SPK.");
      return;
    }

    const newItem: TempItem = {
      variantId: v.id,
      productName: v.productName,
      colorName: v.colorName,
      sizeName: v.sizeName,
      sku: v.sku,
      stock: v.stock,
      qtyTarget: 100,
    };

    setTempItems((prev) => [...prev, newItem]);
    setShowPickerModal(false);
    toast.success(
      `${v.productName} (${v.colorName} - ${v.sizeName}) ditambahkan.`,
    );
  };

  const handleInlineQtyChange = (variantId: string, val: string) => {
    const qty = parseInt(val, 10) || 0;
    setTempItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, qtyTarget: qty } : item,
      ),
    );
  };

  const handleRemoveTempItem = (variantId: string) => {
    setTempItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleSubmitSPK = () => {
    if (!spkTitle.trim()) {
      toast.warning("Judul / Catatan SPK wajib diisi.");
      return;
    }
    if (tempItems.length === 0) {
      toast.warning("Tambahkan minimal satu varian ke list SPK.");
      return;
    }

    startTransition(async () => {
      try {
        await createCuttingTargetSPK({
          title: spkTitle,
          items: tempItems.map((i) => ({
            productVariantId: i.variantId,
            qtyTarget: i.qtyTarget,
          })),
        });

        toast.success("SPK Target Potong berhasil diterbitkan!");
        setShowSPKModal(false);
        setSpkTitle("");
        setTempItems([]);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Gagal membuat SPK Target Potong");
      }
    });
  };

  const handleConfirmStatusChange = () => {
    if (!selectedTargetForStatus) return;

    startTransition(async () => {
      try {
        await updateCuttingTargetStatus(
          selectedTargetForStatus.id,
          selectedTargetForStatus.newStatus,
        );
        toast.success(
          `Status SPK diperbarui ke ${selectedTargetForStatus.newStatus}!`,
        );
        setSelectedTargetForStatus(null);
        loadData();
      } catch {
        toast.error("Gagal memperbarui status SPK");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Scissors className="h-5 w-5 text-amber-400" />
            Target Potong
          </h1>
          <p className="text-[11px] text-zinc-400">
            Misal: Target 15-09-2026
          </p>
        </div>

        <button
          onClick={() => setShowSPKModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-zinc-950 transition-all active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Buat SPK Baru</span>
        </button>
      </div>

      {/* List Target Potong */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
        </div>
      ) : targets.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
          Belum ada SPK Target Potong yang dibuat.
        </div>
      ) : (
        <div className="space-y-3">
          {targets.map((target) => {
            const isExpanded = !!expandedTargets[target.id];

            const totalTarget = target.items.reduce(
              (acc: number, i: any) => acc + i.qtyTarget,
              0,
            );
            const totalSelesai = target.items.reduce(
              (acc: number, i: any) => acc + i.qtySelesai,
              0,
            );
            const totalSisa = totalTarget - totalSelesai;

            return (
              <div
                key={target.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-amber-400 block">
                        {target.targetCode}
                      </span>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(target.createdAt).toLocaleDateString("id-ID")}{" "}
                        • Op: {target.operatorName}
                      </p>
                    </div>

                    <div>
                      {target.status === "started" && (
                        <span className="flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-400">
                          <PlayCircle className="h-3 w-3" /> STARTED
                        </span>
                      )}
                      {target.status === "finished" && (
                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> FINISHED
                        </span>
                      )}
                      {target.status === "canceled" && (
                        <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400">
                          <XCircle className="h-3 w-3" /> CANCELED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-center">
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">
                        Target Qty
                      </span>
                      <span className="text-xs font-bold text-zinc-200">
                        {totalTarget} pcs
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">
                        Selesai
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {totalSelesai} pcs
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">
                        Sisa
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {totalSisa} pcs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {target.status === "started" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSelectedTargetForStatus({
                              id: target.id,
                              newStatus: "finished",
                            })
                          }
                          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
                        >
                          Selesaikan SPK
                        </button>
                        <button
                          onClick={() =>
                            setSelectedTargetForStatus({
                              id: target.id,
                              newStatus: "canceled",
                            })
                          }
                          className="rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold text-red-400 hover:bg-red-500/20 active:scale-95 cursor-pointer"
                        >
                          Batalkan SPK
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-zinc-500">
                        Status final
                      </span>
                    )}

                    <button
                      onClick={() => toggleAccordion(target.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <span>Items ({target.items.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-3 space-y-2">
                    {target.items.map((item: any) => {
                      const sisaItem = item.qtyTarget - item.qtySelesai;

                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 p-2.5 text-xs"
                        >
                          <div>
                            <p className="font-bold text-zinc-200">
                              {item.variant?.product?.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {item.variant?.color?.name} -{" "}
                              {item.variant?.size?.name}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-[9px] text-zinc-500 block uppercase">
                                Target / Selesai
                              </span>
                              <span className="font-bold text-zinc-300">
                                {item.qtyTarget} /{" "}
                                <span className="text-emerald-400">
                                  {item.qtySelesai}
                                </span>
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-zinc-500 block uppercase">
                                Sisa
                              </span>
                              <span className="font-extrabold text-amber-400">
                                {sisaItem} pcs
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* FORM MODAL SPK */}
      {showSPKModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold text-zinc-100">
                  SPK Target Potong Baru
                </h3>
              </div>
              <button
                onClick={() => setShowSPKModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                Judul / Catatan SPK
              </label>
              <input
                type="text"
                placeholder="Misal: Pemotongan Gamis Abaya Kloter 1"
                value={spkTitle}
                onChange={(e) => setSpkTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Daftar Item Target ({tempItems.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowPickerModal(true)}
                  className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:bg-amber-500/20 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Tambah Varian</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {tempItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                    Belum ada varian produk ditambahkan.
                  </div>
                ) : (
                  tempItems.map((item) => (
                    <div
                      key={item.variantId}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-zinc-200">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {item.colorName} - {item.sizeName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-[9px] text-zinc-500 block">
                            Qty Target
                          </span>
                          <input
                            type="number"
                            value={item.qtyTarget}
                            onChange={(e) =>
                              handleInlineQtyChange(
                                item.variantId,
                                e.target.value,
                              )
                            }
                            className="w-16 rounded-lg border border-amber-500/50 bg-zinc-900 px-2 py-1 text-center font-bold text-amber-400 focus:outline-none"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTempItem(item.variantId)}
                          className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-3">
              <button
                disabled={isPending || tempItems.length === 0}
                onClick={handleSubmitSPK}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-zinc-950 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Terbitkan SPK Target Potong</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL PICKER VARIAN (MULTI-WORD LIVE SEARCH) */}
      {showPickerModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-zinc-100">
                Cari Varian Produk
              </h3>
              <button
                onClick={() => setShowPickerModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Input Live Search Multi-Word */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Misal: Gamis Abaya XL Red..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* List Result */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPickerVariants.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-6">
                  Varian tidak ditemukan. Cobalah kata kunci lain.
                </div>
              ) : (
                filteredPickerVariants.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVariantFromPicker(v)}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2.5 text-xs transition-all hover:border-amber-500/50 hover:bg-amber-500/10 cursor-pointer active:scale-95"
                  >
                    <div>
                      <p className="font-bold text-zinc-200">{v.productName}</p>
                      <p className="text-[10px] text-zinc-400">
                        {v.colorName} - {v.sizeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block">
                        Stok Terkini
                      </span>
                      <span className="font-bold text-amber-400">
                        {v.stock} pcs
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG STATUS */}
      <ConfirmDialog
        isOpen={!!selectedTargetForStatus}
        onClose={() => setSelectedTargetForStatus(null)}
        onConfirm={handleConfirmStatusChange}
        title={
          selectedTargetForStatus?.newStatus === "finished"
            ? "Selesaikan SPK Target Potong?"
            : "Batalkan SPK Target Potong?"
        }
        description={
          selectedTargetForStatus?.newStatus === "finished"
            ? "Status SPK akan diubah menjadi FINISHED."
            : "Status SPK akan diubah menjadi CANCELED."
        }
        confirmText="Ya, Ubah Status"
        cancelText="Batal"
        variant={
          selectedTargetForStatus?.newStatus === "finished" ? "info" : "danger"
        }
        isLoading={isPending}
      />
    </div>
  );
}
