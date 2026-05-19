"use client";

import { useTransition } from "react";
import type { Profile, UserRole } from "@/lib/supabase/types";

type Props = {
  initial?: Partial<Profile>;
  onSubmit: (fd: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  mode: "create" | "edit";
};

export function UserForm({ initial, onSubmit, onDelete, mode }: Props) {
  const [pending, start] = useTransition();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => { await onSubmit(fd); });
  }

  return (
    <form onSubmit={submit} className="editorial-card rounded-3xl p-8 max-w-xl grid gap-5">
      <Field label="Nome" name="name" defaultValue={initial?.name ?? ""} />
      <Field
        label="E-mail"
        name="email"
        type="email"
        required={mode === "create"}
        defaultValue={initial?.email ?? ""}
        disabled={mode === "edit"}
      />
      <Field
        label={mode === "create" ? "Senha inicial" : "Nova senha (opcional)"}
        name="password"
        type="password"
        required={mode === "create"}
        autoComplete="new-password"
      />
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest3 text-ink/55">Permissão</span>
        <select
          name="role"
          defaultValue={(initial?.role as UserRole) ?? "editor"}
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        >
          <option value="editor">Editor — gerencia próprios posts</option>
          <option value="admin">Admin — acesso total + usuários</option>
        </select>
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-cocoa text-bone px-6 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : mode === "create" ? "Criar usuário" : "Salvar alterações"}
        </button>
        {onDelete && (
          <form action={onDelete} className="ml-auto">
            <button
              type="submit"
              onClick={(e) => { if (!confirm("Excluir este usuário?")) e.preventDefault(); }}
              className="text-[11px] uppercase tracking-widest2 text-ink/55 hover:text-red-700 transition-colors"
            >
              Excluir
            </button>
          </form>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  disabled,
  defaultValue,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1 disabled:opacity-60"
      />
    </label>
  );
}
