"use client";

import Link from "next/link";
import { leadModal } from "@/lib/leadModal";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  source?: string;
  variant?: "primary" | "ghost" | "outline";
  href?: string;
  className?: string;
};

export function CTA({ children, source = "default", variant = "primary", href, className }: Props) {
  const base =
    "group inline-flex items-center gap-3 rounded-full px-7 py-4 text-[12px] uppercase tracking-widest2 transition-all duration-500";
  // Dentro de .superficie-escura (seções bg-cocoa e o rodapé) o botão inverte
  // sozinho: cocoa sobre cocoa não tem contraste nenhum.
  const styles = {
    primary:
      "bg-cocoa text-bone hover:bg-ink [.superficie-escura_&]:bg-cream [.superficie-escura_&]:text-ink [.superficie-escura_&]:hover:bg-bone",
    outline:
      "border border-cocoa/40 text-cocoa hover:border-cocoa hover:bg-cocoa hover:text-bone [.superficie-escura_&]:border-bone/60 [.superficie-escura_&]:text-bone [.superficie-escura_&]:hover:border-bone [.superficie-escura_&]:hover:bg-bone [.superficie-escura_&]:hover:text-ink",
    ghost: "text-cocoa hover:text-ink [.superficie-escura_&]:text-bone [.superficie-escura_&]:hover:text-cream",
  } as const;

  const inner = (
    <>
      <span>{children}</span>
      <ArrowUpRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${styles[variant]} ${className ?? ""}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => leadModal.open(source)}
      className={`${base} ${styles[variant]} ${className ?? ""}`}
    >
      {inner}
    </button>
  );
}
