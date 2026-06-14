import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes a static site to `out/`, served by FastAPI.
  output: "export",
  images: { unoptimized: true },
  // Dev only: `next dev` proxies API calls to the FastAPI backend. Rewrites are
  // ignored by the static export build (the served app and API share an origin).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
