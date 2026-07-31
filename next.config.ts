import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile in the home directory otherwise makes Next.js guess the
  // wrong workspace root.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
