"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { getConsent, onConsentChange, type ConsentState } from "@/lib/consent";
import { newEventId, trackLead, trackWhatsappClick } from "@/lib/tracking";

// Painel de diagnóstico de tracking. Só liga com ?trackdebug=docads na URL e
// fica ativo (via sessionStorage) até ser fechado. Escuta o evento espelho
// "anna:track:debug" (disparado por tracking.ts) e envolve dataLayer.push para
// mostrar, ao vivo, o que Pixel / GA4 / Ads estão recebendo.

const QUERY_KEY = "trackdebug";
const STORAGE_KEY = "anna:trackdebug";
const ACCEPTED = new Set(["docads", "1"]);
const MAX_ROWS = 60;

type Kind = "meta" | "ga4" | "ads" | "consent" | "site";

type Row = {
  id: string;
  t: number;
  kind: Kind;
  label: string;
  detail?: string;
};

const KIND_STYLE: Record<Kind, string> = {
  meta: "bg-sky-400/15 text-sky-200",
  ga4: "bg-emerald-400/15 text-emerald-200",
  ads: "bg-amber-400/15 text-amber-200",
  consent: "bg-white/10 text-white/70",
  site: "bg-orange-400/15 text-orange-200",
};

const KIND_LABEL: Record<Kind, string> = {
  meta: "Meta",
  ga4: "GA4",
  ads: "Ads",
  consent: "Consent",
  site: "Site",
};

