import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dekont dosyaları için body size limitini 10MB'a çıkar
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
