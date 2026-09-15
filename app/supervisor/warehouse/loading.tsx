import React from "react";
import { Loader2 } from "lucide-react";

export default function WarehouseLoading() {
  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-9 w-9 animate-spin text-emerald-500" />
      <p className="text-xs font-medium text-zinc-400">Memuat data gudang...</p>
    </div>
  );
}
