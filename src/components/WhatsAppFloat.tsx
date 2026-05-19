"use client";

import { motion } from "framer-motion";
import { whatsappLink } from "@/lib/site";
import { trackWhatsapp } from "@/lib/tracking";

export function WhatsAppFloat() {
  return (
    <motion.a
      href={whatsappLink()}
      target="_blank"
      rel="noopener"
      onClick={() => trackWhatsapp("float")}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Conversar no WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-cocoa text-bone shadow-2xl hover:bg-ink transition-colors"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-cocoa/30" />
      <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-current">
        <path d="M16 3C9 3 3.4 8.6 3.4 15.5c0 2.3.6 4.5 1.8 6.5L3 29l7.3-2.1c1.9 1 4 1.6 6.2 1.6h.01c6.9 0 12.5-5.6 12.5-12.5C29 8.6 23.4 3 16 3zm0 22.7c-1.9 0-3.8-.5-5.4-1.5l-.4-.2-4.3 1.2 1.2-4.2-.3-.4c-1.1-1.7-1.6-3.6-1.6-5.7C5.2 9.6 10 5 16 5s10.8 4.6 10.8 10.5c0 5.7-4.8 10.2-10.8 10.2zm6-7.8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.6-1.8-1.8-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.1-.7-1.7-1-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6 2.2.9 2.8.7 3.3.7.5-.1 1.9-.8 2.2-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z" />
      </svg>
    </motion.a>
  );
}
