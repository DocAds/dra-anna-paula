import type { MetadataRoute } from "next";
import { listPostsForSitemap } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";
import { tratamentos } from "@/lib/tratamentos";

export const revalidate = 3600;

type Frequencia = MetadataRoute.Sitemap[number]["changeFrequency"];

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: Frequencia }[] = [
  { path: "/", priority: 1, changeFrequency: "monthly" },
  { path: "/tratamentos", priority: 0.9, changeFrequency: "monthly" },
  { path: "/contato", priority: 0.9, changeFrequency: "yearly" },
  { path: "/sobre", priority: 0.8, changeFrequency: "yearly" },
  { path: "/blog", priority: 0.7, changeFrequency: "weekly" },
  { path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * lastModified só aparece onde existe uma data real de modificação (os posts).
 * Carimbar new Date() em página estática a cada revalidação é um sinal falso de
 * frescor, e o Googlebot desconta a assinatura inteira quando percebe.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const paginasTratamento: MetadataRoute.Sitemap = tratamentos.map((t) => ({
    url: absoluteUrl(`/tratamentos/${t.slug}`),
    changeFrequency: "monthly",
    priority: t.destaque ? 0.9 : 0.8,
  }));

  // Um Supabase fora do ar não pode derrubar o sitemap inteiro.
  const posts = await listPostsForSitemap().catch(() => []);
  const paginasPost: MetadataRoute.Sitemap = posts.map((p) => ({
    url: absoluteUrl(`/blog/${p.slug}`),
    lastModified: new Date(p.updated_at ?? p.published_at ?? Date.now()),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...estaticas, ...paginasTratamento, ...paginasPost];
}
