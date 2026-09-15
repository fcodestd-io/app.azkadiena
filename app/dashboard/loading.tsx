import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-100" />
        <p className="text-xs font-medium text-zinc-400 tracking-wide">
          Memuat halaman...
        </p>
      </div>
    </div>
  );
}
