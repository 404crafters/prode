import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "crests.football-data.org",
        pathname: "/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/matches",
        destination: "/fixture",
        permanent: true,
      },
      {
        source: "/matches/:path*",
        destination: "/fixture/:path*",
        permanent: true,
      },
      {
        source: "/groups",
        destination: "/grupos",
        permanent: true,
      },
      {
        source: "/specials",
        destination: "/especiales",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
