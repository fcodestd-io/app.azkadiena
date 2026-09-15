"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import {
  createAttributeAction,
  updateAttributeAction,
  deleteAttributeAction,
  ActionState,
} from "./action";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Ruler,
  Palette,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface AttributeItem {
  id: string;
  name: string;
}

interface PageClientProps {
  initialData: {
    sizes: AttributeItem[];
    colors: AttributeItem[];
  };
}

export function PageClient({ initialData }: PageClientProps) {
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"size" | "color">("size");
  const [selectedItem, setSelectedItem] = useState<AttributeItem | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    type: "size" | "color";
  } | null>(null);

  const [createState, createFormAction, isCreating] = useActionState<
    ActionState,
    FormData
  >(createAttributeAction, null);

  const [updateState, updateFormAction, isUpdating] = useActionState<
    ActionState,
    FormData
  >(updateAttributeAction, null);

  useEffect(() => {
    if (createState?.success) {
      toast.success(createState.message);
      setIsModalOpen(false);
    } else if (createState?.message) {
      toast.error(createState.message);
    }
  }, [createState]);

  useEffect(() => {
    if (updateState?.success) {
      toast.success(updateState.message);
      setIsModalOpen(false);
      setSelectedItem(null);
    } else if (updateState?.message) {
      toast.error(updateState.message);
    }
  }, [updateState]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteAttributeAction(
        deleteTarget.id,
        deleteTarget.type,
      );
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message || "Gagal menghapus atribut");
      }
      setDeleteTarget(null);
    });
  };

  const openCreateModal = (type: "size" | "color") => {
    setModalType(type);
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (type: "size" | "color", item: AttributeItem) => {
    setModalType(type);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          Master Data Atribut
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Kelola daftar Ukuran (Size) dan Warna (Color) untuk varian produk
          konveksi.
        </p>
      </div>

      {/* Grid 2 Kolom: Ukuran & Warna */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ========================================== */}
        {/* KOLOM 1: UKURAN (SIZE) */}
        {/* ========================================== */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-300">
                <Ruler className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">
                  Ukuran / Size
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {initialData.sizes.length} jenis ukuran terdaftar
                </p>
              </div>
            </div>
            <button
              onClick={() => openCreateModal("size")}
              className="flex items-center space-x-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Size</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/40">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800/60 bg-zinc-900/60 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5">Nama Size</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {initialData.sizes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-zinc-500 text-xs"
                    >
                      Belum ada data ukuran.
                    </td>
                  </tr>
                ) : (
                  initialData.sizes.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-100 font-mono text-xs">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal("size", item)}
                            className="rounded-lg border border-zinc-800 p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Edit Size"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: item.id,
                                name: item.name,
                                type: "size",
                              })
                            }
                            disabled={isPending}
                            className="rounded-lg border border-zinc-800 p-1 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus Size"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================== */}
        {/* KOLOM 2: WARNA (COLOR) */}
        {/* ========================================== */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/50 text-zinc-300">
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100">
                  Warna / Color
                </h2>
                <p className="text-[11px] text-zinc-400">
                  {initialData.colors.length} pilihan warna terdaftar
                </p>
              </div>
            </div>
            <button
              onClick={() => openCreateModal("color")}
              className="flex items-center space-x-1.5 rounded-xl bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Warna</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-800/60 bg-zinc-950/40">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="border-b border-zinc-800/60 bg-zinc-900/60 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="px-4 py-2.5">Nama Warna</th>
                  <th className="px-4 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/40">
                {initialData.colors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-4 py-6 text-center text-zinc-500 text-xs"
                    >
                      Belum ada data warna.
                    </td>
                  </tr>
                ) : (
                  initialData.colors.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-800/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-zinc-100 text-xs flex items-center space-x-2">
                        <Tag className="h-3 w-3 text-zinc-500" />
                        <span>{item.name}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => openEditModal("color", item)}
                            className="rounded-lg border border-zinc-800 p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                            title="Edit Warna"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                id: item.id,
                                name: item.name,
                                type: "color",
                              })
                            }
                            disabled={isPending}
                            className="rounded-lg border border-zinc-800 p-1 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Hapus Warna"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-100">
                {selectedItem
                  ? `Edit ${modalType === "size" ? "Ukuran" : "Warna"}`
                  : `Tambah ${modalType === "size" ? "Ukuran" : "Warna"} Baru`}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              action={selectedItem ? updateFormAction : createFormAction}
              className="space-y-4"
            >
              {selectedItem && (
                <input type="hidden" name="id" value={selectedItem.id} />
              )}
              <input type="hidden" name="type" value={modalType} />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama {modalType === "size" ? "Ukuran" : "Warna"}
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedItem?.name ?? ""}
                  placeholder={
                    modalType === "size"
                      ? "Contoh: XL, M, 42"
                      : "Contoh: Hitam Pekat, Navy"
                  }
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedItem
                  ? updateState?.errors?.name
                  : createState?.errors?.name) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedItem ? updateState : createState)?.errors
                        ?.name?.[0]
                    }
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-100 cursor-pointer"
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
                  <span>{selectedItem ? "Simpan" : "Tambah"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus ${deleteTarget?.type === "size" ? "Ukuran" : "Warna"} "${deleteTarget?.name}"?`}
        description="Data atribut ini akan dihapus. Pastikan atribut tidak terikat pada varian produk aktif."
        confirmText="Hapus Atribut"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
