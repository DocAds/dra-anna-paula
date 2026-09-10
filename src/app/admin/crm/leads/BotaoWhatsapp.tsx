"use client";

import { linkWhatsapp } from "@/lib/leadWhatsapp";

// Dois detalhes fazem este botão funcionar dentro de um card arrastável:
//
// - draggable={false} no próprio <a>: sem isso o navegador arrasta o LINK em
//   vez do card, e o cartão nunca muda de coluna.
// - stopPropagation no clique: impede que o clique escale para handlers do
//   cartão. O veto ao ARRASTE fica no onDragStart do card (KanbanBoard), que é
//   quem realmente é a origem do gesto: parar o evento aqui não impedia o
//   arraste iniciado com 12px de movimento a partir do botão.
//
// O link fica puro, sem navegação por script no onClick. Fechar menu ou
// navegar no clique desmonta a âncora antes de o navegador abrir a aba, e nada
// acontece — já aconteceu em outro painel da casa.

export function BotaoWhatsapp({
  lead,
  tamanho = "md",
  className = "",
}: {
  lead: { nome: string; whatsapp: string | null; whatsapp_country?: string | null; interesse?: string | null };
  tamanho?: "sm" | "md";
  className?: string;
}) {
  const href = linkWhatsapp(lead);
  if (!href) return null;

  const dimensao = tamanho === "sm" ? "h-9 w-9 md:h-8 md:w-8" : "min-h-11 min-w-11";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      draggable={false}
      onClick={(e) => e.stopPropagation()}
      onDragStart={(e) => e.preventDefault()}
      aria-label={`Chamar ${lead.nome} no WhatsApp`}
      title={`Chamar ${lead.nome} no WhatsApp`}
      className={`relative z-10 grid place-items-center rounded-full bg-[#107C3E] text-white transition-colors motion-reduce:transition-none hover:bg-[#0c6531] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60 focus-visible:ring-offset-2 focus-visible:ring-offset-porcelain ${dimensao} ${className}`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={tamanho === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"} fill="currentColor">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35z" />
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.25-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.26 8.24z" />
      </svg>
    </a>
  );
}
