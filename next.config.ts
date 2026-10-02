import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   poweredByHeader: false,
   images: {
      remotePatterns: [{ protocol: "https", hostname: "**" }],
   },
   experimental: {
      serverActions: {
         bodySizeLimit: "5mb",
      },
   },
};

export default nextConfig;
