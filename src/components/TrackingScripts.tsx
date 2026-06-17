"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { persistGclid } from "@/lib/tracking";
import type { PublicMarketing } from "@/lib/marketing";

/**
 * Injeta o HTML/JS livre (custom head/body) recriando os <script> para que
 * executem (innerHTML não executa scripts). Limpa ao desmontar.
 */
function RawInjector({ html, target }: { html: string; target: "head" | "body" }) {
  const added = useRef<Node[]>([]);
  useEffect(() => {
    if (!html?.trim()) return;
    const root = target === "head" ? document.head : document.body;
    const tpl = document.createElement("template");
    tpl.innerHTML = html;
    const nodes: Node[] = [];
    tpl.content.childNodes.forEach((node) => {
      let el: Node;
      if (node.nodeName === "SCRIPT") {
        const src = node as HTMLScriptElement;
        const s = document.createElement("script");
        for (const attr of Array.from(src.attributes)) s.setAttribute(attr.name, attr.value);
        s.text = src.text;
        el = s;
      } else {
        el = node.cloneNode(true);
      }
      root.appendChild(el);
      nodes.push(el);
    });
    added.current = nodes;
    return () => {
      added.current.forEach((n) => n.parentNode?.removeChild(n));
      added.current = [];
    };
  }, [html, target]);
  return null;
}

/**
 * Carrega a config pública de marketing do banco e injeta as tags.
 * Não roda no painel (/admin, /login) para não rastrear a área interna.
 */
export function TrackingScripts() {
  const pathname = usePathname();
  const [m, setM] = useState<PublicMarketing | null>(null);
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/login");

  useEffect(() => {
    persistGclid();
  }, []);

  useEffect(() => {
    if (isAdmin) return;
    let alive = true;
    fetch("/api/marketing", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setM(d))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  if (isAdmin || !m || !m.enabled) return null;

  const gtagBaseId = m.ga4Id || m.googleAdsId;

  return (
    <>
      {/* Mapa de conversões do Google Ads disponível p/ os eventos do site */}
      <Script id="ads-conversions" strategy="afterInteractive">
        {`window.__adsConversions = ${JSON.stringify(m.conversions ?? [])};`}
      </Script>

      {/* Google Tag Manager */}
      {m.gtmId && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${m.gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${m.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        </>
      )}

      {/* Google gtag (GA4 + Google Ads) */}
      {gtagBaseId && (
        <>
          <Script
            id="gtag-src"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gtagBaseId}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
gtag('js', new Date());
${m.ga4Id ? `gtag('config', '${m.ga4Id}');` : ""}
${m.googleAdsId ? `gtag('config', '${m.googleAdsId}', {allow_enhanced_conversions:true});` : ""}`}
          </Script>
        </>
      )}

      {/* Meta Pixel */}
      {m.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${m.metaPixelId}');fbq('track','PageView');`}
        </Script>
      )}

      {/* TikTok Pixel */}
      {m.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${m.tiktokPixelId}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}

      {/* Scripts livres */}
      {m.customHead && <RawInjector html={m.customHead} target="head" />}
      {m.customBody && <RawInjector html={m.customBody} target="body" />}
    </>
  );
}
