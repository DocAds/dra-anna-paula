"use client";

/**
 * Abre o WhatsApp. DEVE ser chamado de forma síncrona dentro do gesto do usuário:
 * um window.open depois de um await cai no bloqueador de popup (Safari/iOS é rígido).
 * Se ainda assim o popup for barrado, navega na própria aba.
 */
export function openWhatsapp(url: string) {
  const win = window.open(url, "_blank");
  if (!win) window.location.href = url;
}

const WHATSAPP_HOSTS = new Set([
  "wa.me",
  "api.whatsapp.com",
  "web.whatsapp.com",
  "chat.whatsapp.com",
]);

export function isWhatsappHref(href: string) {
  try {
    return WHATSAPP_HOSTS.has(new URL(href, window.location.href).hostname);
  } catch {
    return false;
  }
}
