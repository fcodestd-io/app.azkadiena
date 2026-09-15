"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  getAllOpnameProducts,
  getVariantMovements,
  getOpnameHistory,
  submitStockOpname,
  OpnameInputItem,
} from "./action";
import {
  ClipboardCheck,
  History,
  ChevronDown,
  ChevronUp,
  History as CardStockIcon,
  X,
  Save,
  Loader2,
  Package,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from "lucide-react";

export default function StockOpnamePage() {
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [isOpnameActive, setIsOpnameActive] = useState(false);
  const [opnameInputs, setOpnameInputs] = useState<Record<string, number>>({});
  const [expandedProducts, setExpandedProducts] = useState<
    Record<string, boolean>
  >({});

  // Dialog & Modal States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedVariantForModal, setSelectedVariantForModal] = useState<
    any | null
  >(null);
  const [movementsData, setMovementsData] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isPending, startTransition] = useTransition();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await getAllOpnameProducts();
      setProductsData(data);
    } catch {
      toast.error("Gagal memuat data produk gudang");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ------------------------------------------------------------------
  // MULTI-WORD CLIENT-SIDE SEARCH (e.g. "Gamis XL Red")
  // ------------------------------------------------------------------
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsData;

    // Pecah kata kunci pencarian berdasarkan spasi
    const keywords = searchQuery.toLowerCase().trim().split(/\s+/);

    return productsData
      .map((product) => {
        // Filter varian yang memenuhi SEMUA kata kunci pencarian
        const matchingVariants = product.variants.filter((variant: any) => {
          const searchKey =
            `${product.name} ${variant.size?.name || ""} ${variant.color?.name || ""} ${variant.sku}`.toLowerCase();
          return keywords.every((kw) => searchKey.includes(kw));
        });

        if (matchingVariants.length > 0) {
          return {
            ...product,
            variants: matchingVariants,
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [productsData, searchQuery]);

  // Otomatis Expand Accordion saat pengguna melakukan pencarian
  useEffect(() => {
    if (searchQuery.trim()) {
      const autoExpanded: Record<string, boolean> = {};
      filteredProducts.forEach((p: any) => {
        if (p) autoExpanded[p.id] = true;
      });
      setExpandedProducts(autoExpanded);
    }
  }, [searchQuery, filteredProducts]);

  const toggleAccordion = (id: string) => {
    setExpandedProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleQtyChange = (variantId: string, val: string) => {
    const num = val === "" ? 0 : parseInt(val, 10);
    setOpnameInputs((prev) => ({
      ...prev,
      [variantId]: isNaN(num) ? 0 : num,
    }));
  };

  const handleOpenKartuStok = async (variant: any, productName: string) => {
    setSelectedVariantForModal({ ...variant, productName });
    setLoadingMovements(true);
    try {
      const data = await getVariantMovements(variant.id);
      setMovementsData(data);
    } catch {
      toast.error("Gagal memuat kartu stok");
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleOpenHistory = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const data = await getOpnameHistory();
      setHistoryData(data);
    } catch {
      toast.error("Gagal memuat riwayat opname");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleConfirmSubmit = () => {
    const itemsToSubmit: OpnameInputItem[] = [];

    productsData.forEach((prod) => {
      prod.variants.forEach((v: any) => {
        if (opnameInputs[v.id] !== undefined) {
          const qtySebelum = v.stock;
          const qtySesudah = opnameInputs[v.id];
          const selisih = qtySesudah - qtySebelum;

          if (selisih !== 0) {
            itemsToSubmit.push({
              productVariantId: v.id,
              qtySebelum,
              qtySesudah,
              selisih,
            });
          }
        }
      });
    });

    if (itemsToSubmit.length === 0) {
      toast.warning("Tidak ada selisih stok yang diubah.");
      setIsConfirmOpen(false);
      return;
    }

    startTransition(async () => {
      try {
        await submitStockOpname({
          title: `Stock Opname ${new Date().toLocaleDateString("id-ID")}`,
          items: itemsToSubmit,
        });
        toast.success("Stock Opname berhasil disimpan!");
        setIsConfirmOpen(false);
        setIsOpnameActive(false);
        setOpnameInputs({});
        loadProducts();
      } catch (err: any) {
        toast.error(err.message || "Gagal menyimpan stock opname");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-purple-400" />
            Stock Opname
          </h1>
          <p className="text-[11px] text-zinc-400">Penyesuaian stok produk</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenHistory}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-all active:scale-95 cursor-pointer"
          >
            <History className="h-3.5 w-3.5 text-amber-400" />
            <span>Riwayat</span>
          </button>

          <button
            onClick={() => {
              setIsOpnameActive(!isOpnameActive);
              setOpnameInputs({});
            }}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
              isOpnameActive
                ? "border border-red-500/30 bg-red-500/10 text-red-400"
                : "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20"
            }`}
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            <span>{isOpnameActive ? "Batal" : "Mulai Opname"}</span>
          </button>
        </div>
      </div>

      {/* Live Multi-Word Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Misal: Gamis Abaya XL Red..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Banner Submit Opname */}
      {isOpnameActive && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400">
          <p className="text-xs font-medium">Mode Input Opname Aktif.</p>
          <button
            onClick={() => setIsConfirmOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-zinc-950 active:scale-95 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Simpan</span>
          </button>
        </div>
      )}

      {/* Render Semua Produk & Accordion Varian */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
          Tidak ada produk yang cocok dengan pencarian.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product: any) => {
            const isExpanded = !!expandedProducts[product.id];
            const totalStockProduct = product.variants.reduce(
              (acc: number, v: any) => acc + v.stock,
              0,
            );

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"
              >
                <button
                  onClick={() => toggleAccordion(product.id)}
                  className="flex w-full items-center justify-between p-4 transition-colors hover:bg-zinc-800/50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                      <Package className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-zinc-100">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {product.variants.length} Varian Sedia
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                        Total Stok
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {totalStockProduct} pcs
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-3 space-y-2.5">
                    {product.variants.map((variant: any) => {
                      const qtySebelum = variant.stock;
                      const qtyAktual = opnameInputs[variant.id] ?? qtySebelum;
                      const selisih = qtyAktual - qtySebelum;

                      return (
                        <div
                          key={variant.id}
                          className="flex flex-col gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/90 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-zinc-200">
                                {variant.color?.name} - {variant.size?.name}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                SKU: {variant.sku}
                              </p>
                            </div>

                            <button
                              onClick={() =>
                                handleOpenKartuStok(variant, product.name)
                              }
                              className="flex items-center gap-1 rounded-lg border border-zinc-700/60 bg-zinc-800 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 active:scale-95 cursor-pointer"
                            >
                              <CardStockIcon className="h-3 w-3 text-purple-400" />
                              <span>Kartu Stok</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-800/50 items-center">
                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">
                                Stok Sistem
                              </span>
                              <span className="text-xs font-bold text-zinc-300">
                                {qtySebelum} pcs
                              </span>
                            </div>

                            <div>
                              <span className="text-[9px] text-zinc-500 uppercase block">
                                Stok Aktual
                              </span>
                              {isOpnameActive ? (
                                <input
                                  type="number"
                                  value={opnameInputs[variant.id] ?? qtySebelum}
                                  onChange={(e) =>
                                    handleQtyChange(variant.id, e.target.value)
                                  }
                                  className="w-full rounded-lg border border-emerald-500/50 bg-zinc-950 px-2 py-1 text-center text-xs font-bold text-emerald-400 focus:outline-none"
                                />
                              ) : (
                                <span className="text-xs font-bold text-zinc-300">
                                  {qtySebelum} pcs
                                </span>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-[9px] text-zinc-500 uppercase block">
                                Selisih
                              </span>
                              <span
                                className={`text-xs font-extrabold ${
                                  selisih === 0
                                    ? "text-zinc-500"
                                    : selisih > 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                }`}
                              >
                                {selisih > 0 ? `+${selisih}` : selisih} pcs
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

      {/* CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Simpan Stock Opname?"
        description="Perubahan stok aktual akan langsung memperbarui stok sistem utama dan dicatat ke kartu stok."
        confirmText="Simpan Penyesuaian"
        cancelText="Batal"
        variant="warning"
        isLoading={isPending}
      />

      {/* MODAL KARTU STOK */}
      {selectedVariantForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-100">
                  Kartu Stok Varian
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold">
                  {selectedVariantForModal.productName} (
                  {selectedVariantForModal.color?.name} -{" "}
                  {selectedVariantForModal.size?.name})
                </p>
              </div>
              <button
                onClick={() => setSelectedVariantForModal(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {loadingMovements ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              ) : movementsData.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-4">
                  Belum ada pergerakan stok.
                </p>
              ) : (
                movementsData.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {m.type === "in" && (
                        <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                      )}
                      {m.type === "out" && (
                        <ArrowUpRight className="h-4 w-4 text-red-400" />
                      )}
                      {m.type === "adjustment" && (
                        <RefreshCw className="h-4 w-4 text-amber-400" />
                      )}
                      <div>
                        <p className="font-bold text-zinc-200 capitalize">
                          {m.type}
                        </p>
                        <p className="text-[10px] text-zinc-500">
                          {new Date(m.createdAt).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-zinc-200 block">
                        {m.qty > 0 ? `+${m.qty}` : m.qty} pcs
                      </span>
                      <span className="text-[9px] text-zinc-500">
                        Stok: {m.stockBefore} &rarr; {m.stockAfter}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-xs font-bold text-zinc-100">
                  Riwayat Audit Opname
                </h3>
                <p className="text-[10px] text-zinc-400">
                  Dokumen penyesuaian tersimpan
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {loadingHistory ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              ) : historyData.length === 0 ? (
                <p className="text-center text-xs text-zinc-500 py-4">
                  Belum ada dokumen opname.
                </p>
              ) : (
                historyData.map((h: any) => (
                  <div
                    key={h.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                      <div>
                        <p className="font-bold text-emerald-400">
                          {h.adjustmentCode}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {h.title} • Op: {h.operatorName}
                        </p>
                      </div>
                      <span className="text-[9px] text-zinc-500">
                        {new Date(h.createdAt).toLocaleDateString("id-ID")}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {h.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-[11px] text-zinc-300"
                        >
                          <span>
                            {item.variant?.product?.name} (
                            {item.variant?.color?.name} -{" "}
                            {item.variant?.size?.name})
                          </span>
                          <span
                            className={`font-bold ${item.selisih > 0 ? "text-emerald-400" : "text-red-400"}`}
                          >
                            {item.selisih > 0
                              ? `+${item.selisih}`
                              : item.selisih}{" "}
                            pcs
                          </span>
                        </div>
                      ))}
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
