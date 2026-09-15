"use client";

import { useState, useTransition, useActionState, useEffect } from "react";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
  ActionState,
} from "./action";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  User as UserIcon,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface UserData {
  id: string;
  username: string;
  role: "owner" | "admin" | "spv_warehouse";
  createdAt: Date;
}

export function UserClient({ initialUsers }: { initialUsers: UserData[] }) {
  const [isPending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  // State khusus untuk Confirm Dialog Delete
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);

  const [createState, createFormAction, isCreating] = useActionState<
    ActionState,
    FormData
  >(createUserAction, null);

  const [updateState, updateFormAction, isUpdating] = useActionState<
    ActionState,
    FormData
  >(updateUserAction, null);

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
      setSelectedUser(null);
    } else if (updateState?.message) {
      toast.error(updateState.message);
    }
  }, [updateState]);

  // Handler eksekusi hapus user setelah dikonfirmasi via dialog
  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.role === "owner") {
      toast.error("User Owner tidak dapat dihapus!");
      setDeleteTarget(null);
      return;
    }

    startTransition(async () => {
      const res = await deleteUserAction(deleteTarget.id);
      if (res?.success) {
        toast.success(res.message);
      } else {
        toast.error(res?.message || "Gagal menghapus user");
      }
      setDeleteTarget(null);
    });
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Master Data User
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola akun dan hak akses pengguna sistem.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-white transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah User</span>
        </button>
      </div>

      {/* User Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-md">
        <table className="w-full text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800/80 bg-zinc-900/80 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <tr>
              <th className="px-5 py-3.5">Username</th>
              <th className="px-5 py-3.5">Role</th>
              <th className="px-5 py-3.5">Dibuat Pada</th>
              <th className="px-5 py-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 font-sans">
            {initialUsers.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-5 py-4 font-medium text-zinc-100 flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400">
                    <UserIcon className="h-3.5 w-3.5" />
                  </div>
                  <span>{user.username}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                      user.role === "owner"
                        ? "border border-purple-500/20 bg-purple-500/10 text-purple-400"
                        : user.role === "admin"
                          ? "border border-sky-500/20 bg-sky-500/10 text-sky-400"
                          : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    <span className="uppercase">{user.role}</span>
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-zinc-400">
                  {new Date(user.createdAt).toLocaleDateString("id-ID")}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(user)}
                      className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    {user.role !== "owner" && (
                      <button
                        onClick={() => setDeleteTarget(user)}
                        disabled={isPending}
                        className="rounded-lg border border-zinc-800 p-1.5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                        title="Hapus User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form Create/Update */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h2 className="text-base font-bold text-zinc-100">
                {selectedUser ? "Edit User" : "Tambah User Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={selectedUser ? updateFormAction : createFormAction}
              className="space-y-4"
            >
              {selectedUser && (
                <input type="hidden" name="id" value={selectedUser.id} />
              )}

              {/* Username */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  defaultValue={selectedUser?.username ?? ""}
                  placeholder="Masukkan username"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedUser
                  ? updateState?.errors?.username
                  : createState?.errors?.username) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedUser ? updateState : createState)?.errors
                        ?.username?.[0]
                    }
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Password {selectedUser && "(Kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500 transition-all"
                />
                {(selectedUser
                  ? updateState?.errors?.password
                  : createState?.errors?.password) && (
                  <p className="text-xs text-red-400">
                    {
                      (selectedUser ? updateState : createState)?.errors
                        ?.password?.[0]
                    }
                  </p>
                )}
              </div>

              {/* Dropdown Role */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-300">
                  Role
                </label>
                {selectedUser?.role === "owner" ? (
                  <input
                    type="text"
                    disabled
                    value="OWNER (Permanen)"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 px-3.5 py-2.5 text-sm text-purple-400 font-semibold cursor-not-allowed"
                  />
                ) : (
                  <select
                    name="role"
                    defaultValue={selectedUser?.role ?? "admin"}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 outline-none focus:border-zinc-500 transition-all cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="spv_warehouse">SPV Warehouse</option>
                  </select>
                )}
                {selectedUser?.role === "owner" && (
                  <input type="hidden" name="role" value="owner" />
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
                  <span>{selectedUser ? "Simpan Perubahan" : "Buat User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog Delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={`Hapus user "${deleteTarget?.username}"?`}
        description="Data user ini akan dihapus secara permanen dari sistem dan tidak dapat dikembalikan."
        confirmText="Hapus User"
        variant="danger"
        isLoading={isPending}
      />
    </div>
  );
}
