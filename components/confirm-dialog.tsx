"use client";

import { AlertTriangle, Info, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Apakah Anda yakin?",
  description = "Tindakan ini tidak dapat dibatalkan.",
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-400" />,
          iconBg: "bg-red-500/10 border-red-500/20",
          buttonBg: "bg-red-600 hover:bg-red-500 text-white shadow-red-950/40",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
          iconBg: "bg-amber-500/10 border-amber-500/20",
          buttonBg:
            "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40",
        };
      case "info":
        return {
          icon: <Info className="h-5 w-5 text-sky-400" />,
          iconBg: "bg-sky-500/10 border-sky-500/20",
          buttonBg: "bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/40",
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${style.iconBg}`}>
              {style.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${style.buttonBg}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
