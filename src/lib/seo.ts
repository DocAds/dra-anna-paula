import type { Metadata } from "next";
import { SITE } from "@/lib/site";

/** Origem canônica do site. Sobrescrevível por ambiente (preview, staging). */
export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? SITE.url;

export const absoluteUrl = (path = "/") => new URL(path, BASE_URL).toString();

export const OG_IMAGE_PADRAO = {
  url: absoluteUrl("/og/og-default.jpg"),
  width: 1200,
  height: 630,
  alt: `${SITE.name} · ${SITE.role} · ${SITE.crm}`,
};

/**
 * O scraper do WhatsApp (e o do iMessage) não renderiza WebP em preview de link.
 * O site é todo WebP, então qualquer imagem que não seja jpg/png cai no card
 * padrão em vez de gerar um compartilhamento sem imagem.
 */
export function ogImage(url: string | null | undefined) {
  if (url && /\.(jpe?g|png)(\?.*)?$/i.test(url)) return [url];
  return [OG_IMAGE_PADRAO];
}

/**
 * O Next faz merge raso do metadata: declarar openGraph numa página substitui o
 * do layout por inteiro. Sem este helper, cada página perderia siteName, locale
 * e a imagem, e o card compartilhado no WhatsApp mostraria o título da home.
 */
export function openGraph(params: {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string | null;
}): Metadata["openGraph"] {
  return {
    type: params.type ?? "website",
    locale: "pt_BR",
    siteName: SITE.shortName,
    url: absoluteUrl(params.path),
    title: params.title,
    description: params.description,
    images: ogImage(params.image),
  };
}

/**
 * Normaliza um canonical vindo do editor para um caminho do próprio site.
 * Uma URL de outro domínio devolve null: apontar canonical pra fora tira a
 * página do índice do Google. Aplicado na escrita e de novo na leitura, porque
 * o banco pode já ter um valor antigo salvo sem validação.
 */
export function canonicalInterno(valor: string | null | undefined): string | null {
  const bruto = valor?.trim();
  if (!bruto) return null;
  if (bruto.startsWith("/")) return bruto;
  try {
    const url = new URL(bruto);
    return url.origin === new URL(BASE_URL).origin ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}
