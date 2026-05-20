"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, Settings, BarChart3 } from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();

  const nav: NavItem[] = [
    { href: "/admin", label: "Painel", icon: LayoutDashboard },
    { href: "/admin/crm", label: "Dashboard", icon: BarChart3 },
    { href: "/admin/crm/leads", label: "Leads", icon: Users },
    { href: "/admin/posts", label: "Posts", icon: FileText },
    ...(isAdmin ? [{ href: "/admin/users", label: "Usuários", icon: Users }] : []),
    { href: "/admin/configuracoes", label: "Conta", icon: Settings },
  ];

  const matches = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const activeHref = nav
    .filter((n) => matches(n.href))
    .reduce<string | null>((best, n) => (best && best.length >= n.href.length ? best : n.href), null);

  return (
    <nav className="flex-1 flex flex-col gap-1">
      {nav.map((n) => {
        const active = n.href === activeHref;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-colors ${
              active
                ? "bg-cocoa text-bone font-medium shadow-sm"
                : "text-ink/70 hover:bg-cocoa/8 hover:text-cocoa"
            }`}
          >
            <n.icon className="h-4 w-4" />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
