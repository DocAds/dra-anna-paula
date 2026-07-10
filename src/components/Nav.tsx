"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { LogoAB } from "./LogoAB";
import { NAV, whatsappLink } from "@/lib/site";
import { leadModal } from "@/lib/leadModal";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -40, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-6xl"
      >
        <div
          className={`relative flex items-center justify-between rounded-full pl-7 pr-3 transition-all duration-500 ${
            scrolled ? "glass py-2.5" : "glass-soft py-3"
          }`}
        >
          <Link href="/" aria-label="Início" className="flex items-center shrink-0">
            <LogoAB variant="full" className="h-7 md:h-8 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2 text-[12px] tracking-widest2 uppercase text-ink/75">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="underline-editorial hover:text-cocoa transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => leadModal.open("nav")}
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-cocoa px-5 py-3 text-[12px] uppercase tracking-widest2 text-bone hover:bg-ink transition-colors"
            >
              Agendar
            </button>
            <button
              onClick={() => setOpen(true)}
              className="md:hidden rounded-full p-2.5 text-cocoa"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            <div className="absolute inset-0 glass-dark" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 h-full w-[80%] max-w-sm bg-porcelain p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-12">
                <LogoAB className="h-10 w-auto" />
                <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-cocoa">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-6 text-2xl font-display text-ink">
                {NAV.map((item) => (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="underline-editorial">
                    {item.label}
                  </Link>
                ))}
              </nav>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener"
                data-wa-source="nav-mobile"
                onClick={() => setOpen(false)}
                className="mt-12 inline-flex w-full justify-center items-center rounded-full bg-cocoa px-5 py-4 text-[12px] uppercase tracking-widest text-bone"
              >
                Agendar pelo WhatsApp
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
