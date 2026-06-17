"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import slugify from "slugify";
import { createClient } from "@/lib/supabase/client";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Video,
  Trash2,
  Save,
  Eye,
  Sparkles,
  Search,
} from "lucide-react";
import { AIGenerateDialog } from "./AIDialogs";
import { CoverImageField } from "./CoverImageField";
import { generateArticle } from "@/app/admin/posts/ai-actions";
import type { Post, PostStatus } from "@/lib/supabase/types";

type Props = {
  initial?: Partial<Post>;
  onSubmit: (formData: FormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  postId?: string;
  categories?: { name: string }[];
};

const _LEGACY = [
  "Skincare",
  "Saúde",
  "Lifestyle",
  "Tecnologia",
  "Medicina",
  "Nutrição",
] as const;

export function PostEditor({ initial, onSubmit, onDelete, postId, categories }: Props) {
  const router = useRouter();
  const CATEGORIAS = categories?.map((c) => c.name) ?? _LEGACY;
  const [pending, startTransition] = useTransition();
  const [aiGenOpen, setAiGenOpen] = useState(false);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [status, setStatus] = useState<PostStatus>((initial?.status as PostStatus) ?? "draft");
  const [coverImage, setCoverImage] = useState(initial?.cover_image ?? "");
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [mounted, setMounted] = useState(false);
  // SEO avançado
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seo_description ?? "");
  const [focusKeyword, setFocusKeyword] = useState(initial?.focus_keyword ?? "");
  const [seoKeywords, setSeoKeywords] = useState((initial?.seo_keywords ?? []).join(", "));
  const [canonicalUrl, setCanonicalUrl] = useState(initial?.canonical_url ?? "");
  const [noIndex, setNoIndex] = useState(Boolean(initial?.no_index));

  useEffect(() => setMounted(true), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-cocoa underline" } }),
      Image,
      Youtube.configure({
        controls: true,
        nocookie: true,
        modestBranding: true,
        HTMLAttributes: { class: "w-full aspect-video rounded-2xl my-6" },
      }),
      Placeholder.configure({ placeholder: "Escreva o conteúdo do post..." }),
    ],
    content: initial?.content || "",
    immediatelyRender: false,
  });

  function onInsertVideo() {
    const url = window.prompt(
      "Cole a URL do vídeo (YouTube, Vimeo, ou um link direto .mp4):",
      "https://"
    );
    if (!url) return;
    const youtube = /youtu\.?be/.test(url);
    const vimeo = /vimeo\.com/.test(url);
    if (youtube) {
      editor?.chain().focus().setYoutubeVideo({ src: url }).run();
      return;
    }
    if (vimeo) {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      const id = match?.[1];
      if (id) {
        const html = `<div class="aspect-video w-full rounded-2xl overflow-hidden my-6"><iframe src="https://player.vimeo.com/video/${id}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="width:100%;height:100%"></iframe></div>`;
        editor?.chain().focus().insertContent(html).run();
        return;
      }
    }
    if (/\.(mp4|webm|ogg)$/i.test(url)) {
      const html = `<video controls preload="metadata" class="w-full rounded-2xl my-6"><source src="${url}"></video>`;
      editor?.chain().focus().insertContent(html).run();
      return;
    }
    alert("URL não reconhecida. Use YouTube, Vimeo ou um link direto .mp4 / .webm.");
  }

  async function onUploadVideo() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4,video/webm,video/ogg";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > 100 * 1024 * 1024) {
        if (!confirm("Vídeo maior que 100MB. Recomendo subir no YouTube e colar o link. Continuar mesmo assim?")) return;
      }
      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `video/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from("blog").upload(path, file, {
          cacheControl: "31536000",
          upsert: false,
          contentType: file.type,
        });
        if (error) { alert("Erro no upload: " + error.message); return; }
        const { data } = supabase.storage.from("blog").getPublicUrl(path);
        const html = `<video controls preload="metadata" class="w-full rounded-2xl my-6"><source src="${data.publicUrl}" type="${file.type}"></video>`;
        editor?.chain().focus().insertContent(html).run();
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v, { lower: true, strict: true }));
  }

  async function uploadFile(file: File): Promise<string | null> {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const path = `cover/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("blog").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (error) {
        alert("Erro no upload: " + error.message);
        return null;
      }
      const { data } = supabase.storage.from("blog").getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  async function onInsertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = await uploadFile(file);
      if (url) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
    };
    input.click();
  }

  function onAddLink() {
    const previous = editor?.getAttributes("link").href;
    const url = window.prompt("URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  function submit(targetStatus?: PostStatus) {
    const fd = new FormData();
    fd.set("title", title);
    fd.set("slug", slug);
    fd.set("excerpt", excerpt);
    fd.set("category", category || "");
    fd.set("cover_image", coverImage || "");
    fd.set("content", editor?.getHTML() ?? "");
    fd.set("status", targetStatus ?? status);
    fd.set("seo_title", seoTitle);
    fd.set("seo_description", seoDescription);
    fd.set("focus_keyword", focusKeyword);
    fd.set("seo_keywords", seoKeywords);
    fd.set("canonical_url", canonicalUrl);
    fd.set("og_image_url", coverImage || "");
    fd.set("no_index", noIndex ? "true" : "");
    startTransition(async () => {
      await onSubmit(fd);
      if (postId) router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Título do post"
          className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-3 font-display text-3xl md:text-4xl text-ink placeholder-ink/30"
        />

        <div className="flex items-center gap-3 text-[11px] uppercase tracking-widest2 text-ink/45">
          <span>/blog/</span>
          <input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            placeholder="slug-do-post"
            className="flex-1 bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink/75"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAiGenOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-cocoa text-bone px-4 py-2 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> Criar artigo com IA
          </button>
        </div>

        <Toolbar
          editor={editor}
          onInsertImage={onInsertImage}
          onInsertVideo={onInsertVideo}
          onUploadVideo={onUploadVideo}
          onAddLink={onAddLink}
          uploading={uploading}
        />

        <AIGenerateDialog
          open={aiGenOpen}
          onClose={() => setAiGenOpen(false)}
          onGenerate={generateArticle}
          onResult={(article, t) => {
            const newTitle = article.title || t;
            setTitle(newTitle);
            if (!slugTouched && newTitle) setSlug(slugify(newTitle, { lower: true, strict: true }));
            if (article.excerpt) setExcerpt(article.excerpt);
            editor?.commands.setContent(article.body_html || "");
            if (article.seo_title) setSeoTitle(article.seo_title);
            if (article.seo_description) setSeoDescription(article.seo_description);
            if (article.focus_keyword) setFocusKeyword(article.focus_keyword);
            if (article.keywords?.length) setSeoKeywords(article.keywords.join(", "));
          }}
        />

        <div className="editorial-card rounded-3xl p-6 min-h-[400px]">
          {mounted && editor ? (
            <EditorContent
              editor={editor}
              className="prose max-w-none focus:outline-none [&_.ProseMirror]:min-h-[360px] [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:font-display [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h3]:font-display [&_.ProseMirror_a]:text-cocoa [&_.ProseMirror_a]:underline [&_.ProseMirror_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child]:before:text-ink/30 [&_.ProseMirror_p.is-editor-empty:first-child]:before:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child]:before:float-left [&_.ProseMirror_p.is-editor-empty:first-child]:before:h-0"
            />
          ) : (
            <div className="min-h-[360px] text-ink/30">Carregando editor…</div>
          )}
        </div>

        <label className="block">
          <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Resumo (opcional)</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            placeholder="Aparece na lista do blog e nas redes sociais. 1 a 2 frases."
            className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-3 text-ink/75 resize-none"
          />
        </label>

        <div className="editorial-card rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest3 text-toffee">
            <Search className="h-3.5 w-3.5" /> SEO
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Título SEO</span>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Vazio usa o título do post"
              className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink mt-1"
            />
          </label>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Meta descrição</span>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              placeholder="Resumo que aparece no Google (até ~155 caracteres)."
              className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink/75 mt-1 resize-none"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Palavra-chave foco</span>
              <input
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                placeholder="ex: laser fotona"
                className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink mt-1"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Palavras-chave (vírgula)</span>
              <input
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                placeholder="laser, rejuvenescimento, pele"
                className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink mt-1"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest3 text-ink/55">URL canônica (opcional)</span>
            <input
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              placeholder="https://draannabomtempo.com.br/blog/..."
              className="w-full bg-transparent border-b border-cocoa/15 focus:border-cocoa outline-none py-2 text-ink mt-1"
            />
          </label>
          <label className="flex items-center justify-between gap-3 pt-1 cursor-pointer">
            <span className="text-[11px] text-ink/65">Não indexar no Google (noindex)</span>
            <input
              type="checkbox"
              checked={noIndex}
              onChange={(e) => setNoIndex(e.target.checked)}
              className="peer sr-only"
            />
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors duration-200 peer-checked:bg-cocoa after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="editorial-card rounded-3xl p-6 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
              <option value="archived">Arquivado</option>
            </select>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">Categoria</div>
            <select
              value={category || ""}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent border border-cocoa/20 rounded-full px-4 py-2 text-sm text-ink"
            >
              <option value="">Sem categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-toffee mb-3">Capa</div>
            <CoverImageField
              value={coverImage}
              onChange={setCoverImage}
              getContext={() => ({ title, excerpt })}
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => submit()}
              disabled={pending}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {pending ? "Salvando..." : "Salvar"}
            </button>
            {status !== "published" && (
              <button
                type="button"
                onClick={() => submit("published")}
                disabled={pending}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full border border-cocoa text-cocoa py-3 text-[12px] uppercase tracking-widest2 hover:bg-cocoa hover:text-bone transition-colors"
              >
                <Eye className="h-4 w-4" /> Publicar agora
              </button>
            )}
          </div>
        </div>

        {onDelete && (
          <form action={onDelete}>
            <button
              type="submit"
              onClick={(e) => {
                if (!confirm("Excluir este post? Não dá pra desfazer.")) e.preventDefault();
              }}
              className="w-full inline-flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-red-700 transition-colors py-3"
            >
              <Trash2 className="h-4 w-4" /> Excluir post
            </button>
          </form>
        )}
      </aside>
    </div>
  );
}

function Toolbar({
  editor,
  onInsertImage,
  onInsertVideo,
  onUploadVideo,
  onAddLink,
  uploading,
}: {
  editor: ReturnType<typeof useEditor>;
  onInsertImage: () => void;
  onInsertVideo: () => void;
  onUploadVideo: () => void;
  onAddLink: () => void;
  uploading: boolean;
}) {
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-10px 0px 0px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!editor) return null;
  const btn = stuck
    ? "p-2 rounded-lg text-cream/75 hover:bg-cream/15 hover:text-cream transition-colors"
    : "p-2 rounded-lg text-ink/65 hover:bg-cocoa/10 hover:text-cocoa transition-colors";
  const active = stuck
    ? "bg-cream text-ink shadow-sm hover:bg-cream hover:text-ink"
    : "bg-cocoa text-bone shadow-sm hover:bg-cocoa hover:text-bone";
  const sep = stuck ? "bg-cream/25" : "bg-cocoa/20";
  return (
    <>
    <div ref={sentinel} aria-hidden className="h-px w-full" />
    <div
      style={{ backgroundColor: stuck ? "#2B1F17" : "#FBF7F1" }}
      className={`flex flex-wrap items-center gap-1 rounded-full px-3 py-2 sticky top-2 z-10 transition-all duration-300 border ${
        stuck ? "border-cream/15 shadow-2xl" : "border-cocoa/15"
      }`}
    >
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`${btn} ${editor.isActive("bold") ? active : ""}`}><Bold className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btn} ${editor.isActive("italic") ? active : ""}`}><Italic className="h-4 w-4" /></button>
      <span className={`w-px h-5 mx-1 ${sep}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${btn} ${editor.isActive("heading", { level: 1 }) ? active : ""}`}><Heading1 className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btn} ${editor.isActive("heading", { level: 2 }) ? active : ""}`}><Heading2 className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btn} ${editor.isActive("heading", { level: 3 }) ? active : ""}`}><Heading3 className="h-4 w-4" /></button>
      <span className={`w-px h-5 mx-1 ${sep}`} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btn} ${editor.isActive("bulletList") ? active : ""}`}><List className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btn} ${editor.isActive("orderedList") ? active : ""}`}><ListOrdered className="h-4 w-4" /></button>
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btn} ${editor.isActive("blockquote") ? active : ""}`}><Quote className="h-4 w-4" /></button>
      <span className={`w-px h-5 mx-1 ${sep}`} />
      <button type="button" onClick={onAddLink} className={`${btn} ${editor.isActive("link") ? active : ""}`} title="Link"><Link2 className="h-4 w-4" /></button>
      <button type="button" onClick={onInsertImage} className={btn} title="Imagem"><ImageIcon className="h-4 w-4" /></button>
      <button type="button" onClick={onInsertVideo} className={btn} title="Vídeo do YouTube/Vimeo (colar URL)"><Video className="h-4 w-4" /></button>
      <button type="button" onClick={onUploadVideo} className={btn} title="Enviar vídeo (mp4/webm)"><span className="text-[10px] uppercase tracking-widest2 px-1.5">MP4</span></button>
      {uploading && <span className={`text-[10px] uppercase tracking-widest2 ml-2 ${stuck ? "text-cream/55" : "text-ink/45"}`}>enviando…</span>}
    </div>
    </>
  );
}
