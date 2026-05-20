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
  Settings2,
  Sparkles,
} from "lucide-react";
import { AIConfigDialog, AIGenerateDialog } from "./AIDialogs";
import { saveAiConfig, generateArticle } from "@/app/admin/posts/ai-actions";
import type { Post, PostStatus } from "@/lib/supabase/types";

type Props = {
  initial?: Partial<Post>;
  onSubmit: (formData: FormData) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  postId?: string;
  categories?: { name: string }[];
  aiConfig?: { provider?: string; api_token?: string; instructions?: string; model?: string } | null;
};

const _LEGACY = [
  "Skincare",
  "Saúde",
  "Lifestyle",
  "Tecnologia",
  "Medicina",
  "Nutrição",
] as const;

export function PostEditor({ initial, onSubmit, onDelete, postId, categories, aiConfig }: Props) {
  const router = useRouter();
  const CATEGORIAS = categories?.map((c) => c.name) ?? _LEGACY;
  const [pending, startTransition] = useTransition();
  const [aiConfigOpen, setAiConfigOpen] = useState(false);
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

  async function onCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadFile(file);
    if (url) setCoverImage(url);
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
          <button
            type="button"
            onClick={() => setAiConfigOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-cocoa/30 text-cocoa px-4 py-2 text-[11px] uppercase tracking-widest2 hover:bg-cocoa hover:text-bone transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" /> Configurar IA
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

        <AIConfigDialog
          open={aiConfigOpen}
          onClose={() => setAiConfigOpen(false)}
          initial={aiConfig ? {
            provider: (aiConfig.provider as "gemini" | "openai" | "anthropic") || "gemini",
            api_token: aiConfig.api_token || "",
            instructions: aiConfig.instructions || "",
            model: aiConfig.model || "",
          } : null}
          onSave={saveAiConfig}
        />
        <AIGenerateDialog
          open={aiGenOpen}
          onClose={() => setAiGenOpen(false)}
          onGenerate={generateArticle}
          onResult={(html, t) => {
            if (!title) setTitle(t);
            editor?.commands.setContent(html);
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
            {coverImage ? (
              <div className="space-y-3">
                <img src={coverImage} alt="capa" className="w-full aspect-[5/4] object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => setCoverImage("")}
                  className="text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa"
                >
                  Remover capa
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer border border-dashed border-cocoa/30 rounded-2xl p-6 text-center text-sm text-ink/55 hover:border-cocoa hover:text-cocoa transition-colors">
                {uploading ? "Enviando..." : "Clique para enviar imagem"}
                <input type="file" accept="image/*" className="hidden" onChange={onCoverUpload} />
              </label>
            )}
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
    : "bg-ink text-bone shadow-sm hover:bg-ink hover:text-bone";
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
