"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, BarChart3, Megaphone } from "lucide-react";
import type { AdminSection } from "@/lib/supabase/types";

const ITEMS: { href: string; label: string; icon: typeof Users; key: AdminSection | "conta" }[] = [
  { href: "/admin", label: "Painel", icon: LayoutDashboard, key: "painel" },
  { href: "/admin/crm", label: "Dashboard", icon: BarChart3, key: "dashboard" },
  { href: "/admin/crm/leads", label: "Leads", icon: Users, key: "leads" },
  { href: "/admin/posts", label: "Posts", icon: FileText, key: "posts" },
  { href: "/admin/marketing", label: "Marketing", icon: Megaphone, key: "marketing" },
  { href: "/admin/users", label: "Usuários", icon: Users, key: "usuarios" },
  { href: "/admin/configuracoes", label: "Conta", icon: Settings, key: "conta" },
];

export function AdminNav({ isAdmin, sections }: { isAdmin: boolean; sections: AdminSection[] }) {
  const pathname = usePathname();
  const items = ITEMS.filter(
    (i) => isAdmin || i.key === "conta" || sections.includes(i.key as AdminSection)
  );

  // Aba ativa = item cujo href é o prefixo mais específico (mais longo) da rota atual.
  const activeHref = items
    .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
    .reduce((best, i) => (i.href.length > best.length ? i.href : best), "");

  return (
    <nav className="flex-1 flex flex-col gap-1">
      {items.map((n) => {
        const active = n.href === activeHref;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm bg-cocoa text-bone font-medium shadow-sm relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-1 before:rounded-full before:bg-toffee"
                : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink/70 hover:bg-cocoa/10 hover:text-cocoa transition-colors"
            }
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
