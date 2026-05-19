import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LogoAB } from "@/components/LogoAB";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/admin");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-porcelain px-6">
      <Link href="/" className="mb-12">
        <LogoAB variant="full" className="h-7 w-auto" />
      </Link>
      <div className="w-full max-w-md editorial-card rounded-3xl p-10">
        <div className="text-[11px] uppercase tracking-widest3 text-toffee mb-4">
          Acesso restrito
        </div>
        <h1 className="font-display text-3xl text-ink mb-3">
          Entrar no painel.
        </h1>
        <p className="text-sm text-ink/65 mb-8">
          Use o e-mail cadastrado pela administração da clínica.
        </p>
        <LoginForm next={sp.next} initialError={sp.error} />
      </div>
      <Link href="/" className="mt-10 text-[11px] uppercase tracking-widest3 text-ink/55 underline-editorial">
        ← Voltar ao site
      </Link>
    </main>
  );
}
