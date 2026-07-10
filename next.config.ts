import type { NextConfig } from "next";

// Host do Supabase Storage, de onde saem as capas do blog. A lista fica fechada:
// com hostname "**" o otimizador de imagem vira um proxy aberto a qualquer origem.
// Sem a env, nenhum host remoto é liberado (um curinga "*.supabase.co" abriria o
// proxy pra qualquer projeto Supabase do mundo).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "lucide-react"],
  },
};

export default nextConfig;
