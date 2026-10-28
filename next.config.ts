import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone com um servidor enxuto, que vai dentro do app desktop
  output: "standalone",
  outputFileTracingRoot: __dirname,
  outputFileTracingExcludes: { "*": ["data/**", "instalador/**", "desktop/**", "build/**"] },
  // better-sqlite3 é um módulo nativo: roda só no servidor, fora do bundle
  serverExternalPackages: ["better-sqlite3"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
