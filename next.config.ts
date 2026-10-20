import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A szerződés-PDF generátor (src/lib/contract-pdf.ts) ezeket a fontfájlokat
  // olvassa be futásidőben - explicit trace nélkül Vercel néha kihagyja a
  // forráskódon kívüli, futásidőben fs-sel olvasott binárisokat a buildből.
  outputFileTracingIncludes: {
    "/**": ["./src/lib/fonts/*.ttf"],
  },
};

export default nextConfig;
