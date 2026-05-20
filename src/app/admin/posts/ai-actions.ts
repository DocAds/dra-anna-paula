"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAiConfig(input: {
  provider: "gemini" | "openai" | "anthropic";
  api_token: string;
  instructions: string;
  model: string;
}) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { error } = await sb
    .from("ai_settings")
    .update({
      provider: input.provider,
      api_token: input.api_token,
      instructions: input.instructions,
      model: input.model,
      updated_by: user?.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/posts");
}

export async function getAiConfig() {
  const sb = await createClient();
  const { data } = await sb.from("ai_settings").select("*").eq("id", 1).maybeSingle();
  return data;
}

export async function generateArticle(input: { topic: string; description: string }) {
  const sb = await createClient();
  const { data: cfg } = await sb.from("ai_settings").select("*").eq("id", 1).maybeSingle();
  if (!cfg?.api_token) throw new Error("Configure o token da IA primeiro.");

  const baseInstructions =
    cfg.instructions ||
    "Você escreve em português do Brasil, tom editorial e elegante, sem promessas terapêuticas, sem antes-e-depois, em conformidade com o Código de Ética Médica e CFM 1.974/2011. Use HTML simples (h2, h3, p, ul, strong, em) sem inline styles.";

  const userPrompt =
    `Escreva um artigo completo para o blog da Dra. Anna Bomtempo (dermatologista premium em São Paulo).\n\n` +
    `Tópico: ${input.topic}\n\n` +
    `Direcionamento: ${input.description}\n\n` +
    `Retorne SOMENTE o HTML do conteúdo do artigo (sem <html>, <head> ou <body>). ` +
    `Use h2 para o título principal, h3 para subtítulos, p para parágrafos, ul/li para listas. ` +
    `Não inclua imagens nem estilos inline. Mínimo de 600 palavras.`;

  try {
    if (cfg.provider === "gemini") {
      const model = cfg.model || "gemini-2.5-flash";
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": cfg.api_token },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: baseInstructions }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message || "Erro Gemini");
      return j.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message || "Erro OpenAI");
      return j.choices?.[0]?.message?.content || "";
    }

    if (cfg.provider === "anthropic") {
      const model = cfg.model || "claude-sonnet-4-5";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.api_token,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: baseInstructions,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error?.message || "Erro Anthropic");
      return j.content?.[0]?.text || "";
    }

    throw new Error("Provider desconhecido");
  } catch (e) {
    throw new Error(`Falha ao gerar: ${e instanceof Error ? e.message : String(e)}`);
  }
}
