import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["img-api.neople.co.kr"],
    // 또는 remotePatterns 방식:
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "img-api.neople.co.kr",
    //     pathname: "/df/servers/**",
    //   },
    // ],
  },
};

export default nextConfig;
