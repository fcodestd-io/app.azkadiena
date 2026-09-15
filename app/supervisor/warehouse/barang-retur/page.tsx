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
  getReturnList,
  getReturnFormOptions,
  createReturnTransaction,
} from "./action";
import {
  RotateCcw,
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
  History,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Camera,
  ScanLine,
} from "lucide-react";

type TempItem = {
  variantId: string;
  productName: string;
  colorName: string;
  sizeName: string;
  sku: string;
  barcode: string;
  stockBefore: number;
  qtyBagus: number;
  qtyCacat: number;
};

export default function BarangReturPage() {
  const [returnList, setReturnList] = useState<any[]>([]);
  const [marketplaces, setMarketplaces] = useState<any[]>([]);
  const [variantOptions, setVariantOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State Utama
  const [selectedMarketplaceId, setSelectedMarketplaceId] = useState("");
  const [tempItems, setTempItems] = useState<TempItem[]>([]);

  // Webcam Scanner State (Inline)
  // isScanning berarti "kamera aktif/preview terbuka", BUKAN sedang
  // auto-decode terus-menerus. Decode barcode hanya terjadi saat tombol
  // "Tangkap & Scan" ditekan (lihat handleCaptureAndScan).
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
        getReturnList(),
        getReturnFormOptions(),
      ]);
      setReturnList(listRes);
      setMarketplaces(formOpts.marketplaceList);
      setVariantOptions(formOpts.flatVariants);
    } catch {
      toast.error("Gagal memuat data barang retur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Multi-Word Live Search Filter
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
      const isExist = prev.some((i) => i.variantId === variant.id);
      if (isExist) {
        toast.warning("Varian produk ini sudah ada di dalam list retur.");
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
          qtyBagus: 1, // Default Qty Bagus = 1
          qtyCacat: 0,
        },
      ];
    });
  };

  const handleQtyChange = (
    variantId: string,
    field: "qtyBagus" | "qtyCacat",
    val: string,
  ) => {
    const qty = parseInt(val, 10) || 0;
    setTempItems((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, [field]: qty < 0 ? 0 : qty }
          : item,
      ),
    );
  };

  const handleRemoveTempItem = (variantId: string) => {
    setTempItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  // ------------------------------------------------------------------
  // WEBCAM SCANNER: BUKA PREVIEW KAMERA SAJA (TIDAK AUTO-DECODE)
  // ------------------------------------------------------------------
  const stopScanner = () => {
    try {
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

  // Hanya membuka stream kamera untuk preview. Tidak ada loop decode di sini
  // sama sekali — barcode baru dibaca saat user menekan tombol scan.
  const startScanner = async () => {
    stopScanner();

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } },
          audio: false,
        });
      } catch {
        // Fallback ke kamera belakang "ideal" jika exact: environment gagal
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
    } catch (err) {
      console.error("Gagal memulai kamera:", err);
      toast.error("Gagal membuka kamera. Pastikan izin kamera aktif.");
      setIsScanning(false);
    }
  };

  // Dipanggil HANYA saat tombol "Tangkap & Scan" ditekan. Mengambil satu
  // frame dari video yang sedang preview, lalu mencoba decode barcode dari
  // frame tersebut satu kali (bukan terus-menerus).
  const handleCaptureAndScan = () => {
    if (!videoRef.current || !canvasRef.current || !codeReaderRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastScannedTimeRef.current < 700) {
      return;
    }
    lastScannedTimeRef.current = now;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      toast.warning("Kamera belum siap, coba lagi sebentar.");
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    try {
      const result = codeReaderRef.current.decodeFromCanvas(canvas);
      const scannedBarcode = result.getText();
      const matchedVariant = variantOptions.find(
        (v) => v.barcode === scannedBarcode || v.sku === scannedBarcode,
      );

      if (matchedVariant) {
        addVariantToTempList(matchedVariant);
      } else {
        toast.error(`Barcode/SKU "${scannedBarcode}" tidak ditemukan.`);
      }
    } catch (err) {
      toast.warning(
        "Barcode tidak terdeteksi. Posisikan barcode di tengah bingkai lalu tekan tombol Scan lagi.",
      );
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

  // Submit Transaksi Retur
  const handleSubmitReturn = () => {
    if (!selectedMarketplaceId) {
      toast.warning("Pilih asal marketplace retur.");
      return;
    }
    if (tempItems.length === 0) {
      toast.warning("Tambahkan minimal satu item ke list retur.");
      return;
    }

    const hasInvalidItem = tempItems.every(
      (item) => item.qtyBagus === 0 && item.qtyCacat === 0,
    );
    if (hasInvalidItem) {
      toast.warning(
        "Isi kuantitas retur bagus atau retur cacat minimal 1 pcs.",
      );
      return;
    }

    startTransition(async () => {
      try {
        await createReturnTransaction({
          marketplaceId: selectedMarketplaceId,
          items: tempItems.map((i) => ({
            productVariantId: i.variantId,
            qtyBagus: i.qtyBagus,
            qtyCacat: i.qtyCacat,
          })),
        });

        toast.success("Barang retur berhasil diproses!");
        setSelectedMarketplaceId("");
        setTempItems([]);
        stopScanner();
        setShowScanner(false);
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Gagal memproses barang retur");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div>
        <h1 className="text-base font-bold text-zinc-100 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-rose-400" />
          Barang Retur
        </h1>
        <p className="text-[11px] text-zinc-400">
          Penerimaan retur produk dari marketplace
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 1. FORM UTAMA PENGEMBALIAN BARANG RETUR                              */}
      {/* ==================================================================== */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-4 shadow-xl">
        <h2 className="text-xs font-bold text-rose-400 uppercase tracking-wider">
          Form Retur Barang
        </h2>

        {/* Input Marketplace */}
        <div>
          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">
            Pilih Asal Marketplace / Toko *
          </label>
          <select
            value={selectedMarketplaceId}
            onChange={(e) => setSelectedMarketplaceId(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 focus:border-rose-500/50 focus:outline-none"
          >
            <option value="">-- Pilih Saluran Penjualan --</option>
            {marketplaces.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Live Search & Scanner Camera */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPicker(true)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 py-2.5 text-xs font-semibold text-zinc-300 hover:border-rose-500/40 cursor-pointer active:scale-95 transition-all"
          >
            <Search className="h-3.5 w-3.5 text-rose-400" />
            <span>Cari Produk (Search)</span>
          </button>

          <button
            type="button"
            onClick={toggleScannerView}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              showScanner
                ? "border-red-500/40 bg-red-500/10 text-red-400"
                : "border-rose-500/40 bg-rose-500/10 text-rose-400"
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{showScanner ? "Tutup Kamera" : "Scan Barcode"}</span>
          </button>
        </div>

        {/* INLINE WEBCAM SCANNER */}
        {showScanner && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-rose-400" /> Pemindai
                Barcode Kamera
              </span>
              <button
                type="button"
                onClick={toggleScannerView}
                className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Viewfinder Persegi Panjang */}
            <div className="relative overflow-hidden rounded-xl border-2 border-zinc-800 bg-zinc-900 h-44 flex items-center justify-center">
              <video ref={videoRef} className="h-full w-full object-cover" />
              {/* Canvas tersembunyi, dipakai hanya untuk menangkap 1 frame saat tombol Scan ditekan */}
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                <div className="w-full h-20 border-2 border-rose-400/80 rounded-lg bg-rose-500/5 shadow-[0_0_15px_rgba(251,113,133,0.2)]" />
              </div>

              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/60">
                  <span className="text-[11px] text-zinc-400">
                    Kamera belum aktif
                  </span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-zinc-500 text-center">
              Posisikan barcode di dalam bingkai, lalu tekan tombol "Tangkap &
              Scan" untuk membaca.
            </p>

            <div className="space-y-2">
              {!isScanning ? (
                <button
                  type="button"
                  onClick={startScanner}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2 text-xs font-bold text-zinc-950 active:scale-95 cursor-pointer shadow-md shadow-rose-500/20"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Buka Kamera</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCaptureAndScan}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-zinc-950 active:scale-95 cursor-pointer shadow-md shadow-rose-500/20"
                  >
                    <ScanLine className="h-4 w-4" />
                    <span>Tangkap &amp; Scan Barcode</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopScanner}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 active:scale-95 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Hentikan Pemindaian</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* List Temporary Items Retur */}
        <div className="space-y-2 border-t border-zinc-800 pt-3">
          <span className="text-xs font-bold text-zinc-300">
            Daftar Item Retur ({tempItems.length})
          </span>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {tempItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center text-xs text-zinc-500">
                Belum ada item retur ditambahkan. Gunakan Search atau Scan
                Barcode di atas.
              </div>
            ) : (
              tempItems.map((item) => {
                const newStockPrediction = item.stockBefore + item.qtyBagus;

                return (
                  <div
                    key={item.variantId}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs"
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

                    {/* Mode Dual Input: Retur Bagus & Retur Cacat */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 space-y-1">
                        <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Retur Bagus
                        </span>
                        <input
                          type="number"
                          value={item.qtyBagus}
                          onChange={(e) =>
                            handleQtyChange(
                              item.variantId,
                              "qtyBagus",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-emerald-500/40 bg-zinc-900 px-2 py-1 text-center font-bold text-emerald-400 focus:outline-none"
                        />
                        <span className="text-[8px] text-zinc-400 block text-center">
                          +Stok Utama ({newStockPrediction} pcs)
                        </span>
                      </div>

                      <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-2 space-y-1">
                        <span className="text-[9px] font-bold text-rose-400 flex items-center gap-1 uppercase">
                          <AlertTriangle className="h-3 w-3" /> Retur Cacat
                        </span>
                        <input
                          type="number"
                          value={item.qtyCacat}
                          onChange={(e) =>
                            handleQtyChange(
                              item.variantId,
                              "qtyCacat",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-md border border-rose-500/40 bg-zinc-900 px-2 py-1 text-center font-bold text-rose-400 focus:outline-none"
                        />
                        <span className="text-[8px] text-zinc-400 block text-center">
                          Tidak Tambah Stok
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
            onClick={handleSubmitReturn}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-500 py-2.5 text-xs font-bold text-zinc-950 active:scale-95 disabled:opacity-50 cursor-pointer shadow-md shadow-rose-500/20"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>Simpan Penerimaan Retur</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. LOG RIWAYAT BARANG RETUR                                          */}
      {/* ==================================================================== */}
      <div className="space-y-3 pt-2">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <History className="h-3.5 w-3.5 text-amber-400" /> Log Riwayat Retur
        </h2>

        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-rose-400" />
          </div>
        ) : returnList.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-xs text-zinc-400">
            Belum ada dokumen penerimaan retur.
          </div>
        ) : (
          <div className="space-y-3">
            {returnList.map((receipt) => {
              const isExpanded = !!expandedReceipts[receipt.id];

              const totalBagus = receipt.items.reduce(
                (acc: number, i: any) => acc + i.qtyBagus,
                0,
              );
              const totalCacat = receipt.items.reduce(
                (acc: number, i: any) => acc + i.qtyCacat,
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
                        <span className="text-xs font-extrabold text-rose-400 block">
                          {receipt.returnCode}
                        </span>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <ShoppingBag className="h-3 w-3 text-zinc-500" />{" "}
                          {receipt.marketplace?.name}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block">
                            Bagus
                          </span>
                          <span className="text-xs font-extrabold text-emerald-400">
                            +{totalBagus} pcs
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block">
                            Cacat
                          </span>
                          <span className="text-xs font-extrabold text-rose-400">
                            {totalCacat} pcs
                          </span>
                        </div>
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
                          <div className="text-right flex items-center gap-3">
                            <span className="font-bold text-emerald-400">
                              Bagus: +{item.qtyBagus}
                            </span>
                            <span className="font-bold text-rose-400">
                              Cacat: {item.qtyCacat}
                            </span>
                          </div>
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
                Cari Varian Produk Retur
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
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-rose-500/50 focus:outline-none"
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
                    className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2.5 text-xs transition-all hover:border-rose-500/50 hover:bg-rose-500/10 cursor-pointer active:scale-95"
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
                      <span className="font-bold text-rose-400">
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
