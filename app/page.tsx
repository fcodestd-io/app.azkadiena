"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { loginAction } from "./auth-action";
import {
  ArrowRight,
  Lock,
  User,
  ShieldCheck,
  Factory,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 font-sans text-zinc-100 antialiased selection:bg-zinc-800 selection:text-zinc-100">
      {/* ------------------------------------------------------------- */}
      {/* KIRI: Desktop Showroom / Hero Section (Hidden di Mobile) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-zinc-800/80 bg-zinc-900/40 p-12 lg:flex xl:w-7/12">
        {/* Ambient Radial Background Glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-zinc-700/10 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-zinc-800/20 blur-[150px]" />

        {/* Top Branding */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-900 p-0.5 shadow-md">
            <Image
              src="/az-logo.webp"
              alt="Azkadiena Logo"
              fill
              className="object-cover rounded-full"
              priority
            />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-zinc-100">
              App Azkadiena
            </span>
            <span className="ml-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              v2.0
            </span>
          </div>
        </div>

        {/* Hero Content Center */}
        <div className="relative z-10 max-w-xl space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-3 py-1 text-xs text-zinc-400 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-zinc-300" />
            <span>Sistem Informasi Manajemen Konveksi & Inventori</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
            Kontrol Inventori <br />
            <span className="text-zinc-400">Presisi & Terintegrasi.</span>
          </h1>

          <p className="text-sm leading-relaxed text-zinc-400 max-w-lg">
            Pantau arus potong, barang masuk keluar, stock opname, hingga manajemen
            mutasi stok marketplace dalam satu platform terpusat.
          </p>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-md">
              <Factory className="h-5 w-5 text-zinc-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">
                Target Potong
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Tracking SPK & Batch
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-md">
              <Layers className="h-5 w-5 text-zinc-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">Kartu Stok</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Real-time Movement Log
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 backdrop-blur-md">
              <ShieldCheck className="h-5 w-5 text-zinc-400 mb-2" />
              <p className="text-xs font-semibold text-zinc-200">
                Audit Operator
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Akuntabilitas Lengkap
              </p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} PT Azkadiena Garment Indonesia. All
          rights reserved.
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* KANAN: Form Login Center */}
      {/* ------------------------------------------------------------- */}
      <div className="flex w-full items-center justify-center p-6 lg:w-1/2 xl:w-5/12">
        <div className="w-full max-w-sm space-y-8">
          {/* Header Mobile Only */}
          <div className="flex flex-col items-center space-y-3 text-center lg:hidden">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 p-1 shadow-lg">
              <Image
                src="/az-logo.webp"
                alt="Azkadiena Logo"
                fill
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100">
                App Azkadiena
              </h2>
              <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">
                Confection Management
              </p>
            </div>
          </div>

          {/* Form Header Desktop */}
          <div className="hidden space-y-2 lg:block">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">
              Selamat Datang Kembali
            </h2>
            <p className="text-xs text-zinc-400">
              Silakan masukkan akun kredensial Anda untuk melanjutkan.
            </p>
          </div>

          {/* Form Card tanpa atribut required HTML */}
          <form action={formAction} className="space-y-5">
            {/* Input Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Masukkan username"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-1 transition-all"
                />
              </div>
              {state?.errors?.username && (
                <p className="text-xs text-red-400 mt-1">
                  {state.errors.username[0]}
                </p>
              )}
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none ring-zinc-400 focus:border-zinc-500 focus:ring-1 transition-all"
                />
              </div>
              {state?.errors?.password && (
                <p className="text-xs text-red-400 mt-1">
                  {state.errors.password[0]}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full items-center justify-center space-x-2 rounded-xl bg-zinc-100 py-3 text-sm font-semibold text-zinc-950 shadow-md hover:bg-white active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>
                {isPending ? "Memverifikasi..." : "Masuk ke Dashboard"}
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Footer Security Note */}
          <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 text-center">
            <p className="text-[11px] text-zinc-500">
                Sesi Untuk Admin, Owner, Spv Gudang.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
