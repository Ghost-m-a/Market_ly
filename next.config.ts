import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   reactStrictMode: true,
   serverExternalPackages: ["pg", "@prisma/adapter-pg", "@prisma/client"],
   eslint: {
      ignoreDuringBuilds: true,
   },
};

export default nextConfig;
