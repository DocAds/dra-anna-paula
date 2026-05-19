import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { listPublishedPosts } from "@/lib/posts";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = { title: "Diário · Blog" };
export const revalidate = 60;

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  return (
    <>
      <section className="relative pt-40 pb-20 overflow-hidden">
        <SceneBackdrop scene="botanical" intensity={0.5} />
        <div className="mx-auto max-w-5xl px-6 relative">
          <Reveal>
            <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-6 flex items-center gap-3">
              <span className="h-px w-12 bg-toffee/60" /> Diário
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-display text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.98] text-ink text-balance">
              Estudos, anotações e{" "}
              <span className="italic text-cocoa">cuidados</span> assinados pela Dra. Anna.
            </h1>
          </Reveal>
        </div>
      </section>

      <section className="relative pb-32">
        <div className="mx-auto max-w-5xl px-6 grid gap-4">
          {posts.length === 0 ? (
            <p className="text-ink/55 text-center py-20">Em breve, novos conteúdos.</p>
          ) : (
            posts.map((p, i) => {
              const hasContent = !!p.published_at;
              const Card = (
                <article className={`group editorial-card rounded-3xl p-6 md:p-8 grid md:grid-cols-12 items-center gap-6 ${
                  hasContent ? "hover:-translate-y-0.5 transition-all duration-700" : ""
                }`}>
                  {p.cover_image ? (
                    <div className="md:col-span-3 relative aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl">
                      <Image src={p.cover_image} alt={p.title} fill sizes="(min-width:768px) 200px, 100vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="md:col-span-2 text-[10px] uppercase tracking-widest3 text-toffee">
                      {p.category}
                    </div>
                  )}
                  <div className={p.cover_image ? "md:col-span-7" : "md:col-span-8"}>
                    {p.cover_image && p.category && (
                      <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-2">{p.category}</div>
                    )}
                    <h2 className="font-display text-xl md:text-2xl text-ink leading-snug">
                      {p.title}
                    </h2>
                    {p.excerpt && <p className="text-sm text-ink/65 mt-2 leading-relaxed line-clamp-2">{p.excerpt}</p>}
                  </div>
                  <div className="md:col-span-2 md:text-right text-[12px] uppercase tracking-widest2 text-cocoa group-hover:translate-x-1 transition-transform duration-500">
                    {hasContent ? "Ler →" : "Em breve →"}
                  </div>
                </article>
              );
              return hasContent ? (
                <Reveal key={p.slug} delay={(i % 4) * 0.06}>
                  <Link href={`/blog/${p.slug}`}>{Card}</Link>
                </Reveal>
              ) : (
                <Reveal key={p.slug} delay={(i % 4) * 0.06}>{Card}</Reveal>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
