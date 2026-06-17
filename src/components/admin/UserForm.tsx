"use client";

import { useState, useTransition } from "react";
import { ADMIN_SECTIONS, type Profile, type UserRole } from "@/lib/supabase/types";

type Props = {
  initial?: Partial<Profile>;
  onSubmit: (fd: FormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  mode: "create" | "edit";
};

export function UserForm({ initial, onSubmit, onDelete, mode }: Props) {
  const [pending, start] = useTransition();
  const [role, setRole] = useState<UserRole>((initial?.role as UserRole) ?? "editor");
  const initialSections = (initial?.sections as string[] | undefined) ?? [];
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
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
        >
          <option value="editor">Editor — acesso por aba</option>
          <option value="admin">Admin — acesso total + usuários</option>
        </select>
      </label>

      <div className="rounded-2xl border border-cocoa/15 p-5">
        <div className="text-[10px] uppercase tracking-widest3 text-ink/55 mb-1">Abas liberadas</div>
        {role === "admin" ? (
          <p className="text-sm text-ink/55 mt-2">Admin tem acesso a todas as abas, incluindo Usuários.</p>
        ) : (
          <>
            <p className="text-[11px] text-ink/45 mb-3">
              Escolha o que este usuário pode acessar. A aba Conta fica sempre disponível.
            </p>
            <div className="grid gap-2">
              {ADMIN_SECTIONS.map((s) => {
                const checked = initialSections.includes(s.key);
                return (
                  <label key={s.key} className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
                    <span className="text-sm text-ink">{s.label}</span>
                    <input
                      type="checkbox"
                      name="sections"
                      value={s.key}
                      defaultChecked={checked}
                      className="peer sr-only"
                    />
                    <span className="relative h-6 w-11 shrink-0 rounded-full bg-ink/15 transition-colors duration-200 ease-out peer-checked:bg-cocoa peer-focus-visible:ring-2 peer-focus-visible:ring-cocoa/30 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.25)] after:transition-transform after:duration-200 after:ease-out peer-checked:after:translate-x-5" />
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>

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
