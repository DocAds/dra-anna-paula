import Link from "next/link";
import { LogoAB } from "@/components/LogoAB";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogOut, ExternalLink } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import type { AdminSection } from "@/lib/supabase/types";

// Conteúdo compartilhado entre a sidebar desktop e o drawer mobile:
// logo, navegação, identificação do usuário e ações (ver site / sair).
export function AdminSidebarContent({
  isAdmin,
  sections,
  name,
  role,
}: {
  isAdmin: boolean;
  sections: AdminSection[];
  name: string;
  role: string;
}) {
  return (
    <>
      <Link href="/admin" className="flex items-center mb-10">
        <LogoAB variant="full" className="h-6 w-auto" />
      </Link>
      <AdminNav isAdmin={isAdmin} sections={sections} />
      <div className="mt-6 border-t border-cocoa/10 pt-5 space-y-4">
        <div className="rounded-2xl bg-cocoa/[0.06] border border-cocoa/10 px-4 py-3">
          <div className="text-[9px] uppercase tracking-widest3 text-ink/40 mb-1">Logado como</div>
          <div className="text-sm font-display text-ink truncate leading-tight">{name}</div>
          <span className="mt-2 inline-block rounded-full bg-cocoa/10 px-2.5 py-0.5 text-[9px] uppercase tracking-widest2 text-cocoa">
            {role}
          </span>
        </div>
        <div className="space-y-2.5 px-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ver site público
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-cocoa transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sair
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
