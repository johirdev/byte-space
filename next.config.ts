import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // imgbb uploads are optimised by next/image; other hosts render
    // `unoptimized` (see imageProps in Components/Frontend/utils/course.ts).
    remotePatterns: [
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "**.ibb.co" },
    ],
  },
};

export default nextConfig;
