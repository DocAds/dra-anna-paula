"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const COVER_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// Sobe um buffer de imagem no bucket "blog" e devolve a URL pública.
async function uploadImage(buf: Buffer, ext: string, contentType: string): Promise<{ url?: string; error?: string }> {
  const sb = await createClient();
  const path = `cover/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from("blog").upload(path, buf, {
    cacheControl: "31536000",
    upsert: false,
    contentType,
  });
  if (error) return { error: `Upload: ${error.message}` };
  const { data } = sb.storage.from("blog").getPublicUrl(path);
  return { url: data.publicUrl };
}

// Upload manual de capa — converte qualquer imagem para WebP antes de salvar.
export async function uploadCoverImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Arquivo inválido." };
  if (!file.type.startsWith("image/")) return { error: "Envie um arquivo de imagem." };
  if (file.size > COVER_MAX_BYTES) return { error: "Imagem acima de 8 MB." };
  try {
    const input = Buffer.from(await file.arrayBuffer());
    // Import dinâmico do sharp (compat. Vercel) — converte tudo para WebP.
    const sharp = (await import("sharp")).default;
    const webp = await sharp(input).webp({ quality: 82 }).toBuffer();
    return await uploadImage(webp, "webp", "image/webp");
  } catch (e) {
    return { error: `Não consegui processar a imagem: ${e instanceof Error ? e.message : String(e)}` };
  }
}

// Geração de capa por IA (Gemini image / nano-banana) → WebP no bucket.
export async function generateCoverImage(title: string, excerpt: string): Promise<{ url?: string; error?: string }> {
  const sb = await createClient();
  const { data: cfg } = await sb.from("ai_settings").select("provider, api_token").eq("id", 1).maybeSingle();
  // Imagem exige Gemini: usa o token do painel se for Gemini, senão a env global.
  const key = (cfg?.provider === "gemini" && cfg?.api_token) ? cfg.api_token : process.env.GEMINI_API_KEY;
  if (!key) return { error: "Para gerar capas, configure a IA com provider Google Gemini (ou defina GEMINI_API_KEY)." };

  const prompt =
    `Fotografia editorial de dermatologia e estética premium para a capa de um artigo de blog. ` +
    `Tema: "${title}". ${excerpt ? `Contexto: ${excerpt}. ` : ""}` +
    `Estilo clean, luz natural suave, atmosfera de clínica sofisticada, paleta cream, dourado suave e tons de marrom quente. ` +
    `Proporção 16:9, sem nenhum texto, sem letras, sem logotipos, sem rostos reconhecíveis. Estética quiet luxury.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );
    const json = await res.json().catch(() => null);
    if (!res.ok) return { error: `Gemini ${res.status}: ${json?.error?.message || "erro ao gerar"}` };
    const parts = json?.candidates?.[0]?.content?.parts ?? [];
    const img = parts.find((p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData)?.inlineData;
    if (!img?.data) return { error: "A IA não retornou imagem. Tente de novo." };
    const mime = img.mimeType || "image/png";
    const ext = (mime.split("/")[1] || "png").replace("jpeg", "jpg");
    return await uploadImage(Buffer.from(img.data, "base64"), ext, mime);
  } catch (e) {
    return { error: `Falha ao gerar a capa: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function saveAiConfig(input: {
  provider: "gemini" | "openai" | "anthropic";
  api_token?: string;
  instructions: string;
  model: string;
}) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: me } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") throw new Error("Sem permissão");

  // O token só é atualizado quando um novo valor é digitado. Em branco = mantém o atual.
  const update: Record<string, unknown> = {
    provider: input.provider,
    instructions: input.instructions,
    model: input.model,
    updated_by: user?.id,
    updated_at: new Date().toISOString(),
  };
  const token = (input.api_token ?? "").trim();
  if (token) update.api_token = token;

  const { error } = await sb.from("ai_settings").update(update).eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
}

// Nunca devolve o api_token ao cliente — só indica se já existe um configurado.
export async function getAiConfig() {
  const sb = await createClient();
  const { data } = await sb
    .from("ai_settings")
    .select("provider, model, instructions, api_token, updated_at")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return null;
  return {
    provider: data.provider as "gemini" | "openai" | "anthropic" | null,
    model: data.model as string | null,
    instructions: data.instructions as string | null,
    has_token: Boolean(data.api_token),
    updated_at: data.updated_at as string | null,
  };
}

// Remove cercas de código markdown (```html ... ```) que a IA às vezes envolve no conteúdo.
function stripFences(s: string): string {
  let t = s.trim();
  t = t.replace(/^```[a-zA-Z]*\s*\r?\n?/, "");
  t = t.replace(/\r?\n?```\s*$/, "");
  return t.trim();
}

type GeneratedArticle = {
  title: string;
  excerpt: string;
  body_html: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  keywords: string[];
};

// Normaliza a resposta JSON da IA; se não vier JSON, trata tudo como corpo HTML.
function parseArticle(raw: string): GeneratedArticle {
  const empty: GeneratedArticle = {
    title: "", excerpt: "", body_html: "", seo_title: "",
    seo_description: "", focus_keyword: "", keywords: [],
  };
  const clean = stripFences(raw);
  try {
    const o = JSON.parse(clean);
    return {
      title: String(o.title || "").trim(),
      excerpt: String(o.excerpt || "").trim(),
      body_html: stripFences(String(o.body_html || "")).trim(),
      seo_title: String(o.seo_title || "").trim(),
      seo_description: String(o.seo_description || "").trim(),
      focus_keyword: String(o.focus_keyword || "").trim(),
      keywords: Array.isArray(o.keywords)
        ? o.keywords.map((k: unknown) => String(k).trim()).filter(Boolean)
        : [],
    };
  } catch {
    return { ...empty, body_html: clean };
  }
}

export async function generateArticle(input: { topic: string; description: string }): Promise<GeneratedArticle> {
  const sb = await createClient();
  const { data: cfg } = await sb.from("ai_settings").select("*").eq("id", 1).maybeSingle();
  if (!cfg?.api_token) throw new Error("Configure o token da IA primeiro.");

  const baseInstructions =
    cfg.instructions ||
    "Você escreve em português do Brasil, tom editorial e elegante, sem promessas terapêuticas, sem antes-e-depois, em conformidade com o Código de Ética Médica e CFM 1.974/2011.";

  const userPrompt =
    `Você vai escrever um artigo para o blog da Dra. Anna Bomtempo (dermatologista premium em São Paulo).\n\n` +
    `Tema sugerido pelo editor: "${input.topic}"\n` +
    (input.description ? `Direcionamento: ${input.description}\n` : "") +
    `\nResponda APENAS com um JSON válido (sem texto fora do JSON e sem cercas de código), neste formato:\n` +
    `{\n` +
    `  "title": "título jornalístico melhorado e atraente, REESCRITO a partir do tema (NÃO copie o tema literalmente)",\n` +
    `  "excerpt": "resumo de 1 a 2 frases para a lista do blog",\n` +
    `  "seo_title": "título otimizado para SEO, até 60 caracteres",\n` +
    `  "seo_description": "meta descrição persuasiva, até 155 caracteres",\n` +
    `  "focus_keyword": "a palavra-chave principal do artigo",\n` +
    `  "keywords": ["3 a 6 palavras-chave relevantes"],\n` +
    `  "body_html": "o artigo em HTML (h2, h3, p, ul, li, strong, em), entre 1200 e 2000 palavras, sem <html>/<head>/<body>, sem imagens, sem estilos inline e sem blocos de código"\n` +
    `}`;

  if (cfg.provider === "gemini") {
    const model = cfg.model || "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.api_token },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: baseInstructions }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`Falha ao gerar: ${j?.error?.message || "Erro Gemini"}`);
    return parseArticle(j.candidates?.[0]?.content?.parts?.[0]?.text || "");
  }

  if (cfg.provider === "openai") {
    const model = cfg.model || "gpt-4o-mini";
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.api_token}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: baseInstructions },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`Falha ao gerar: ${j?.error?.message || "Erro OpenAI"}`);
    return parseArticle(j.choices?.[0]?.message?.content || "");
  }

  if (cfg.provider === "anthropic") {
    const model = cfg.model || "claude-sonnet-4-6";
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.api_token,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        system: baseInstructions + " Responda apenas com JSON válido, sem texto fora do JSON.",
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: "{" },
        ],
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(`Falha ao gerar: ${j?.error?.message || "Erro Anthropic"}`);
    return parseArticle("{" + (j.content?.[0]?.text || ""));
  }

  throw new Error("Provider desconhecido");
}
