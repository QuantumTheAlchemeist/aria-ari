import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // postgres is a server-only package; prevent it from being bundled for the client.
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
