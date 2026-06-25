import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow sharp native module
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
