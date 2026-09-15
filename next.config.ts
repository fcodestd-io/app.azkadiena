import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Mengabaikan error TypeScript saat proses build / deploy ke Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // (Opsional) Mengabaikan error ESLint saat proses build / deploy jika diperlukan
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
