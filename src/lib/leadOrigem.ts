// De onde veio o lead — fonte única de classificação e de rótulo.
//
// Por que existe: a mesma origem precisa aparecer igual no card, no filtro, na
// ficha e no gráfico do dashboard. Enquanto cada tela traduzia por conta, o
// gráfico mostrava o valor cru do banco e a ficha mostrava o texto em
// português, e os dois falavam do mesmo lead.
//
// A cascata de prioridade (clique de anúncio > utm > referrer) é a mesma
// aplicada no insert (api/lead/route.ts) e na migration que preencheu o
// histórico. Mudou aqui, muda nos três.

export type CanalLead =
  | "google-ads"
  | "meta-ads"
  | "google-organico"
  | "social"
  | "whatsapp"
  | "referencia"
  | "direto"
  | "outro";

type OrigemBruta = {
  source?: string | null;
  canal?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
};

export const CANAL_LABEL: Record<CanalLead, string> = {
  "google-ads": "Google Ads",
  "meta-ads": "Meta Ads",
  "google-organico": "Google orgânico",
  social: "Redes sociais",
  whatsapp: "WhatsApp",
  referencia: "Outro site",
  direto: "Acesso direto",
  outro: "Outra origem",
};

// Ordem de exibição no filtro: o que traz dinheiro primeiro.
export const CANAIS_ORDEM: CanalLead[] = [
  "google-ads",
  "meta-ads",
  "google-organico",
  "social",
  "whatsapp",
  "referencia",
  "direto",
  "outro",
];

export const isCanal = (v: string | undefined | null): v is CanalLead =>
  !!v && (CANAIS_ORDEM as string[]).includes(v);

/**
 * A cascata. Clique de anúncio ganha do utm porque sobrevive à navegação;
 * utm ganha do referrer porque é declarado pela campanha.
 */
export function classificaCanal(o: OrigemBruta): CanalLead {
  if (o.gclid) return "google-ads";
  if (o.fbclid) return "meta-ads";

  const src = (o.utm_source || "").toLowerCase();
  const med = (o.utm_medium || "").toLowerCase();
  const pago = med.includes("cpc") || med.includes("paid") || med.includes("ads");

  if (src) {
    if (src.includes("google")) return pago ? "google-ads" : "google-organico";
    // "ig" só como palavra inteira: com includes, "digital" e "signal" caíam
    // em Meta, e o backfill da migration classificava os mesmos leads como
    // "outro". Duas telas, dois números para o mesmo lead.
    const ehMeta =
      src.includes("face") || src.includes("meta") || src.includes("instagram") || /(^|[^a-z0-9])ig([^a-z0-9]|$)/.test(src);
    if (ehMeta) return pago ? "meta-ads" : "social";
    if (src.includes("tiktok") || src.includes("youtube") || src.includes("linkedin")) return "social";
    if (src.includes("whats")) return "whatsapp";
    return "outro";
  }

  const ref = (o.referrer || "").toLowerCase();
  if (ref) {
    if (ref.includes("google.")) return "google-organico";
    if (ref.includes("facebook.") || ref.includes("instagram.") || ref.includes("fb.me")) return "social";
    if (ref.includes("whatsapp") || ref.includes("wa.me")) return "whatsapp";
    return "referencia";
  }

  // O source começa com "whatsapp:" quando o visitante clicou direto no link
  // de conversa, sem passar pelo pop-up de qualificação.
  if ((o.source || "").startsWith("whatsapp:")) return "whatsapp";

  return "direto";
}

/** Usa o canal já gravado quando existe; classifica na hora para o histórico. */
export function canalDoLead(o: OrigemBruta): CanalLead {
  return isCanal(o.canal) ? o.canal : classificaCanal(o);
}

/**
 * Frase completa da ficha. Mantida em português de atendimento: quem lê é a
 * secretária, não o gestor de tráfego.
 */
export function traduzCanalUtm(o: OrigemBruta): string {
  const canal = canalDoLead(o);
  const frase: Record<CanalLead, string> = {
    "google-ads": "Veio de um anúncio do Google",
    "meta-ads": "Veio de um anúncio do Facebook ou Instagram",
    "google-organico": "Veio do Google sem ser anúncio",
    social: "Veio de rede social (sem ser anúncio)",
    whatsapp: "Veio de um link de WhatsApp",
    referencia: "Veio de outro site",
    direto: "Veio direto do site (sem campanha rastreada)",
    outro: o.utm_source ? `Veio de ${o.utm_source}` : "Origem não identificada",
  };
  return frase[canal];
}

