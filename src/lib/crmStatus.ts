// Cores de status do CRM — pensadas para legibilidade (contraste AA) e
// leitura semântica imediata (quente = quente, convertido = positivo, etc).
// Tons claros usam texto escuro; estados de destaque usam fundo sólido.

import type { LeadFase, LeadTemperatura } from "@/lib/supabase/types";

export const TEMP_BADGE: Record<string, string> = {
  frio: "bg-sky-100 text-sky-800",
  morno: "bg-amber-100 text-amber-900",
  quente: "bg-rose-600 text-white",
};

export const FASE_BADGE: Record<string, string> = {
  novo: "bg-amber-100 text-amber-900",
  contatado: "bg-sky-100 text-sky-800",
  agendado: "bg-violet-100 text-violet-800",
  compareceu: "bg-indigo-100 text-indigo-800",
  convertido: "bg-emerald-600 text-white",
  perdido: "bg-stone-200 text-stone-700",
};

// Rótulos legíveis — o enum cru nunca deve aparecer na UI para a equipe de
// atendimento. Fonte única, reaproveitada na lista, no kanban e no detalhe.
export const FASE_LABEL: Record<LeadFase, string> = {
  novo: "Novo",
  contatado: "Contatado",
  agendado: "Agendado",
  compareceu: "Compareceu",
  convertido: "Convertido",
  perdido: "Perdido",
};

export const TEMP_LABEL: Record<LeadTemperatura, string> = {
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
};

export const FASES_ORDEM: LeadFase[] = [
  "novo",
  "contatado",
  "agendado",
  "compareceu",
  "convertido",
  "perdido",
];
