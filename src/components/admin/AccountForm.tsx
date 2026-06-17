"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

type Result = { ok: boolean; message: string };
type Action = (fd: FormData) => Promise<Result>;

type Props = {
  initialName: string;
  initialEmail: string;
  updateName: Action;
  updateEmail: Action;
  updatePassword: Action;
};

export function AccountForm({ initialName, initialEmail, updateName, updateEmail, updatePassword }: Props) {
  return (
    <div className="grid gap-6 max-w-xl">
      <SectionForm
        title="Perfil"
        hint="Como seu nome aparece no painel."
        action={updateName}
        submitLabel="Salvar nome"
      >
        <Field label="Nome" name="name" defaultValue={initialName} required minLength={2} />
      </SectionForm>

      <SectionForm
        title="E-mail de acesso"
        hint="Trocar o e-mail dispara um link de confirmação para o novo endereço."
        action={updateEmail}
        submitLabel="Atualizar e-mail"
      >
        <Field label="Novo e-mail" name="email" type="email" defaultValue={initialEmail} required />
      </SectionForm>

      <SectionForm
        title="Senha"
        hint="Use ao menos 8 caracteres."
        action={updatePassword}
        submitLabel="Trocar senha"
        resetOnSuccess
      >
        <PasswordField label="Nova senha" name="password" />
        <PasswordField label="Confirmar nova senha" name="confirm" />
      </SectionForm>
    </div>
  );
}

function SectionForm({
  title,
  hint,
  action,
  submitLabel,
  resetOnSuccess,
  children,
}: {
  title: string;
  hint: string;
  action: Action;
  submitLabel: string;
  resetOnSuccess?: boolean;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setResult(null);
    start(async () => {
      const r = await action(fd);
      setResult(r);
      if (r.ok && resetOnSuccess) form.reset();
    });
  }

  return (
    <form onSubmit={submit} className="editorial-card rounded-3xl p-8 grid gap-5">
      <div>
        <h2 className="font-display text-xl text-ink">{title}</h2>
        <p className="text-xs text-ink/45 mt-1">{hint}</p>
      </div>
      {children}
      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-cocoa text-bone px-6 py-3 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
        >
          {pending ? "Salvando..." : submitLabel}
        </button>
        {result && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              result.ok ? "text-cocoa" : "text-red-700"
            }`}
          >
            {result.ok ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
            {result.message}
          </span>
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
  minLength,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue}
        className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
      />
    </label>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={show ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 pr-10 text-ink mt-1"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-ink/45 hover:text-cocoa transition-colors p-1"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}
