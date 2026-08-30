import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // <--- Aktifkan mode ekspor statis
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
