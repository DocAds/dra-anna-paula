"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: String(data.email),
      password: String(data.password),
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace(next || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest3 text-ink/55">E-mail</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Senha</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 rounded-full bg-cocoa text-bone py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
      {error && <p className="text-sm text-red-700">{error}</p>}
    </form>
  );
}
