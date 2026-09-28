import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Dekont dosyaları için body size limitini 10MB'a çıkar
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    return {
      // public/uploads altında kalmış eski dekontlar statik olarak herkese açık servis edilmesin;
      // istekler yetki kontrolü yapan API route'a yönlendirilir
      beforeFiles: [
        { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
