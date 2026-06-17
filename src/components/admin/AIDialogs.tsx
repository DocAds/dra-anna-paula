"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Sparkles, Settings2 } from "lucide-react";

type Provider = "gemini" | "openai" | "anthropic";

const PROVIDERS: { v: Provider; l: string; defaultModel: string; models: string[] }[] = [
  { v: "gemini", l: "Google Gemini", defaultModel: "gemini-2.5-flash", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-pro-preview"] },
  { v: "openai", l: "OpenAI ChatGPT", defaultModel: "gpt-4o-mini", models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1"] },
  { v: "anthropic", l: "Anthropic Claude", defaultModel: "claude-sonnet-4-6", models: ["claude-sonnet-4-6", "claude-haiku-4-5", "claude-opus-4-8"] },
];

type SaveCfg = {
  provider: Provider;
  api_token?: string;
  instructions: string;
  model: string;
};

type InitialCfg = {
  provider?: Provider;
  model?: string;
  instructions?: string;
  hasToken?: boolean;
};

const DEFAULT_INSTRUCTIONS =
  "Você escreve para o blog da Dra. Anna Paula Bomtempo (dermatologista premium em São Paulo). Tom editorial, elegante, em português do Brasil. Quiet beauty, sem exageros. NUNCA prometa resultado, NUNCA mencione antes e depois. Em conformidade com o Código de Ética Médica e CFM 1.974/2011. Use HTML simples (h2, h3, p, ul, strong, em) sem inline styles.";

// Custo aproximado de geração. Preços em USD por 1M tokens (estimativa).
const USD_BRL = 5.4;
const ARTIGO_IN = 500; // tokens do prompt
const ARTIGO_OUT = 3000; // tokens do artigo gerado (~1200 a 2000 palavras em HTML)
const IMAGEM_USD = 0.04; // 1 imagem de capa, gerada à parte
const PRICING: Record<string, { in: number; out: number }> = {
  "gemini-2.5-flash": { in: 0.3, out: 2.5 },
  "gemini-2.5-pro": { in: 1.25, out: 10 },
  "gemini-3-pro-preview": { in: 2, out: 12 },
  "gpt-4o-mini": { in: 0.15, out: 0.6 },
  "gpt-4o": { in: 2.5, out: 10 },
  "gpt-4.1": { in: 2, out: 8 },
  "claude-haiku-4-5": { in: 1, out: 5 },
  "claude-sonnet-4-6": { in: 3, out: 15 },
  "claude-opus-4-8": { in: 5, out: 25 },
};
function artigoUsd(model: string): number | null {
  const p = PRICING[model];
  if (!p) return null;
  return (ARTIGO_IN * p.in + ARTIGO_OUT * p.out) / 1_000_000;
}
function brl(usd: number): string {
  const v = usd * USD_BRL;
  if (v < 0.01) return "< R$ 0,01";
  return "R$ " + v.toFixed(2).replace(".", ",");
}

export function AIConfigDialog({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: InitialCfg | null;
  onSave: (c: SaveCfg) => Promise<void>;
}) {
  const [provider, setProvider] = useState<Provider>((initial?.provider as Provider) || "gemini");
  const [token, setToken] = useState("");
  const [model, setModel] = useState(initial?.model || "");
  const [instructions, setInstructions] = useState(initial?.instructions || DEFAULT_INSTRUCTIONS);
  const [showToken, setShowToken] = useState(false);
  const [pending, start] = useTransition();
  const hasToken = Boolean(initial?.hasToken);

  useEffect(() => {
    if (!model && PROVIDERS.find((p) => p.v === provider)) {
      setModel(PROVIDERS.find((p) => p.v === provider)!.defaultModel);
    }
  }, [provider, model]);

  if (!open) return null;
  const current = PROVIDERS.find((p) => p.v === provider)!;

  async function save() {
    start(async () => {
      try {
        await onSave({ provider, api_token: token, instructions, model: model || current.defaultModel });
        onClose();
      } catch (e) {
        alert(String(e));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-porcelain rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-ink/45 hover:text-cocoa">
          <X className="h-5 w-5" />
        </button>
        <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-4 flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5" /> Configurar IA
        </div>
        <h2 className="font-display text-3xl text-ink mb-6">Token e personalização</h2>

        <div className="space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-3">Escolha a IA</div>
            <div className="grid grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p.v}
                  type="button"
                  onClick={() => { setProvider(p.v); setModel(p.defaultModel); }}
                  className={`rounded-2xl border px-3 py-3 text-sm transition-colors ${
                    provider === p.v
                      ? "bg-cocoa text-bone border-cocoa"
                      : "border-cocoa/15 text-ink/65 hover:border-cocoa"
                  }`}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">Modelo</div>
            <select
              value={current.models.includes(model) ? model : model || current.defaultModel}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-2.5 text-ink"
            >
              {(model && !current.models.includes(model)
                ? [model, ...current.models]
                : current.models
              ).map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">Token de API</div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={hasToken ? "•••••••••• configurado — deixe em branco para manter" : "Cole a chave de API aqui"}
                autoComplete="off"
                className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-2 pr-16 text-ink font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest2 text-cocoa px-2"
              >
                {showToken ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {hasToken && (
              <div className="text-[10px] text-emerald-700 mt-2">
                ✓ Token já configurado. Por segurança ele não é exibido. Deixe em branco para manter, ou cole um novo para substituir.
              </div>
            )}
            <div className="text-[10px] text-ink/45 mt-1">
              {provider === "gemini" && "Pegue em aistudio.google.com/app/apikey"}
              {provider === "openai" && "Pegue em platform.openai.com/api-keys"}
              {provider === "anthropic" && "Pegue em console.anthropic.com"}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">
              Instrução / personalização da IA
            </div>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={8}
              className="w-full bg-porcelain border border-cocoa/15 rounded-2xl p-3 text-ink text-sm resize-none focus:border-cocoa outline-none"
            />
            <div className="text-[10px] text-ink/45 mt-1">
              Diz pra IA como escrever. Tom, estilo, restrições éticas, vocabulário.
            </div>
          </div>

          {(() => {
            const a = artigoUsd(model || current.defaultModel);
            return (
              <div className="rounded-2xl bg-cocoa/5 border border-cocoa/10 p-4">
                <span className="block text-[10px] uppercase tracking-widest3 text-toffee mb-1.5">
                  Custo aproximado por publicação
                </span>
                <p className="text-[13px] text-ink/80 leading-relaxed">
                  {a != null ? (
                    <>
                      Artigo: <strong className="text-ink">{brl(a)}</strong> · Imagem de capa:{" "}
                      <strong className="text-ink">{brl(IMAGEM_USD)}</strong> · Total:{" "}
                      <strong className="text-cocoa">{brl(a + IMAGEM_USD)}</strong>
                    </>
                  ) : (
                    <>
                      Imagem de capa: <strong className="text-ink">{brl(IMAGEM_USD)}</strong>
                    </>
                  )}
                </p>
                <span className="block text-[10px] text-ink/55 mt-1.5">
                  Estimativa: 1 artigo (1.200 a 2.000 palavras) + 1 imagem (gerada à parte). Varia com o
                  tamanho do texto e o câmbio (USD ≈ R$ {USD_BRL.toFixed(2).replace(".", ",")}).
                </span>
              </div>
            );
          })()}

          <button
            type="button"
            onClick={save}
            disabled={pending || (!token && !hasToken)}
            className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </div>
    </div>
  );
}

export type GeneratedArticle = {
  title: string;
  excerpt: string;
  body_html: string;
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  keywords: string[];
};

export function AIGenerateDialog({
  open,
  onClose,
  onGenerate,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (input: { topic: string; description: string }) => Promise<GeneratedArticle>;
  onResult: (article: GeneratedArticle, topic: string) => void;
}) {
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function go() {
    if (!topic.trim()) return;
    setError(null);
    start(async () => {
      try {
        const article = await onGenerate({ topic, description });
        onResult(article, topic);
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-porcelain rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-ink/45 hover:text-cocoa">
          <X className="h-5 w-5" />
        </button>
        <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-4 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" /> Criar com IA
        </div>
        <h2 className="font-display text-3xl text-ink mb-6">Gerar artigo</h2>

        <div className="space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">Tópico</div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Benefícios do Ultraformer MPT em pacientes a partir dos 40"
              className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink"
            />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">
              Descrição / direcionamento
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Ex: Foco em explicar como o tratamento age na camada SMAS. Voz para mulheres 40+. Mencionar protocolo de sessões anuais. Sem prometer resultado."
              className="w-full bg-porcelain border border-cocoa/15 rounded-2xl p-3 text-ink text-sm resize-none focus:border-cocoa outline-none"
            />
            <div className="text-[10px] text-ink/45 mt-1">
              A IA segue também a personalização global definida no botão "Configurar IA".
            </div>
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button
            type="button"
            onClick={go}
            disabled={pending || !topic.trim()}
            className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
          >
            {pending ? "Gerando artigo..." : "Gerar artigo"}
          </button>
        </div>
      </div>
    </div>
  );
}
