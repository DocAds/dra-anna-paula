"use client";

import { useRef, useState } from "react";
import { Sparkles, Upload, X } from "lucide-react";
import { generateCoverImage, uploadCoverImage } from "@/app/admin/posts/ai-actions";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Capa do post: preview + upload (convertido pra WebP) + geração por IA.
export function CoverImageField({
  value,
  onChange,
  getContext,
}: {
  value: string;
  onChange: (url: string) => void;
  getContext: () => { title: string; excerpt: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | "ai" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) {
      setError("Imagem acima de 8 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setBusy("upload");
    const fd = new FormData();
    fd.append("file", file);
    const r = await uploadCoverImage(fd);
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
    if (r?.error || !r?.url) {
      setError(r?.error ?? "Falha no upload.");
      return;
    }
    onChange(r.url);
  }

  async function onAi() {
    setError(null);
    const { title, excerpt } = getContext();
    if (!title.trim()) {
      setError("Escreva o título do artigo primeiro.");
      return;
    }
    setBusy("ai");
    const r = await generateCoverImage(title, excerpt);
    setBusy(null);
    if (r?.error || !r?.url) {
      setError(r?.error ?? "Falha ao gerar a capa.");
      return;
    }
    onChange(r.url);
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="capa" className="w-full aspect-[5/4] object-cover rounded-2xl" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa"
          >
            <X className="h-3 w-3" /> Remover capa
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-cocoa/30 p-5 text-center text-sm text-ink/55">
          Sem capa ainda. Envie uma imagem ou gere com IA.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label
          className={`inline-flex items-center justify-center gap-1.5 rounded-full border border-cocoa/30 text-cocoa py-2.5 text-[11px] uppercase tracking-widest2 cursor-pointer hover:bg-cocoa hover:text-bone transition-colors ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          {busy === "upload" ? "Enviando..." : "Upload"}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} disabled={!!busy} />
        </label>
        <button
          type="button"
          onClick={onAi}
          disabled={!!busy}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-cocoa text-bone py-2.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-60"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {busy === "ai" ? "Gerando..." : "Criar com IA"}
        </button>
      </div>

      {error && <p className="text-[11px] text-red-700">{error}</p>}
      {busy === "ai" && (
        <p className="text-[10px] text-ink/45">A IA cria a capa pelo título e resumo. Pode levar alguns segundos.</p>
      )}
    </div>
  );
}