function hhmmss(t: number) {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function TrackingDebugPanel() {
  const [active, setActive] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [consent, setConsentState] = useState<ConsentState>({ analytics: false, marketing: false });
  const [status, setStatus] = useState({ fbq: false, gtag: false, ads: 0 });
  const seq = useRef(0);

  const push = useCallback((kind: Kind, label: string, detail?: string) => {
    seq.current += 1;
    const row: Row = { id: `${Date.now()}-${seq.current}`, t: Date.now(), kind, label, detail };
    setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
  }, []);

  // Ativação: query param liga e persiste; sem persistência, fica desligado.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const val = new URLSearchParams(window.location.search).get(QUERY_KEY);
    if (val && ACCEPTED.has(val)) sessionStorage.setItem(STORAGE_KEY, "1");
    setActive(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // Escuta o espelho do tracking.ts (eventos de Meta/GA4/Ads do próprio site).
  useEffect(() => {
    if (!active) return;
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail as {
        type?: string;
        source?: string;
        fbq?: boolean;
        gtag?: boolean;
        ads?: number;
      };
      const alvo = [
        d.fbq ? "Pixel" : "sem Pixel",
        d.gtag ? "GA4" : "sem GA4",
        `${d.ads ?? 0} Ads`,
      ].join(" · ");
      push("site", `Disparou "${d.type}"`, `origem ${d.source ?? "?"} → ${alvo}`);
    };
    window.addEventListener("anna:track:debug", handler);
    return () => window.removeEventListener("anna:track:debug", handler);
  }, [active, push]);

  // Envolve dataLayer.push para ler tudo que gtag/GTM recebe.
  useEffect(() => {
    if (!active || typeof window === "undefined") return;
    const dl = (window.dataLayer = window.dataLayer || []) as unknown[] & {
      push: (...a: unknown[]) => number;
      __annaDebug?: boolean;
    };
    if (dl.__annaDebug) return;
    const orig = dl.push.bind(dl);
    dl.__annaDebug = true;
    dl.push = (...items: unknown[]) => {
      for (const item of items) logDataLayer(item, push);
      return orig(...items);
    };
    return () => {
      dl.push = orig;
      dl.__annaDebug = false;
    };
  }, [active, push]);

  // Status ao vivo: Pixel/GA4 carregados, nº de conversões Ads, consentimento.
  useEffect(() => {
    if (!active) return;
    setConsentState(getConsent());
    const off = onConsentChange(setConsentState);
    const tick = () =>
      setStatus({
        fbq: typeof window.fbq === "function",
        gtag: typeof window.gtag === "function",
        ads: Array.isArray(window.__adsConversions) ? window.__adsConversions.length : 0,
      });
    tick();
    const id = window.setInterval(tick, 1500);
    return () => {
      off();
      window.clearInterval(id);
    };
  }, [active]);

  if (!active) return null;

  const close = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setActive(false);
  };

  return (
    <aside
      className="fixed bottom-3 right-3 z-[9999] flex w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 text-bone shadow-2xl backdrop-blur"
      aria-label="Diagnóstico de tracking"
    >
      <header className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest2">Diagnóstico de tracking</span>
        <button
          onClick={close}
          className="grid h-7 w-7 place-items-center rounded-full text-bone/60 hover:bg-white/10 hover:text-bone"
          aria-label="Fechar diagnóstico"
        >
          <X size={15} />
        </button>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b border-white/10 px-3 py-2 text-[10px]">
        <Chip on={status.fbq} label="Pixel" />
        <Chip on={status.gtag} label="GA4/Ads" />
        <Chip on={consent.analytics} label="Analytics" />
        <Chip on={consent.marketing} label="Marketing" />
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-bone/70">{status.ads} conv. Ads</span>
      </div>

      <div className="flex gap-1.5 border-b border-white/10 px-3 py-2">
        <button
          onClick={() => trackLead({ source: "debug-panel", eventId: newEventId() })}
          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] hover:bg-white/20"
        >
          Testar Lead
        </button>
        <button
          onClick={() => trackWhatsappClick("debug-panel")}
          className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] hover:bg-white/20"
        >
          Testar WhatsApp
        </button>
        <button
          onClick={() => setRows([])}
          className="ml-auto rounded-full px-2.5 py-1 text-[11px] text-bone/60 hover:bg-white/10"
        >
          Limpar
        </button>
      </div>

      <ul className="max-h-[42vh] divide-y divide-white/5 overflow-y-auto text-[11px]">
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-bone/50">
            Aguardando eventos. Aceite os cookies, clique num CTA de WhatsApp ou envie o formulário.
          </li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="flex items-start gap-2 px-3 py-2">
              <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase ${KIND_STYLE[r.kind]}`}>
                {KIND_LABEL[r.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block leading-tight">{r.label}</span>
                {r.detail ? <span className="block text-bone/50">{r.detail}</span> : null}
              </span>
              <time className="shrink-0 tabular-nums text-bone/40">{hhmmss(r.t)}</time>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

function Chip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 ${on ? "bg-emerald-400/20 text-emerald-200" : "bg-white/10 text-bone/50"}`}
    >
      {on ? "●" : "○"} {label}
    </span>
  );
}

// Traduz um item do dataLayer para uma linha legível. Ignora ruído (js/set) e
// os pushes de objeto do próprio site (já cobertos pelo espelho anna:track:debug).
function logDataLayer(item: unknown, push: (k: Kind, l: string, d?: string) => void) {
  // Chamadas gtag chegam como arguments: [comando, alvo, params?]
  if (item && typeof item === "object" && "0" in (item as Record<string, unknown>)) {
    const args = Array.from(item as ArrayLike<unknown>);
    const cmd = String(args[0] ?? "");
    const name = String(args[1] ?? "");
    if (cmd === "event") {
      if (name === "conversion") return push("ads", "Ads: conversion");
      return push("ga4", `GA4 event: ${name}`);
    }
    if (cmd === "consent") return push("consent", `Consent ${name}`);
    if (cmd === "config") return push("ga4", `GA4 config: ${name}`);
    return;
  }
  // Pushes de objeto do site: pula lead/whatsapp (já vêm pelo espelho).
  if (item && typeof item === "object" && "event" in (item as Record<string, unknown>)) {
    const ev = String((item as { event: unknown }).event ?? "");
    if (ev === "lead" || ev === "whatsapp_click") return;
    push("site", `dataLayer: ${ev}`);
  }
}
