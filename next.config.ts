import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Turbopackのroot directoryを明示的に指定
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
