"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";
import { saveMarketing, type MarketingInput } from "./actions";
import type { GoogleAdsConversion, ConversionEvent, MarketingSettings } from "@/lib/marketing";

const EVENT_LABELS: Record<ConversionEvent, string> = {
  lead: "Formulário de contato",
  whatsapp: "Clique no WhatsApp",
  agendamento: "Agendamento",
  pageview: "Visualização de página",
};

const field =
  "w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-sm text-ink transition-colors";
const labelCls = "text-[11px] uppercase tracking-widest3 text-ink/70 mb-2 block";
const card = "editorial-card rounded-3xl p-7 md:p-8";
const sectionTitle = "font-display text-2xl text-ink mb-1";
const sectionSub = "text-xs text-ink/65 mb-6";

export function MarketingForm({
  settings,
  hasCapiToken,
}: {
  settings: MarketingSettings;
  hasCapiToken: boolean;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [gtm, setGtm] = useState(settings.gtm_id ?? "");
  const [ga4, setGa4] = useState(settings.ga4_id ?? "");
  const [adsId, setAdsId] = useState(settings.google_ads_id ?? "");
  const [conversions, setConversions] = useState<GoogleAdsConversion[]>(
    settings.google_ads_conversions ?? []
  );
  const [pixel, setPixel] = useState(settings.meta_pixel_id ?? "");
  const [capiToken, setCapiToken] = useState("");
  const [capiTest, setCapiTest] = useState(settings.meta_capi_test_code ?? "");
  const [tiktok, setTiktok] = useState(settings.tiktok_pixel_id ?? "");
  const [customHead, setCustomHead] = useState(settings.custom_head ?? "");
  const [customBody, setCustomBody] = useState(settings.custom_body ?? "");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GoogleAdsConversion | null>(null);

  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function openNew() {
    setEditing({ id: crypto.randomUUID(), nome: "", conversionId: adsId || "", label: "", event: "lead" });
    setModalOpen(true);
  }
  function openEdit(c: GoogleAdsConversion) {
    setEditing({ ...c });
    setModalOpen(true);
  }
  function saveConversion() {
    if (!editing) return;
    setConversions((prev) => {
      const exists = prev.some((c) => c.id === editing.id);
      return exists ? prev.map((c) => (c.id === editing.id ? editing : c)) : [...prev, editing];
    });
    setModalOpen(false);
    setEditing(null);
  }
  function removeConversion(id: string) {
    setConversions((prev) => prev.filter((c) => c.id !== id));
  }

  function onSave() {
    setMsg(null);
    const input: MarketingInput = {
      enabled,
      gtm_id: gtm,
      ga4_id: ga4,
      google_ads_id: adsId,
      google_ads_conversions: conversions,
      meta_pixel_id: pixel,
      meta_capi_token: capiToken,
      meta_capi_test_code: capiTest,
      tiktok_pixel_id: tiktok,
      custom_head: customHead,
      custom_body: customBody,
    };
    startTransition(async () => {
      try {
        await saveMarketing(input);
        setCapiToken("");
        setMsg({ ok: true, text: "Configurações salvas e publicadas no site." });
      } catch (e) {
        setMsg({ ok: false, text: e instanceof Error ? e.message : "Erro ao salvar." });
      }
    });
  }

  return (
    <div className="grid gap-6 max-w-3xl">
      {/* Status geral */}
      <div className={card}>
        <label className="flex items-center justify-between gap-4 cursor-pointer">
          <span>
            <span className={sectionTitle}>Rastreamento ativo</span>
            <span className="block text-xs text-ink/65">
              Desligue para suspender todas as tags no site sem apagar as configurações.
            </span>
          </span>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-toffee" : "bg-ink/25"}`}
            aria-pressed={enabled}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`}
            />
          </button>
        </label>
      </div>

      {/* Google */}
      <div className={card}>
        <h2 className={sectionTitle}>Google</h2>
        <p className={sectionSub}>Tag Manager, GA4 e Google Ads.</p>
        <div className="grid gap-5">
          <div>
            <label className={labelCls}>Google Tag Manager (Container ID)</label>
            <input className={field} placeholder="GTM-XXXXXXX" value={gtm} onChange={(e) => setGtm(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GA4 (Measurement ID)</label>
            <input className={field} placeholder="G-XXXXXXXXXX" value={ga4} onChange={(e) => setGa4(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Google Ads (ID de conversão)</label>
            <input className={field} placeholder="AW-XXXXXXXXX" value={adsId} onChange={(e) => setAdsId(e.target.value)} />
          </div>

          {/* Conversões */}
          <div className="border-t border-ink/10 pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[11px] uppercase tracking-widest3 text-ink/70 block">Conversões do Google Ads</span>
                <span className="text-xs text-ink/60">Cada conversão tem um ID e um rótulo e dispara num evento do site.</span>
              </div>
              <button
                type="button"
                onClick={openNew}
                className="flex items-center gap-2 rounded-xl bg-cocoa text-bone px-4 py-2.5 text-sm font-medium hover:opacity-90 transition shrink-0"
              >
                <Plus className="h-4 w-4" /> Adicionar conversão
              </button>
            </div>

            {conversions.length === 0 ? (
              <p className="text-sm text-ink/55 py-4 text-center border border-dashed border-ink/20 rounded-xl">
                Nenhuma conversão cadastrada.
              </p>
            ) : (
              <ul className="grid gap-2">
                {conversions.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink font-medium truncate">{c.nome || "Conversão"}</div>
                      <div className="text-[11px] text-ink/65 truncate">
                        {c.conversionId}/{c.label} · {EVENT_LABELS[c.event]}
                      </div>
                    </div>
                    <button type="button" onClick={() => openEdit(c)} className="grid place-items-center h-11 w-11 shrink-0 rounded-full text-ink/60 hover:text-cocoa transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/40" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => removeConversion(c.id)} className="grid place-items-center h-11 w-11 shrink-0 rounded-full text-ink/60 hover:text-rose-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/50" aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className={card}>
        <h2 className={sectionTitle}>Meta (Facebook / Instagram)</h2>
        <p className={sectionSub}>Pixel no navegador e Conversions API (server-side, com dedupe por eventID).</p>
        <div className="grid gap-5">
          <div>
            <label className={labelCls}>Pixel ID</label>
            <input className={field} placeholder="000000000000000" value={pixel} onChange={(e) => setPixel(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Token da Conversions API (segredo)</label>
            <input
              className={field}
              type="password"
              placeholder={hasCapiToken ? "•••••••••• configurado — deixe em branco para manter" : "EAAB..."}
              value={capiToken}
              onChange={(e) => setCapiToken(e.target.value)}
              autoComplete="off"
            />
            {hasCapiToken ? (
              <span className="text-[11px] text-emerald-700 mt-1 block">
                ✓ Token já configurado. Por segurança ele não é exibido. Deixe em branco para manter.
              </span>
            ) : (
              <span className="text-[11px] text-ink/60 mt-1 block">Guardado de forma segura, usado só no servidor.</span>
            )}
          </div>
          <div>
            <label className={labelCls}>Código de teste da CAPI (opcional)</label>
            <input className={field} placeholder="TEST12345" value={capiTest} onChange={(e) => setCapiTest(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TikTok */}
      <div className={card}>
        <h2 className={sectionTitle}>TikTok</h2>
        <p className={sectionSub}>Pixel do TikTok Ads.</p>
        <div>
          <label className={labelCls}>TikTok Pixel ID</label>
          <input className={field} placeholder="CXXXXXXXXXXXXXXXXXX" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
        </div>
      </div>

      {/* Scripts livres */}
      <div className={card}>
        <h2 className={sectionTitle}>Scripts personalizados</h2>
        <p className={sectionSub}>Cole qualquer tag (Hotjar, Clarity, LinkedIn, verificações). Aceita HTML e script.</p>
        <div className="grid gap-5">
          <div>
            <label className={labelCls}>No &lt;head&gt;</label>
            <textarea className={`${field} font-mono text-xs`} rows={4} placeholder="<script>...</script>" value={customHead} onChange={(e) => setCustomHead(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>No fim do &lt;body&gt;</label>
            <textarea className={`${field} font-mono text-xs`} rows={4} placeholder="<script>...</script>" value={customBody} onChange={(e) => setCustomBody(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Salvar */}
      <div className="flex items-center gap-4 sticky bottom-4">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="rounded-full bg-cocoa text-bone px-7 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar e publicar"}
        </button>
        {msg && (
          <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</span>
        )}
      </div>

      {/* Modal de conversão */}
      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="bg-bone rounded-3xl p-7 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl text-ink">Conversão do Google Ads</h3>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar" className="grid place-items-center h-10 w-10 -mr-1 rounded-full text-ink/60 hover:text-ink hover:bg-cocoa/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/40">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <label className={labelCls}>Nome (referência interna)</label>
                <input className={field} placeholder="Ex: Lead formulário" value={editing.nome} onChange={(e) => setEditing({ ...editing, nome: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>ID da conversão</label>
                <input className={field} placeholder="AW-XXXXXXXXX" value={editing.conversionId} onChange={(e) => setEditing({ ...editing, conversionId: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Rótulo</label>
                <input className={field} placeholder="abcDEF12gHIjkl" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>Disparar no evento</label>
                <select className={field} value={editing.event} onChange={(e) => setEditing({ ...editing, event: e.target.value as ConversionEvent })}>
                  {Object.entries(EVENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-5 py-2.5 text-sm text-ink/70 hover:bg-ink/5 transition">
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveConversion}
                disabled={!editing.conversionId.trim() || !editing.label.trim()}
                className="flex items-center gap-2 rounded-xl bg-cocoa text-bone px-5 py-2.5 text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
              >
                <Check className="h-4 w-4" /> Salvar conversão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
