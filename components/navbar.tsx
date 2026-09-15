"use client";

import Link from "next/link";
import Image from "next/image";
import { logoutAction } from "@/app/auth-action";
import {
  Users,
  Package,
  Building2,
  FileText,
  TrendingUp,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Tag,
} from "lucide-react";

interface NavbarProps {
  user?: {
    name?: string | null;
    role?: string | null;
  };
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-900/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-900 p-0.5 shadow-sm group-hover:border-zinc-500 transition-colors">
              <Image
                src="/az-logo.webp"
                alt="Azkadiena Logo"
                fill
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-extrabold tracking-tight text-zinc-100">
                App Azkadiena
              </span>
              <span className="text-[11px] font-mono font-medium text-zinc-400">
                v2.0
              </span>
            </div>
          </Link>

          {/* Menus */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/dashboard"
              className="flex items-center space-x-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-zinc-400" />
              <span>Overview</span>
            </Link>

            {/* Master Data */}
            <div className="relative group">
              <button className="flex items-center space-x-1 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors cursor-pointer">
                <span>Master Data</span>
                <ChevronDown className="h-3 w-3 text-zinc-400 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full hidden w-48 rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur-md group-hover:block">
                <Link
                  href="/dashboard/users"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span>User</span>
                </Link>
                <Link
                  href="/dashboard/atribut"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Tag className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Atribut</span>
                </Link>
                <Link
                  href="/dashboard/produk"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Package className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Produk</span>
                </Link>
                <Link
                  href="/dashboard/cabang"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <Building2 className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Cabang</span>
                </Link>
              </div>
            </div>

            {/* Laporan */}
            <div className="relative group">
              <button className="flex items-center space-x-1 rounded-lg px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 transition-colors cursor-pointer">
                <span>Laporan</span>
                <ChevronDown className="h-3 w-3 text-zinc-400 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full hidden w-52 rounded-xl border border-zinc-800 bg-zinc-900/95 p-1.5 shadow-xl backdrop-blur-md group-hover:block">
                <Link
                  href="/dashboard/laporan/target-masuk"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <FileText className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Target & Barang Masuk</span>
                </Link>
                <Link
                  href="/dashboard/laporan/penjualan"
                  className="flex items-center space-x-2 rounded-lg px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <TrendingUp className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Laporan Penjualan</span>
                </Link>
              </div>
            </div>
          </nav>
        </div>

        {/* User Info & Logout Form */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-zinc-200">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">
              {user?.role ?? "OWNER"}
            </p>
          </div>
          <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

          {/* Form Action memanggil Server Action terpisah */}
          <form action={logoutAction}>
            <button
              type="submit"
              className="group flex items-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
