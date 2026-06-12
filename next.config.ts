import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: []
  },
  async rewrites() {
    return [
      { source: "/pl/configurator", destination: "/configurator/index.html" },
      { source: "/en/configurator", destination: "/configurator/index.html" }
    ];
  }
};

export default nextConfig;
