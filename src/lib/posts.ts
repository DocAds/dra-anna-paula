import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/lib/supabase/types";

const fallbackPosts: Pick<Post, "title" | "slug" | "excerpt" | "category">[] = [
  { title: "Descomplicando os rótulos de skincare", slug: "rotulos-skincare", excerpt: null, category: "Skincare" },
  { title: "Vitamina C: o pilar invisível da pele radiante", slug: "vitamina-c", excerpt: null, category: "Skincare" },
  { title: "O sono da beleza existe", slug: "sono-da-beleza", excerpt: null, category: "Lifestyle" },
  { title: "Pele saudável em um mundo em mudança", slug: "pele-mundo-mudanca", excerpt: null, category: "Saúde" },
  { title: "Sua pele está pagando o preço do estresse?", slug: "estresse", excerpt: null, category: "Saúde" },
  { title: "Liftera e a revolução do ultrassom microfocado", slug: "liftera", excerpt: null, category: "Tecnologia" },
  { title: "A importância da consulta médica antes de procedimentos estéticos", slug: "consulta-medica", excerpt: null, category: "Medicina" },
  { title: "Guia completo: rotina de skincare por tipo de pele", slug: "rotina-skincare", excerpt: null, category: "Skincare" },
  { title: "Mitos e verdades do skincare", slug: "mitos-skincare", excerpt: null, category: "Skincare" },
  { title: "Pele de pêssego: o que a dieta tem a ver com isso", slug: "dieta-pele-pessego", excerpt: null, category: "Nutrição" },
  { title: "Diga adeus às manchas com Fotona StarWalker", slug: "fotona-manchas", excerpt: null, category: "Tecnologia" },
];

export async function listPublishedPosts(): Promise<Pick<Post, "title" | "slug" | "excerpt" | "category" | "cover_image" | "published_at">[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return fallbackPosts.map((p) => ({ ...p, cover_image: null, published_at: null }));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("title, slug, excerpt, category, cover_image, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return data && data.length > 0 ? data : fallbackPosts.map((p) => ({ ...p, cover_image: null, published_at: null }));
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single<Post>();
  return data;
}

export async function listPublishedSlugs(): Promise<string[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select("slug")
    .eq("status", "published");
  return (data || []).map((p) => p.slug);
}
