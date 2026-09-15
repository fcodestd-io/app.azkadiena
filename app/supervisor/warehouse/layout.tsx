import React, { Suspense } from "react";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { LogOut, Warehouse } from "lucide-react";
import WarehouseLoading from "./loading";

export default async function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased flex justify-center">
      {/* Mobile Frame Container (Max Width 480px) */}
      <div className="w-full max-w-md bg-zinc-950 flex flex-col min-h-screen border-x border-zinc-900 shadow-2xl relative">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Logo Image Azkadiena dengan Badge WMS */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-zinc-900 p-0.5">
              <Image
                src="/az-logo.webp" // Pastikan file gambar ada di folder /public/az-logo_2.webp
                alt="Azkadiena Logo"
                width={40}
                height={40}
                className="h-full w-full rounded-full object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 rounded-md bg-emerald-500 px-1 py-[1px] text-[8px] font-extrabold text-zinc-950 shadow-sm">
                WMS
              </span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 leading-tight">
                AZ Warehouse
              </h1>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Warehouse className="h-3 w-3 text-emerald-400" /> SPV Gudang
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-red-400 transition-all active:scale-95"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 pb-10">
          <Suspense fallback={<WarehouseLoading />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}
