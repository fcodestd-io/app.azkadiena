"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useTransition,
} from "react";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  getGoodsOutList,
  getGoodsOutFormOptions,
  createGoodsOutTransaction,
} from "./action";
import {
  PackageMinus,
  Search,
  X,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Save,
  ShoppingBag,
  Calendar,
  User,
  QrCode,
  Camera,
  History,
} from "lucide-react";

type TempItem = {
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  sku: string;
  barcode: string;
  stockBefore: number;
  qty: number;
};

export default function BarangKeluarPage() {
  const [goodsOutList, setGoodsOutList] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Utama
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState("");
  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  // Webcam Scanner State (Inline)
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedTimeRef = useRef<number>(0);

  // Sub-Modal Live Search Picker State
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
        getGoodsOutList(),
        getGoodsOutFormOptions(),
      ]);
      setGoodsOutList(listRes);
      setMarketplaces(formOpts.marketplaceList);
      setVariantOptions(formOpts.flatVariants);
    } catch {
      toast.error("Gagal memuat data barang keluar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-Word Live Search Filter (spasi delimiter)
  const filteredPickerVariants = useMemo(() => {
    if (!searchQuery.trim()) return variantOptions;
    const keywords = searchQuery.toLowerCase().trim().split(/\s+/);
    return variantOptions.filter((item) =>
      keywords.every((kw) => item.searchKey.includes(kw)),
    );
  }, [variantOptions, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedReceipts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addVariantToTempList = (variant: any) => {
    setTempItems((prev) => {
      const index = prev.findIndex((i) => i.variantId === variant.id);
      if (index >= 0) {
        const updated = [...prev];
        const newQty = updated[index].qty + 1;
        if (newQty > variant.stock) {
          toast.warning(
            `Qty melebihi stok yang tersedia (${variant.stock} pcs).`,
          );
          return prev;
        }
        updated[index].qty = newQty;
        toast.info(
          `Jumlah ${variant.productName} bertambah menjadi ${newQty} pcs.`,
        );
        return updated;
      }

      if (variant.stock < 1) {
        toast.warning("Stok varian produk ini habis (0 pcs).");
        return prev;
      }

      toast.success(
        `${variant.productName} (${variant.colorName} - ${variant.sizeName}) ditambahkan.`,
      );
      return [
        ...prev,
        {
          variantId: variant.id,
          productName: variant.productName,
          colorName: variant.colorName,
          sizeName: variant.sizeName,
          sku: variant.sku,
          barcode: variant.barcode,
          stockBefore: variant.stock,
          qty: 1,
        },
      ];
    });
  };

  const handleQtyChange = (variantId: string, val: string) => {
    const qty = parseInt(val, 10) || 0;
    setTempItems((prev) =>
      prev.map((item) => {
        if (item.variantId === variantId) {
          if (qty > item.stockBefore) {
            toast.warning(
              `Maksimal qty barang keluar adalah ${item.stockBefore} pcs.`,
            );
            return { ...item, qty: item.stockBefore };
          }
          return { ...item, qty };
        }
        return item;
      }),
    );
  };

  const handleRemoveTempItem = (variantId: string) => {
    setTempItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  // ------------------------------------------------------------------
  // WEBCAM SCANNER SAFE CLEANUP LOGIC
  // ------------------------------------------------------------------
  const stopScanner = () => {
    try {
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      console.error("Error penutupan kamera:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const startScanner = async () => {
    stopScanner();
    setIsScanning(true);

    try {
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      if (videoRef.current) {
        await codeReader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) {
              const now = Date.now();
              if (now - lastScannedTimeRef.current < 1500) {
                return;
              }
              lastScannedTimeRef.current = now;

              const scannedBarcode = result.getText();
              const matchedVariant = variantOptions.find(
                (v) => v.barcode === scannedBarcode || v.sku === scannedBarcode,
              );

              if (matchedVariant) {
                addVariantToTempList(matchedVariant);
              } else {
                toast.error(`Barcode/SKU "${scannedBarcode}" tidak ditemukan.`);
              }
            }
          },
        );
      }
    } catch (err) {
      console.error("Gagal memulai kamera:", err);
      toast.error("Gagal membuka kamera. Pastikan izin kamera aktif.");
      setIsScanning(false);
    }
  };

  const toggleScannerView = () => {
    if (showScanner) {
      stopScanner();
      setShowScanner(false);
    } else {
      setShowScanner(true);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Submit Transaksi Barang Keluar
  const handleSubmitGoodsOut = () => {
    if (!selectedMarketplaceId) {
      toast.warning("Pilih marketplace / toko tujuan.");
      return;
    }
    if (tempItems.length === 0) {
      toast.warning("Tambahkan minimal satu varian ke list barang keluar.");
      return;
    }

    startTransition(async () => {
      try {
        await createGoodsOutTransaction({
          marketplaceId: selectedMarketplaceId,
          items: tempItems.map((i) => ({
            productVariantId: i.variantId,
            qty: i.qty,
          })),
        });

        toast.success("Barang keluar berhasil diproses & stok berkurang!");
        setSelectedMarketplaceId("");
        setTempItems([]);
        stopScanner();
        setShowScanner(false);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Gagal memproses barang keluar");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <PackageMinus className="h-5 w-5 text-sky-400" />
          Barang Keluar
        </h1>
        <p className="text-[11px] text-zinc-400">
          Pengiriman stok ke marketplace / toko
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. FORM UTAMA PENGELUARAN BARANG (LANGSUNG TAMPIL INLINE)           */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-4 shadow-xl">
        <h2 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
          Form Pengeluaran Barang
        </h2>

        {/* Input Select Marketplace */}
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
            Pilih Marketplace / Saluran Toko *
          </label>
          <select
            value={selectedMarketplaceId}
            onChange={(e) => setSelectedMarketplaceId(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-sky-500/50 focus:outline-none"
          >
            <option value="">-- Pilih Saluran Penjualan --</option>
            {marketplaces.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-300 hover:border-sky-500/40 cursor-pointer active:scale-95 transition-all"
          >
            <Search className="h-3.5 w-3.5 text-sky-400" />
            <span>Cari Produk (Search)</span>
          </button>

          <button
            type="button"
            onClick={toggleScannerView}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              showScanner
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-sky-500/40 bg-sky-500/10 text-sky-400"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{showScanner ? "Tutup Kamera" : "Scan Barcode"}</span>
          </button>
        </div>

        {/* INLINE WEBCAM SCANNER (Render di atas List Items) */}
        {showScanner && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-sky-400" /> Pemindai Barcode
                Kamera
              </span>
              <button
                type="button"
                onClick={toggleScannerView}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video Viewfinder Persegi Panjang Horizontal */}
            <div className="relative overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-900 h-44 flex items-center justify-center">
              <video ref={videoRef} className="h-full w-full object-cover" />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                <div className="w-full h-20 border-2 border-sky-400/80 rounded-lg relative bg-sky-500/5 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                  {isScanning && (
                    <div className="absolute inset-x-0 h-0.5 bg-sky-400 animate-pulse top-1/2 -translate-y-1/2 shadow-[0_0_8px_#38bdf8]" />
                  )}
                </div>
              </div>
            </div>

            {/* Control Tombol Scan */}
            <div>
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2 text-xs font-bold text-zinc-950 active:scale-95 cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Mulai Pemindaian Kamera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopScanner}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Hentikan Pemindaian</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* DAFTAR ITEMS TERPILIH */}
        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">
              Items Barang Keluar ({tempItems.length})
            </span>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {tempItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                Belum ada item ditambahkan. Gunakan tombol Search atau Scan
                Barcode di atas.
              </div>
            ) : (
              tempItems.map((item) => {
                const stockAfter = item.stockBefore - item.qty;

                return (
                  <div
                    key={item.variantId}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs"
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
                        className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

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
                          Qty Keluar
                        </span>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) =>
                            handleQtyChange(item.variantId, e.target.value)
                          }
                          className="w-full rounded-lg border border-sky-500/50 bg-zinc-900 px-2 py-1 text-center font-bold text-sky-400 focus:outline-none"
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 block uppercase">
                          Stok Sisa
                        </span>
                        <span className="text-xs font-extrabold text-amber-400">
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
            onClick={handleSubmitGoodsOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-xs font-bold text-zinc-950 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-sky-500/20"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Simpan Pengeluaran Barang</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. LOG RIWAYAT BARANG KELUAR                                         */}
      {/* ==================================================================== */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <History className="h-3.5 w-3.5 text-amber-400" /> Log Riwayat Barang
          Keluar
        </h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
          </div>
        ) : goodsOutList.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
            Belum ada riwayat pengeluaran barang.
          </div>
        ) : (
          <div className="space-y-3">
            {goodsOutList.map((receipt) => {
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
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-sky-400 block">
                          {receipt.outCode}
                        </span>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <ShoppingBag className="h-3 w-3 text-zinc-500" />{" "}
                          {receipt.marketplace?.name}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase block">
                          Total Keluar
                        </span>
                        <span className="text-xs font-extrabold text-red-400">
                          -{totalQty} pcs
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/60 pt-2">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" /> Op: {receipt.operatorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />{" "}
                        {new Date(receipt.createdAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </span>
                    </div>

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
                          <span className="font-extrabold text-red-400">
                            -{item.qty} pcs
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
      </div>

      {/* ==================================================================== */}
      {/* SUB-MODAL LIVE SEARCH PICKER VARIAN                                  */}
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

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Misal: Gamis Abaya XL Red..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-sky-500/50 focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPickerVariants.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-6">
                  Varian produk tidak ditemukan.
                </div>
              ) : (
                filteredPickerVariants.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      addVariantToTempList(v);
                      setShowPicker(false);
                    }}
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2.5 text-xs transition-all hover:border-sky-500/50 hover:bg-sky-500/10 cursor-pointer active:scale-95"
                  >
                    <div>
                      <p className="font-bold text-zinc-200">{v.productName}</p>
                      <p className="text-[10px] text-zinc-400">
                        {v.colorName} - {v.sizeName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-zinc-500 block">
                        Stok Sedia
                      </span>
                      <span className="font-bold text-sky-400">
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
