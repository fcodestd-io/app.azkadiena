"use client";

import {
  useState,
  useTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useReactToPrint } from "react-to-print";
import Barcode from "react-barcode";
import {
  createProductAction,
  updateProductAction,
  deleteProductAction,
  getStockMovementsByVariant,
  ActionState,
} from "./action";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  X,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Printer,
  History,
  QrCode,
  Tag,
  CheckSquare,
  Square,
} from "lucide-react";
import { toast } from "sonner";

interface VariantItem {
  id: string;
  sku: string;
  barcode: string;
  stock: number;
  size: { id: string; name: string };
  color: { id: string; name: string };
}

interface ProductItem {
  id: string;
  name: string;
  createdAt: Date;
  variants: VariantItem[];
}

interface PageClientProps {
  initialProducts: ProductItem[];
  hasMoreInitial: boolean;
  availableSizes: { id: string; name: string }[];
  availableColors: { id: string; name: string }[];
}

export function ProductPageClient({
  initialProducts,
  availableSizes,
  availableColors,
}: PageClientProps) {
  const [productsList, setProductsList] =
    useState<ProductItem[]>(initialProducts);
  const [isPending, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(
    null,
  );

  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [selectedColorIds, setSelectedColorIds] = useState<string[]>([]);

  const [printProduct, setPrintProduct] = useState<ProductItem | null>(null);

  const [historyVariant, setHistoryVariant] = useState<VariantItem | null>(
    null,
  );
  const [movements, setMovements] = useState<any[]>([]);
  const [movementsPage, setMovementsPage] = useState(1);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [hasMoreMovements, setHasMoreMovements] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);

  // Ref Khusus react-to-print
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcode-${printProduct?.name ?? "Produk"}`,
  });

  const [createState, createFormAction, isCreating] = useActionState<
    ActionState,
    FormData
  >(createProductAction, null);
  const [updateState, updateFormAction, isUpdating] = useActionState<
    ActionState,
    FormData
  >(updateProductAction, null);

  useEffect(() => {
    setProductsList(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    if (createState?.success) {
      toast.success(createState.message);
      setIsModalOpen(false);
      setSelectedSizeIds([]);
      setSelectedColorIds([]);
    } else if (createState?.message) {
      toast.error(createState.message);
    }
  }, [createState]);

  useEffect(() => {
    if (updateState?.success) {
      toast.success(updateState.message);
      setIsModalOpen(false);
      setSelectedProduct(null);
    } else if (updateState?.message) {
      toast.error(updateState.message);
    }
  }, [updateState]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productsList;
    const query = searchQuery.toLowerCase();

    return productsList.filter((p) => {
      const matchName = p.name.toLowerCase().includes(query);
      const matchVariant = p.variants.some(
        (v) =>
          v.sku.toLowerCase().includes(query) ||
          v.barcode.includes(query) ||
          v.size.name.toLowerCase().includes(query) ||
          v.color.name.toLowerCase().includes(query),
      );
      return matchName || matchVariant;
    });
  }, [productsList, searchQuery]);

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSizeSelect = (id: string) => {
    setSelectedSizeIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleColorSelect = (id: string) => {
    setSelectedColorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const openCreateModal = () => {
    setSelectedProduct(null);
    setSelectedSizeIds([]);
    setSelectedColorIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (product: ProductItem) => {
    setSelectedProduct(product);
    const activeSizes = Array.from(
      new Set(product.variants.map((v) => v.size.id)),
    );
    const activeColors = Array.from(
      new Set(product.variants.map((v) => v.color.id)),
    );

    setSelectedSizeIds(activeSizes);
    setSelectedColorIds(activeColors);
    setIsModalOpen(true);
  };

  const openHistoryModal = async (variant: VariantItem) => {
    setHistoryVariant(variant);
    setMovements([]);
    setMovementsPage(1);
    setLoadingMovements(true);

    const data = await getStockMovementsByVariant(variant.id, 1, 10);
    setMovements(data);
    setHasMoreMovements(data.length === 10);
    setLoadingMovements(false);
  };

  const loadMoreMovements = async () => {
    if (!historyVariant || loadingMovements || !hasMoreMovements) return;
    setLoadingMovements(true);
    const nextPage = movementsPage + 1;
    const data = await getStockMovementsByVariant(
      historyVariant.id,
      nextPage,
      10,
    );

    setMovements((prev) => [...prev, ...data]);
    setMovementsPage(nextPage);
    setHasMoreMovements(data.length === 10);
    setLoadingMovements(false);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteProductAction(deleteTarget.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message || "Gagal menghapus produk");
      }
      setDeleteTarget(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* CSS KHUSUS PENCETAKAN BARCODE RESI (INLINE STYLES FOR PRINT) */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 4mm;
            size: auto;
          }

          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }

          /* Sembunyikan seluruh UI web, modal backdrop, scrollbar, dll */
          body * {
            visibility: hidden !important;
          }

          /* Hanya tampilkan kontainer print-barcode-sheet */
          .print-barcode-sheet,
          .print-barcode-sheet * {
            visibility: visible !important;
          }

          .print-barcode-sheet {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .print-barcode-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
            width: 100% !important;
          }

          .barcode-card-item {
            border: 1px dashed #000000 !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            background: #ffffff !important;
            padding: 4px !important;
          }
        }
      `}</style>

      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Master Data Produk
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola katalog produk, kombinasi varian (Size & Color), barcode, dan
            kartu stok.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Produk</span>
        </button>
      </div>

      {/* Control Bar: Live Search */}
      <div className="relative w-full sm:w-80">
        <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-3.5 w-3.5 text-zinc-500" />
        <input
          type="text"
          placeholder="Cari produk / SKU / Barcode / Size / Warna..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-all"
        />
      </div>

      {/* Accordion Table List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 text-center text-xs text-zinc-500">
            Tidak ada produk yang ditemukan.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isExpanded = !!expandedIds[product.id];
            const totalStock = product.variants.reduce(
              (acc, v) => acc + v.stock,
              0,
            );

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md transition-all"
              >
                {/* Header Accordion */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/80 hover:bg-zinc-800/40 transition-colors">
                  <div
                    onClick={() => toggleAccordion(product.id)}
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-zinc-400" />
                    )}
                    <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-200">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {product.variants.length} Varian • Total Stok:{" "}
                        <span className="font-semibold text-emerald-400">
                          {totalStock} pcs
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPrintProduct(product)}
                      className="flex items-center space-x-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      title="Cetak Barcode Semua SKU"
                    >
                      <Printer className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="hidden sm:inline">Print Barcode</span>
                    </button>

                    <button
                      onClick={() => openEditModal(product)}
                      className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                      title="Edit Produk & Varian"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => setDeleteTarget(product)}
                      disabled={isPending}
                      className="rounded-lg border border-zinc-800 p-1.5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer"
                      title="Hapus Produk"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sub Varian Table */}
                {isExpanded && (
                  <div className="border-t border-zinc-800/80 bg-zinc-950/40 p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-zinc-300">
                        <thead className="border-b border-zinc-800/60 bg-zinc-900/60 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                          <tr>
                            <th className="px-4 py-2.5">SKU / Varian</th>
                            <th className="px-4 py-2.5">Ukuran</th>
                            <th className="px-4 py-2.5">Warna</th>
                            <th className="px-4 py-2.5">Barcode</th>
                            <th className="px-4 py-2.5 text-right">
                              Stok Fisik
                            </th>
                            <th className="px-4 py-2.5 text-center">
                              Kartu Stok
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {product.variants.map((variant) => (
                            <tr
                              key={variant.id}
                              className="hover:bg-zinc-800/20 transition-colors"
                            >
                              <td className="px-4 py-3 font-mono font-medium text-zinc-100">
                                {variant.sku}
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center rounded-md bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono font-medium text-zinc-300">
                                  {variant.size.name}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center space-x-1 text-zinc-300">
                                  <Tag className="h-3 w-3 text-zinc-500" />
                                  <span>{variant.color.name}</span>
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-zinc-400 flex items-center space-x-1">
                                <QrCode className="h-3.5 w-3.5 text-zinc-500" />
                                <span>{variant.barcode}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold font-mono text-zinc-100">
                                {variant.stock} pcs
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => openHistoryModal(variant)}
                                  className="inline-flex items-center space-x-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                                  title="Lihat Riwayat Audit Stok"
                                >
                                  <History className="h-3.5 w-3.5 text-zinc-400" />
                                  <span>Audit Log</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add/Edit Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-bold text-zinc-100">
                {selectedProduct
                  ? "Edit Produk & Varian"
                  : "Tambah Produk Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={selectedProduct ? updateFormAction : createFormAction}
              className="space-y-5"
            >
              {selectedProduct && (
                <input type="hidden" name="id" value={selectedProduct.id} />
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama Produk
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedProduct?.name ?? ""}
                  placeholder="Contoh: Setelan Jenita"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedProduct
                  ? updateState?.errors?.name
                  : createState?.errors?.name) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedProduct ? updateState : createState)?.errors
                        ?.name?.[0]
                    }
                  </p>
                )}
              </div>

              {/* Checkbox Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Pilih Ukuran (Size)
                </label>
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-zinc-800 bg-zinc-950">
                  {availableSizes.map((size) => {
                    const isChecked = selectedSizeIds.includes(size.id);
                    return (
                      <div
                        key={size.id}
                        onClick={() => toggleSizeSelect(size.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
                            : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="sizeIds"
                          value={size.id}
                          checked={isChecked}
                          onChange={() => {}}
                          className="hidden"
                        />
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-zinc-200" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600" />
                        )}
                        <span className="font-mono">{size.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkbox Warna */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Pilih Warna (Color)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl border border-zinc-800 bg-zinc-950">
                  {availableColors.map((color) => {
                    const isChecked = selectedColorIds.includes(color.id);
                    return (
                      <div
                        key={color.id}
                        onClick={() => toggleColorSelect(color.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "border-zinc-600 bg-zinc-800/80 text-zinc-100"
                            : "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name="colorIds"
                          value={color.id}
                          checked={isChecked}
                          onChange={() => {}}
                          className="hidden"
                        />
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-zinc-200" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-600" />
                        )}
                        <span>{color.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-950 p-3 text-[11px] text-zinc-400">
                Total varian terbentuk:{" "}
                <span className="font-semibold text-zinc-200">
                  {selectedSizeIds.length * selectedColorIds.length} SKU
                </span>
                . Uncheck varian lama akan menghapus SKU terkait secara
                permanen.
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex items-center space-x-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white disabled:opacity-50 cursor-pointer"
                >
                  {(isCreating || isUpdating) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    {selectedProduct
                      ? "Simpan Perubahan"
                      : "Generate Produk & Varian"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Print Barcode (2 Barcode / Baris Khusus Kertas Resi) */}
      {printProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Label Barcode: {printProduct.name}
                </h2>
                <p className="text-xs text-zinc-400">
                  Format kertas resi (2 barcode/baris).
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePrint()}
                  className="flex items-center space-x-1.5 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white cursor-pointer transition-all"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Label</span>
                </button>
                <button
                  onClick={() => setPrintProduct(null)}
                  className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Container yang akan di-print oleh react-to-print */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div
                ref={printRef}
                className="print-barcode-sheet bg-white p-4 rounded-xl text-zinc-950"
              >
                <div className="print-barcode-grid grid grid-cols-2 gap-3">
                  {printProduct.variants.map((v) => (
                    <div
                      key={v.id}
                      className="barcode-card-item border border-zinc-400 p-2 rounded text-center flex flex-col items-center justify-center bg-white"
                    >
                      <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-800">
                        AZKADIENA COLLECTION
                      </p>
                      <p className="text-xs font-bold text-zinc-900 truncate max-w-[180px] leading-tight">
                        {printProduct.name}
                      </p>
                      <p className="text-[10px] font-mono font-bold text-zinc-700">
                        {v.color.name} - {v.size.name}
                      </p>

                      <div className="my-0.5">
                        <Barcode
                          value={v.barcode}
                          width={1.2}
                          height={35}
                          fontSize={10}
                          margin={1}
                          background="#ffffff"
                          lineColor="#000000"
                        />
                      </div>

                      <p className="text-[8px] font-mono text-zinc-600 font-medium">
                        SKU: {v.sku}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Audit Log Kartu Stok */}
      {historyVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-zinc-100">
                  Kartu Stok / Audit Log
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  SKU: {historyVariant.sku} ({historyVariant.color.name} -{" "}
                  {historyVariant.size.name})
                </p>
              </div>
              <button
                onClick={() => setHistoryVariant(null)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {movements.length === 0 && !loadingMovements ? (
                <p className="py-8 text-center text-xs text-zinc-500">
                  Belum ada riwayat pergerakan stok untuk varian ini.
                </p>
              ) : (
                movements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-zinc-200 capitalize">
                        Tipe: <span className="text-zinc-100">{m.type}</span>
                      </p>
                      <p className="text-[11px] text-zinc-500 font-mono">
                        {new Date(m.createdAt).toLocaleString("id-ID")} •
                        Operator: {m.operatorName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold font-mono ${
                          m.qty > 0 ? "text-emerald-400" : "text-sky-400"
                        }`}
                      >
                        {m.qty > 0 ? `+${m.qty}` : m.qty} pcs
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Stok: {m.stockBefore} → {m.stockAfter}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {hasMoreMovements && (
                <div className="pt-2 text-center">
                  <button
                    onClick={loadMoreMovements}
                    disabled={loadingMovements}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 cursor-pointer"
                  >
                    {loadingMovements ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mx-auto" />
                    ) : (
                      "Muat Lebih Banyak Log..."
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus produk "${deleteTarget?.name}"?`}
        description="Seluruh varian, SKU, barcode, dan riwayat kartu stok produk ini akan dihapus secara permanen."
        confirmText="Hapus Produk"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
