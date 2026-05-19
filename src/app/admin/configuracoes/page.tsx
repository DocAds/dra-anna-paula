import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single();

  return (
    <main className="p-8 md:p-12">
      <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-3">Conta</div>
      <h1 className="font-display text-4xl text-ink mt-3 mb-8">Minha conta</h1>
      <dl className="editorial-card rounded-3xl p-8 max-w-xl grid gap-5 text-sm">
        {[
          ["Nome", profile?.name || "—"],
          ["E-mail", profile?.email],
          ["Permissão", profile?.role],
          ["Membro desde", profile && format(new Date(profile.created_at), "dd 'de' MMMM yyyy", { locale: ptBR })],
        ].map(([k, v]) => (
          <div key={String(k)} className="grid grid-cols-[120px_1fr] gap-4">
            <dt className="text-[10px] uppercase tracking-widest3 text-ink/45 mt-1">{k}</dt>
            <dd className="text-ink">{v as string}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink/45 mt-6">
        Para trocar a senha, peça a um admin ou use o link de recuperação no login.
      </p>
    </main>
  );
}
