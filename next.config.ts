import type { NextConfig } from "next";

const SALES_OPS_DATA_CACHE = 'public, max-age=600, s-maxage=86400, stale-while-revalidate=604800';
const SALES_OPS_PDF_CACHE = 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=2592000, immutable';

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false, crypto: false };
    return config;
  },
  async headers() {
    return [
      {
        // JSON + TopoJSON assets powering the map. Dated content, so the edge
        // can hold them for a day and keep serving stale while revalidating.
        source: '/sales-ops/data/:path*.json',
        headers: [{ key: 'cache-control', value: SALES_OPS_DATA_CACHE }],
      },
      {
        // Merdeka PDFs — swap the file + bump the filename when Colten posts
        // a new cycle, so immutable is safe here.
        source: '/sales-ops/data/pdfs/:path*.pdf',
        headers: [{ key: 'cache-control', value: SALES_OPS_PDF_CACHE }],
      },
    ];
  },
};

export default nextConfig;
