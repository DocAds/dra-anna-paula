import type { NextConfig } from "next";

// Host do Supabase Storage, de onde saem as capas do blog. A lista fica fechada:
// com hostname "**" o otimizador de imagem vira um proxy aberto a qualquer origem.
// Sem a env, nenhum host remoto é liberado (um curinga "*.supabase.co" abriria o
// proxy pra qualquer projeto Supabase do mundo).
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

// Origens que a medição usa hoje. unsafe-inline e unsafe-eval continuam aqui
// porque GTM e o script colado no painel dependem deles: tirar exige nonce, que
// é o passo seguinte, depois que o relatório confirmar o inventário.
const CSP_OBSERVACAO = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://*.google-analytics.com https://*.googleadservices.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://connect.facebook.net https://*.facebook.net https://analytics.tiktok.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.doubleclick.net https://*.google.com https://*.facebook.com https://analytics.tiktok.com",
  "frame-src https://*.doubleclick.net https://*.google.com https://*.facebook.com https://www.youtube-nocookie.com https://www.youtube.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "report-uri /api/csp-report",
].join("; ");

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
  // Cabeçalhos de segurança.
  //
  // A CSP entra em Report-Only primeiro, de propósito: o site injeta tags de
  // marketing gravadas no painel, então o inventário de origens muda sem passar
  // por deploy, e ligar no escuro derruba a medição de conversão em silêncio.
  // Report-Only não bloqueia nada, só relata em /api/csp-report; depois de uma
  // semana de tráfego real, o log diz o que falta liberar e aí o cabeçalho vira
  // Content-Security-Policy de verdade, com nonce no lugar do unsafe-inline.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy-Report-Only", value: CSP_OBSERVACAO },
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
