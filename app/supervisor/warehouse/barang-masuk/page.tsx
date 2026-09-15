"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import {
  getGoodsInList,
  getGoodsInFormOptions,
  createGoodsInTransaction,
} from "./action";
import {
  PackagePlus,
  Plus,
  Search,
  X,
  Package,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  Building2,
  Scissors,
  Calendar,
  User,
} from "lucide-react";

type TempItem = {
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  sku: string;
  stockBefore: number;
  qty: number;
};

export default function BarangMasukPage() {
  const [goodsInList, setGoodsInList] = useState<any[]>([]);
  const [confections, setConfections] = useState<any[]>([]);
  const [cuttingTargets, setCuttingTargets] = useState<any[]>([]);
  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Header State
  const [showModal, setShowModal] = useState(false);
  const [selectedConfectionId, setSelectedConfectionId] = useState("");
  const [selectedCuttingTargetId, setSelectedCuttingTargetId] = useState("");
  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  // Sub-Modal Picker State
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [expandedReceipts, setExpandedReceipts] = useState<
    Record<string, boolean>
  >({});
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    try {
      const [listRes, formOpts] = await Promise.all([
        getGoodsInList(),
        getGoodsInFormOptions(),
      ]);
      setGoodsInList(listRes);
      setConfections(formOpts.confectionList);
      setCuttingTargets(formOpts.activeCuttingTargets);
      setVariantOptions(formOpts.flatVariants);
    } catch {
      toast.error("Gagal memuat data barang masuk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // MULTI-WORD LIVE SEARCH FILTER (e.g., "Abaya XL Red")
  const filteredPickerVariants = useMemo(() => {
    if (!searchQuery.trim()) return variantOptions;

    // Pecah kata kunci pencarian berdasarkan spasi
    const keywords = searchQuery.toLowerCase().trim().split(/\s+/);

    return variantOptions.filter((item) =>
      // Setiap kata kunci harus ada di dalam searchKey
      keywords.every((kw) => item.searchKey.includes(kw)),
    );
  }, [variantOptions, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedReceipts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Tambah Varian dari Sub-Modal Picker
  const handleSelectVariantFromPicker = (variant: any) => {
    const isExist = tempItems.some((item) => item.variantId === variant.id);
    if (isExist) {
      toast.warning("Varian produk ini sudah ada di dalam list penerimaan.");
      return;
    }

    setTempItems((prev) => [
      ...prev,
      {
        variantId: variant.id,
        productName: variant.productName,
        colorName: variant.colorName,
        sizeName: variant.sizeName,
        sku: variant.sku,
        stockBefore: variant.stock,
        qty: 1, // Default Tambah 1 pcs
      },
    ]);

    setShowPicker(false);
    toast.success(
      `${variant.productName} (${variant.colorName} - ${variant.sizeName}) ditambahkan.`,
    );
  };

  // Inline Edit Qty
  const handleQtyChange = (variantId: string, val: string) => {
    const qty = parseInt(val, 10) || 0;
    setTempItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, qty } : item,
      ),
    );
  };

  const handleRemoveTempItem = (variantId: string) => {
    setTempItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  // Submit Penerimaan Barang Masuk
  const handleSubmitGoodsIn = () => {
    if (!selectedConfectionId) {
      toast.warning("Pilih konveksi penjahit / pengirim.");
      return;
    }
    if (tempItems.length === 0) {
      toast.warning("Tambahkan minimal satu varian ke list barang masuk.");
      return;
    }

    startTransition(async () => {
      try {
        await createGoodsInTransaction({
          confectionId: selectedConfectionId,
          cuttingTargetId: selectedCuttingTargetId || null,
          items: tempItems.map((i) => ({
            productVariantId: i.variantId,
            qty: i.qty,
          })),
        });

        toast.success("Barang masuk berhasil dicatat dan stok diperbarui!");
        setShowModal(false);
        setSelectedConfectionId("");
        setSelectedCuttingTargetId("");
        setTempItems([]);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Gagal mencatat barang masuk");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-emerald-400" />
            Barang Masuk
          </h1>
          <p className="text-[11px] text-zinc-400">
            Penerimaan setoran produk konveksi
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Terima Barang</span>
        </button>
      </div>

      {/* List Riwayat Penerimaan Barang */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : goodsInList.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
          Belum ada riwayat penerimaan barang masuk.
        </div>
      ) : (
        <div className="space-y-3">
          {goodsInList.map((receipt) => {
            const isExpanded = !!expandedReceipts[receipt.id];
            const totalQty = receipt.items.reduce(
              (acc: number, i: any) => acc + i.qty,
              0,
            );

            return (
              <div
                key={receipt.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                {/* Header Card */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-emerald-400 block">
                        {receipt.receiptCode}
                      </span>
                      <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3 text-zinc-500" />{" "}
                        {receipt.confection?.name}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 uppercase block">
                        Total Masuk
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        +{totalQty} pcs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> Op: {receipt.operatorName}
                    </span>
                    {receipt.cuttingTarget && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <Scissors className="h-3 w-3" /> SPK:{" "}
                        {receipt.cuttingTarget.targetCode}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />{" "}
                      {new Date(receipt.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>

                  {/* Toggle Accordion */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => toggleAccordion(receipt.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      <span>Detail Items ({receipt.items.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Items Detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-3 space-y-2">
                    {receipt.items.map((item: any) => (
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
                        <span className="font-extrabold text-emerald-400">
                          +{item.qty} pcs
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL FORM TERIMA BARANG MASUK                                       */}
      {/* ==================================================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <PackagePlus className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-100">
                  Form Penerimaan Barang Masuk
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Select Konveksi & SPK Target Potong */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Pilih Konveksi / Penjahit *
                </label>
                <select
                  value={selectedConfectionId}
                  onChange={(e) => setSelectedConfectionId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="">-- Pilih Konveksi Pengirim --</option>
                  {confections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (SPV: {c.supervisorName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
                  Penyelesaian SPK Target Potong (Opsional)
                </label>
                <select
                  value={selectedCuttingTargetId}
                  onChange={(e) => setSelectedCuttingTargetId(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500/50 focus:outline-none"
                >
                  <option value="">-- Tanpa Tautan SPK Target --</option>
                  {cuttingTargets.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.targetCode} ({ct.operatorName})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List Temporary Items */}
            <div className="flex-1 flex flex-col min-h-0 space-y-2 border-t border-zinc-800 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300">
                  Items Masuk ({tempItems.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Cari & Tambah Produk</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {tempItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                    Belum ada item ditambahkan.
                  </div>
                ) : (
                  tempItems.map((item) => {
                    const stockAfter = item.stockBefore + item.qty;

                    return (
                      <div
                        key={item.variantId}
                        className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-zinc-200">
                              {item.productName}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {item.colorName} - {item.sizeName}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTempItem(item.variantId)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Stok Terkini, Input Qty Masuk, Stok Sesudah */}
                        <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-zinc-800/50 items-center">
                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase">
                              Stok Terkini
                            </span>
                            <span className="text-xs font-bold text-zinc-400">
                              {item.stockBefore} pcs
                            </span>
                          </div>

                          <div>
                            <span className="text-[9px] text-zinc-500 block uppercase">
                              Qty Masuk
                            </span>
                            <input
                              type="number"
                              value={item.qty}
                              onChange={(e) =>
                                handleQtyChange(item.variantId, e.target.value)
                              }
                              className="w-full rounded-lg border border-emerald-500/50 bg-zinc-900 px-2 py-1 text-center font-bold text-emerald-400 focus:outline-none"
                            />
                          </div>

                          <div className="text-right">
                            <span className="text-[9px] text-zinc-500 block uppercase">
                              Stok Sesudah
                            </span>
                            <span className="text-xs font-extrabold text-emerald-400">
                              {stockAfter} pcs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="border-t border-zinc-800 pt-3">
              <button
                disabled={isPending || tempItems.length === 0}
                onClick={handleSubmitGoodsIn}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-zinc-950 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Simpan Penerimaan Barang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SUB-MODAL PICKER VARIAN PRODUK (MULTI-WORD LIVE SEARCH)              */}
      {/* ==================================================================== */}
      {showPicker && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-3 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-bold text-zinc-100">
                Cari Varian Produk
              </h3>
              <button
                onClick={() => setShowPicker(false)}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>

            {/* List Result */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPickerVariants.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-6">
                  Produk tidak ditemukan. Cobalah kata kunci lain.
                </div>
              ) : (
                filteredPickerVariants.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => handleSelectVariantFromPicker(v)}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2.5 text-xs transition-all hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer active:scale-95"
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
                      <span className="font-bold text-emerald-400">
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
    </div>
  );
}
