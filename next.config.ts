import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vitex37.ru" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "sialnbdujzuognfombwt.supabase.co" },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;
