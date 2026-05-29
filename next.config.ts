import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo root contains other projects with their own lockfiles; pin Turbopack
  // to this project directory so it doesn't infer the parent as the workspace root.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