// Qual botão do site gerou o lead. O valor cru é o data-wa-source do link.
const BOTAO_LABEL: Record<string, string> = {
  hero: "Botão principal do topo (Hero)",
  nav: "Botão 'Agendar' no cabeçalho (desktop)",
  "nav-mobile": "Botão 'Agendar' no menu do celular",
  footer: "Botão de WhatsApp no rodapé",
  link: "Link de WhatsApp no texto da página",
  float: "Botão flutuante do WhatsApp",
  "cta-final": "CTA do final da página",
  "bloco-dra": "Bloco da Dra. Anna",
  "tratamentos-final": "Final da página de tratamentos",
  signature: "Bloco do tratamento de destaque (Ultraformer MPT)",
  "signature-agendar": "Tratamento de destaque (botão Agendar)",
  "sobre-hero": "Página Sobre — topo",
  "sobre-final": "Página Sobre — final",
  "contato-final": "Página de contato — botão final",
  "resultados-final": "Final da galeria",
  modal: "Pop-up de qualificação",
};

export function traduzSource(s: string | null | undefined): string {
  if (!s) return "—";
  if (BOTAO_LABEL[s]) return BOTAO_LABEL[s];
  if (s.startsWith("tratamento-")) {
    const slug = s.replace(/^tratamento-/, "").replace(/-final$|-saiba$/g, "");
    return `Página de tratamento: ${slug}`;
  }
  if (s.startsWith("whatsapp:")) return `Clique direto no WhatsApp (${s.replace("whatsapp:", "")})`;
  if (s.startsWith("form:")) return `Formulário de contato (${s.replace("form:", "")})`;
  return s;
}

/** Versão curta do botão, para caber numa linha do card. */
export function traduzSourceCurto(s: string | null | undefined): string | null {
  if (!s) return null;
  const curto: Record<string, string> = {
    hero: "Topo do site",
    nav: "Cabeçalho",
    "nav-mobile": "Menu do celular",
    footer: "Rodapé",
    link: "Link no texto",
    float: "Botão flutuante",
    "cta-final": "Final da página",
    "bloco-dra": "Bloco da Dra.",
    "tratamentos-final": "Tratamentos",
    signature: "Ultraformer MPT",
    "signature-agendar": "Ultraformer MPT",
    "sobre-hero": "Página Sobre",
    "sobre-final": "Página Sobre",
    "contato-final": "Página de contato",
    "resultados-final": "Galeria",
    modal: "Pop-up",
  };
  if (curto[s]) return curto[s];
  if (s.startsWith("tratamento-")) return s.replace(/^tratamento-/, "").replace(/-final$|-saiba$/g, "");
  if (s.startsWith("whatsapp:")) return "WhatsApp direto";
  if (s.startsWith("form:")) return `Formulário (${s.replace("form:", "")})`;
  return s.length > 28 ? `${s.slice(0, 27)}…` : s;
}

/**
 * O que o card mostra: o canal e, quando houver, um detalhe que diferencie dois
 * leads do mesmo canal (a campanha para tráfego pago, o botão para o resto).
 */
export function origemDoCard(o: OrigemBruta): { canal: CanalLead; label: string; detalhe: string | null } {
  const canal = canalDoLead(o);
  const pago = canal === "google-ads" || canal === "meta-ads";
  const detalhe = pago
    ? o.utm_campaign || traduzSourceCurto(o.source)
    : traduzSourceCurto(o.source);
  return { canal, label: CANAL_LABEL[canal], detalhe: detalhe || null };
}

// Cor do selo de origem. Segue a lógica dos badges do CRM: tom claro com texto
// escuro, e fundo sólido só onde o canal custa dinheiro.
export const CANAL_BADGE: Record<CanalLead, string> = {
  "google-ads": "bg-blue-600 text-white",
  "meta-ads": "bg-indigo-600 text-white",
  "google-organico": "bg-sky-100 text-sky-800",
  social: "bg-fuchsia-100 text-fuchsia-900",
  whatsapp: "bg-emerald-100 text-emerald-900",
  referencia: "bg-stone-200 text-stone-700",
  direto: "bg-stone-100 text-stone-600",
  outro: "bg-stone-100 text-stone-600",
};
