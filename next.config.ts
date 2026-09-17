import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['192.168.3.86'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'brtyzzcifhkeltxybfrc.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
