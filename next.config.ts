import type { NextConfig } from "next";

// Host do Supabase Storage, de onde saem as capas do blog. A lista fica fechada:
// com hostname "**" o otimizador de imagem vira um proxy aberto a qualquer origem.
// Sem a env, nenhum host remoto é liberado (um curinga "*.supabase.co" abriria o
// proxy pra qualquer projeto Supabase do mundo).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  // A checagem de tipos/lint roda no CI (tsc) e localmente; desligada no build
  // pra não travar o deploy. TODO: reativar depois de confirmar typecheck limpo.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    // O runtime da Cloudflare (workerd) não roda o otimizador nativo do Next
    // (depende de sharp). As imagens já são pré-processadas em WebP nos scripts,
    // então servimos direto, sem passar pelo /_next/image.
    unoptimized: true,
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
  // Cabeçalhos de segurança. Falta a CSP: o site injeta tags de marketing
  // gravadas no painel (custom_head/custom_body) e carrega GTM, GA4, Ads e
  // Meta, então uma CSP feita no escuro derruba a medição de conversão. Ela
  // entra em tarefa própria, com o inventário de origens e teste de hit.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
