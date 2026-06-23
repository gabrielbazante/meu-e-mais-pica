import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixa a raiz do Turbopack neste projeto (havia outro lockfile em ~/).
  turbopack: { root: path.resolve(__dirname) },
};

export default nextConfig;
