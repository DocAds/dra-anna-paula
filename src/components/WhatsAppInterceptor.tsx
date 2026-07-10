"use client";

import { useEffect } from "react";
import { leadModal } from "@/lib/leadModal";
import { trackWhatsappClick } from "@/lib/tracking";
import { isWhatsappHref } from "@/lib/whatsapp";

/**
 * Captura todo clique em link de WhatsApp da área pública e abre o modal de lead
 * antes do redirect, para o contato entrar no CRM e no tracking.
 *
 * Um link que precise ir direto pro wa.me deve declarar data-wa-direct.
 * O rótulo da origem sai de data-wa-source, ou do container onde o link está.
 */
export function WhatsAppInterceptor() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      // Deixa passar clique de menu do meio, ctrl/cmd+clique e afins.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.dataset.waDirect !== undefined) return;
      if (!isWhatsappHref(anchor.getAttribute("href") ?? "")) return;

      // Só o href é cancelado. A propagação segue, para o onClick do próprio
      // link (fechar o menu mobile, por exemplo) continuar rodando.
      e.preventDefault();

      const source =
        anchor.dataset.waSource ??
        (anchor.closest("nav, header") ? "nav" : anchor.closest("footer") ? "footer" : "link");

      trackWhatsappClick(source);
      leadModal.open(source);
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
