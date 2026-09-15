"use client";

import {
  useState,
  useTransition,
  useActionState,
  useEffect,
  useMemo,
} from "react";
import {
  createConfectionAction,
  updateConfectionAction,
  deleteConfectionAction,
  ActionState,
} from "./action";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  X,
  Loader2,
  Search,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface ConfectionBranchData {
  id: string;
  name: string;
  supervisorName: string;
  createdAt: Date;
}

export function ConfectionPageClient({
  initialBranches,
}: {
  initialBranches: ConfectionBranchData[];
}) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] =
    useState<ConfectionBranchData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ConfectionBranchData | null>(
    null,
  );

  const [searchQuery, setSearchQuery] = useState("");

  const [createState, createFormAction, isCreating] = useActionState<
    ActionState,
    FormData
  >(createConfectionAction, null);

  const [updateState, updateFormAction, isUpdating] = useActionState<
    ActionState,
    FormData
  >(updateConfectionAction, null);

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
      setSelectedBranch(null);
    } else if (updateState?.message) {
      toast.error(updateState.message);
    }
  }, [updateState]);

  const filteredBranches = useMemo(() => {
    return initialBranches.filter((b) => {
      const query = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(query) ||
        b.supervisorName.toLowerCase().includes(query)
      );
    });
  }, [initialBranches, searchQuery]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    startTransition(async () => {
      const res = await deleteConfectionAction(deleteTarget.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message || "Gagal menghapus cabang konveksi");
      }
      setDeleteTarget(null);
    });
  };

  const openEditModal = (branch: ConfectionBranchData) => {
    setSelectedBranch(branch);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedBranch(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Master Data Cabang Konveksi
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola daftar lokasi dan penanggung jawab cabang konveksi.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Cabang</span>
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari nama cabang / SPV..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-9 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-700 transition-all"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800/80 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Nama Konveksi</th>
              <th className="px-5 py-3.5">Penanggung Jawab (SPV)</th>
              <th className="px-5 py-3.5">Terdaftar Pada</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {filteredBranches.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-5 py-8 text-center text-zinc-500 text-xs"
                >
                  Tidak ada data cabang konveksi.
                </td>
              </tr>
            ) : (
              filteredBranches.map((branch) => (
                <tr
                  key={branch.id}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-zinc-100">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-zinc-300">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-zinc-100 text-xs">
                        {branch.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center space-x-1.5 text-zinc-300">
                      <UserCheck className="h-3.5 w-3.5 text-zinc-500" />
                      <span>{branch.supervisorName}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono text-zinc-400">
                    {new Date(branch.createdAt).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(branch)}
                        className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                        title="Edit Cabang"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(branch)}
                        disabled={isPending}
                        className="rounded-lg border border-zinc-800 p-1.5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                        title="Hapus Cabang"
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-zinc-100">
                {selectedBranch
                  ? "Edit Cabang Konveksi"
                  : "Tambah Cabang Konveksi"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={selectedBranch ? updateFormAction : createFormAction}
              className="space-y-4"
            >
              {selectedBranch && (
                <input type="hidden" name="id" value={selectedBranch.id} />
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Nama Konveksi
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedBranch?.name ?? ""}
                  placeholder="Contoh: Konveksi Utama"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedBranch
                  ? updateState?.errors?.name
                  : createState?.errors?.name) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedBranch ? updateState : createState)?.errors
                        ?.name?.[0]
                    }
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Penanggung Jawab (Supervisor)
                </label>
                <input
                  type="text"
                  name="supervisorName"
                  defaultValue={selectedBranch?.supervisorName ?? ""}
                  placeholder="Contoh: Pak Supri"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedBranch
                  ? updateState?.errors?.supervisorName
                  : createState?.errors?.supervisorName) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedBranch ? updateState : createState)?.errors
                        ?.supervisorName?.[0]
                    }
                  </p>
                )}
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
                    {selectedBranch ? "Simpan Perubahan" : "Buat Cabang"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus cabang "${deleteTarget?.name}"?`}
        description="Data cabang ini akan dihapus dari sistem."
        confirmText="Hapus Cabang"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
