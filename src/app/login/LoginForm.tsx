"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 pr-10 text-ink mt-1"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
            className="absolute right-0 top-1/2 -translate-y-1/2 mt-1 p-2 text-ink/45 hover:text-cocoa transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
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
