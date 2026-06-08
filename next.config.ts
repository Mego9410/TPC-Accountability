import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root — a stray lockfile in the home directory would
  // otherwise make Next infer the wrong root.
  turbopack: {
    root: dirname,
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
