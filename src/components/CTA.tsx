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
  const styles = {
    primary: "bg-cocoa text-bone hover:bg-ink",
    outline: "border border-cocoa/40 text-cocoa hover:border-cocoa hover:bg-cocoa hover:text-bone",
    ghost: "text-cocoa hover:text-ink",
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
