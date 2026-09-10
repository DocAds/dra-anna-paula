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
  | "ia"
  | "whatsapp"
  | "referencia"
  | "direto"
  | "nao-identificado"
  | "outro";

type OrigemBruta = {
  source?: string | null;
  canal?: string | null;
  landing_path?: string | null;
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
  ia: "Busca por IA",
  whatsapp: "WhatsApp",
  referencia: "Outro site",
  direto: "Acesso direto",
  "nao-identificado": "Sem origem",
  outro: "Outra origem",
};

// Ordem de exibição no filtro: o que traz dinheiro primeiro.
export const CANAIS_ORDEM: CanalLead[] = [
  "google-ads",
  "meta-ads",
  "google-organico",
  "social",
  "ia",
  "whatsapp",
  "referencia",
  "direto",
  "nao-identificado",
  "outro",
];

export const isCanal = (v: string | undefined | null): v is CanalLead =>
  !!v && (CANAIS_ORDEM as string[]).includes(v);

// Assistentes de IA já mandam tráfego real (3 dos 77 leads vieram do
// chatgpt.com) e não são "outra origem": é um canal com comportamento próprio,
// e vai crescer. Checado ANTES do Google, senão gemini.google.com vira busca
// orgânica do Google.
const FONTES_IA = /(chatgpt|openai|perplexity|gemini|bard|claude\.ai|copilot|grok)/;

// "Pago" exige plataforma + intenção comercial no mesmo valor. O teste antigo
// era src.includes("ads"), que casa com "leads" e com qualquer nome de campanha
// que tenha a palavra dentro.
const ehPago = (src: string, med: string) => {
  const sinal = `${src} ${med}`;
  if (/(^|[^a-z])(cpc|ppc|paid|paid_social|paidsocial)([^a-z]|$)/.test(sinal)) return true;
  return /(meta|face|fb|ig|insta|google|youtube|tiktok|linkedin)[a-z_-]*ads/.test(sinal.replace(/\s+/g, ""));
};

const ehMeta = (src: string) =>
  src.includes("face") || src.includes("meta") || src.includes("instagram") || /(^|[^a-z0-9])(ig|fb)([^a-z0-9]|$)/.test(src);

/**
 * De onde o lead veio.
 *
 * A UTM manda quando existe, e o clique de anúncio só desempata na ausência
 * dela. A ordem inversa (que era a daqui) fazia todo lead com fbclid virar Meta
 * Ads, inclusive os que a própria UTM declarava orgânicos: o navegador embutido
 * do Instagram carimba fbclid em clique de link da bio e de story. Eram 21 dos
 * 61 leads contados como pagos, um terço do balde.
 */
export function classificaCanal(o: OrigemBruta): CanalLead {
  const src = (o.utm_source || "").toLowerCase();
  const med = (o.utm_medium || "").toLowerCase();

  if (src) {
    if (FONTES_IA.test(src)) return "ia";
    const pago = ehPago(src, med);
    // O gclid vale como prova de anúncio: a marcação automática do Google só o
    // cria em clique pago. O fbclid NÃO vale: o navegador embutido do Instagram
    // carimba o parâmetro em clique de link da bio e de story, que é orgânico.
    // Por isso, dentro do Meta, quem decide é o que a própria UTM declara.
    if (src.includes("google")) return pago || o.gclid ? "google-ads" : "google-organico";
    if (ehMeta(src)) return pago ? "meta-ads" : "social";
    if (src.includes("tiktok") || src.includes("youtube") || src.includes("linkedin"))
      return pago ? "meta-ads" : "social";
    if (src.includes("whats")) return "whatsapp";
    return pago ? "outro" : "referencia";
  }

  // Sem utm, o clique de anúncio é o que sobra de mais confiável.
  if (o.gclid) return "google-ads";
  if (o.fbclid) return "meta-ads";

  const ref = (o.referrer || "").toLowerCase();
  if (ref) {
    if (FONTES_IA.test(ref)) return "ia";
    if (ref.includes("google.")) return "google-organico";
    if (ref.includes("facebook.") || ref.includes("instagram.") || ref.includes("fb.me")) return "social";
    if (ref.includes("whatsapp") || ref.includes("wa.me")) return "whatsapp";
    return "referencia";
  }

  // O source começa com "whatsapp:" quando o visitante clicou direto no link
  // de conversa, sem passar pelo pop-up de qualificação.
  if ((o.source || "").startsWith("whatsapp:")) return "whatsapp";

  // "Acesso direto" é afirmação forte: quem digitou o endereço ou tinha o site
  // salvo. Sem nenhum sinal E sem nem saber por onde entrou, o honesto é
  // admitir que não se sabe, em vez de creditar ao canal direto.
  return o.landing_path === "/" ? "direto" : "nao-identificado";
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
    ia: `Veio de um assistente de IA${o.utm_source ? ` (${o.utm_source})` : ""}`,
    whatsapp: "Veio de um link de WhatsApp",
    referencia: o.utm_source ? `Veio de ${o.utm_source}` : "Veio de outro site",
    direto: "Veio direto do site (digitou o endereço ou tinha salvo)",
    "nao-identificado": "Não deu para identificar a origem",
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
  ia: "bg-teal-100 text-teal-900",
  whatsapp: "bg-emerald-100 text-emerald-900",
  referencia: "bg-stone-200 text-stone-700",
  direto: "bg-stone-100 text-stone-600",
  "nao-identificado": "bg-amber-100 text-amber-900",
  outro: "bg-stone-100 text-stone-600",
};
