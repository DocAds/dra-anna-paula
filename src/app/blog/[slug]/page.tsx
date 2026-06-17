import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { CTA } from "@/components/CTA";
import { getPostBySlug, listPublishedSlugs, listPublishedPosts } from "@/lib/posts";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";

type Params = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await listPublishedSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post" };
  return {
    title: post.title,
    description: post.excerpt || post.title,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();

  const otherPosts = (await listPublishedPosts()).filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <article className="relative pt-32 pb-16 bg-porcelain">
        <div className="mx-auto max-w-3xl px-6">
          <Reveal>
            <Link href="/blog" className="text-[11px] uppercase tracking-widest3 text-toffee underline-editorial">
              ← Diário
            </Link>
          </Reveal>
          {post.category && (
            <Reveal delay={0.1}>
              <div className="text-[11px] uppercase tracking-widest3 text-cocoa/65 mt-8 mb-4">
                {post.category}
              </div>
            </Reveal>
          )}
          <Reveal delay={0.15}>
            <h1 className="font-display text-[clamp(2.2rem,5.5vw,4rem)] leading-[1.05] text-ink text-balance">
              {post.title}
            </h1>
          </Reveal>
          {post.excerpt && (
            <Reveal delay={0.25}>
              <p className="mt-6 text-xl text-ink/70 leading-relaxed font-serif italic">
                {post.excerpt}
              </p>
            </Reveal>
          )}
          {post.published_at && (
            <Reveal delay={0.35}>
              <div className="mt-6 text-[11px] uppercase tracking-widest2 text-ink/45">
                {format(new Date(post.published_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} · Dra. Anna Bomtempo
              </div>
            </Reveal>
          )}
        </div>

        {post.cover_image && (
          <Reveal delay={0.3} className="mx-auto max-w-5xl px-6 mt-14">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-cream">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                priority
                sizes="(min-width:1024px) 70vw, 100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        )}

        <div className="mx-auto max-w-3xl px-6 mt-16">
          <div
            className="prose prose-cocoa max-w-none prose-headings:font-display prose-headings:text-ink prose-p:text-ink/80 prose-p:leading-relaxed prose-a:text-cocoa prose-img:rounded-2xl"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
          />
        </div>
      </article>

      {otherPosts.length > 0 && (
        <section className="relative py-24 bg-bone">
          <div className="mx-auto max-w-5xl px-6">
            <div className="flex items-end justify-between gap-6 mb-10">
              <h2 className="font-display text-3xl md:text-4xl text-ink">Outros estudos</h2>
              <Link href="/blog" className="text-[11px] uppercase tracking-widest2 text-cocoa underline-editorial inline-flex items-center gap-2">
                Ver todos <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-4">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group editorial-card rounded-3xl px-6 py-5 grid md:grid-cols-[1fr_auto] items-center gap-4 hover:-translate-y-0.5 transition-all duration-500"
                >
                  <div>
                    {p.category && (
                      <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">{p.category}</div>
                    )}
                    <div className="font-display text-xl text-ink leading-tight">{p.title}</div>
                  </div>
                  <div className="text-[11px] uppercase tracking-widest2 text-cocoa group-hover:translate-x-1 transition-transform duration-500">
                    Ler →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] text-ink text-balance leading-tight">
            Pronta para uma avaliação?
          </h2>
          <div className="mt-8">
            <CTA source={`blog-${slug}`}>Agendar avaliação</CTA>
          </div>
        </div>
      </section>
    </>
  );
}
