/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@noue/db", "@noue/core"],
  serverExternalPackages: ["@prisma/client", "prisma"],
  eslint: { ignoreDuringBuilds: true },
  images: {
    // thumbnails do TikTok/R2 são renderizadas via <img>; sem otimização remota.
    unoptimized: true,
  },
};

export default nextConfig;
