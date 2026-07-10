"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoAB } from "@/components/LogoAB";

/**
 * Barra superior + drawer para o admin no mobile. A sidebar desktop fica
 * escondida (<md); aqui o menu abre sob demanda para o conteúdo começar
 * logo abaixo da barra, em vez de depois de ~700px de navegação.
 * Recebe o conteúdo da sidebar como children (server-rendered).
 */
export function AdminMobileBar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body enquanto o drawer está aberto e fecha no Esc.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cocoa/10 bg-porcelain/90 backdrop-blur px-5 py-3">
        <Link href="/admin" aria-label="Painel">
          <LogoAB variant="full" className="h-5 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          className="grid place-items-center h-11 w-11 -mr-2 rounded-full text-cocoa hover:bg-cocoa/10 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-300 motion-reduce:transition-none ${open ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col overflow-y-auto bg-gradient-to-b from-porcelain to-bone p-6 shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="absolute top-4 right-4 grid place-items-center h-10 w-10 rounded-full text-ink/60 hover:bg-cocoa/10 hover:text-cocoa transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50"
          >
            <X className="h-4 w-4" />
          </button>
          {children}
        </aside>
      </div>
    </div>
  );
}
