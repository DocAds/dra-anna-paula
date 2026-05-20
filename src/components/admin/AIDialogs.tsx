"use client";

import { useEffect, useState, useTransition } from "react";
import { X, Sparkles, Settings2 } from "lucide-react";

type Provider = "gemini" | "openai" | "anthropic";

const PROVIDERS: { v: Provider; l: string; defaultModel: string; modelHelp: string }[] = [
  { v: "gemini", l: "Google Gemini", defaultModel: "gemini-2.5-flash", modelHelp: "Ex: gemini-2.5-flash, gemini-3-pro-preview" },
  { v: "openai", l: "OpenAI ChatGPT", defaultModel: "gpt-4o-mini", modelHelp: "Ex: gpt-4o, gpt-4o-mini, gpt-4.1" },
  { v: "anthropic", l: "Anthropic Claude", defaultModel: "claude-sonnet-4-5", modelHelp: "Ex: claude-sonnet-4-5, claude-haiku-4-5" },
];

type Cfg = {
  provider: Provider;
  api_token: string;
  instructions: string;
  model: string;
};

const DEFAULT_INSTRUCTIONS =
  "Você escreve para o blog da Dra. Anna Paula Bomtempo (dermatologista premium em São Paulo). Tom editorial, elegante, em português do Brasil. Quiet beauty, sem exageros. NUNCA prometa resultado, NUNCA mencione antes e depois. Em conformidade com o Código de Ética Médica e CFM 1.974/2011. Use HTML simples (h2, h3, p, ul, strong, em) sem inline styles.";

export function AIConfigDialog({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Partial<Cfg> | null;
  onSave: (c: Cfg) => Promise<void>;
}) {
  const [provider, setProvider] = useState<Provider>((initial?.provider as Provider) || "gemini");
  const [token, setToken] = useState(initial?.api_token || "");
  const [model, setModel] = useState(initial?.model || "");
  const [instructions, setInstructions] = useState(initial?.instructions || DEFAULT_INSTRUCTIONS);
  const [showToken, setShowToken] = useState(false);
  const [pending, start] = useTransition();

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
            <input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={current.defaultModel}
              className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-2 text-ink"
            />
            <div className="text-[10px] text-ink/45 mt-1">{current.modelHelp}</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-2">Token de API</div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole a chave de API aqui"
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

          <button
            type="button"
            onClick={save}
            disabled={pending || !token}
            className="w-full rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
          >
            {pending ? "Salvando..." : "Salvar configuração"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AIGenerateDialog({
  open,
  onClose,
  onGenerate,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  onGenerate: (input: { topic: string; description: string }) => Promise<string>;
  onResult: (html: string, topic: string) => void;
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
        const html = await onGenerate({ topic, description });
        onResult(html, topic);
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
