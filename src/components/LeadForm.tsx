"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { trackLead } from "@/lib/tracking";
import { whatsappLink, SITE } from "@/lib/site";

const interesses = [
  "Avaliação geral",
  "Rejuvenescimento facial",
  "Lasers e manchas",
  "Injetáveis",
  "Outro",
] as const;

export function LeadForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      trackLead({
        source: `form:${data.interesse}`,
        phone: String(data.telefone || ""),
        email: String(data.email || ""),
      });

      const msg = `Olá Dra. Anna, sou ${data.nome}. Tenho interesse em: ${data.interesse}. ${data.mensagem ? `Mensagem: ${data.mensagem}` : ""}`;
      setTimeout(() => {
        window.open(
          `https://wa.me/${SITE.whatsappE164}?text=${encodeURIComponent(msg)}`,
          "_blank"
        );
      }, 300);

      setStatus("sent");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="text-[11px] uppercase tracking-widest3 text-toffee">Agendar avaliação</div>
      <h3 className="font-display text-3xl text-ink">Conte um pouco sobre você.</h3>

      <Field label="Nome completo" name="nome" required />
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="WhatsApp" name="telefone" required inputMode="tel" />
        <Field label="E-mail" name="email" type="email" />
      </div>
      <SelectField label="Tenho interesse em" name="interesse" options={interesses as unknown as string[]} required />
      <Field label="Mensagem (opcional)" name="mensagem" multiline />

      <motion.button
        whileTap={{ scale: 0.985 }}
        type="submit"
        disabled={status === "sending"}
        className="mt-2 rounded-full bg-cocoa text-bone py-4 text-[12px] uppercase tracking-widest2 hover:bg-ink transition-colors disabled:opacity-50"
      >
        {status === "sending" ? "Enviando..." : status === "sent" ? "Vamos continuar no WhatsApp →" : "Enviar e abrir WhatsApp"}
      </motion.button>

      {status === "sent" && (
        <p className="text-sm text-cocoa">Te encaminhei pro WhatsApp da clínica. Em breve retornaremos.</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700">
          Tivemos um problema. Tente novamente ou fale direto no{" "}
          <a className="underline" href={whatsappLink()} target="_blank" rel="noopener">WhatsApp</a>.
        </p>
      )}

      <p className="text-[11px] text-ink/45 mt-1">
        Seus dados são tratados com sigilo médico. Não compartilhamos com terceiros.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  multiline,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const base =
    "w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink placeholder-ink/30 transition-colors";
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      {multiline ? (
        <textarea name={name} rows={3} required={required} className={`${base} resize-none mt-1`} />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          inputMode={inputMode}
          className={`${base} mt-1`}
        />
      )}
    </label>
  );
}

function SelectField({ label, name, options, required }: { label: string; name: string; options: string[]; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest3 text-ink/55">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full bg-transparent border-b border-cocoa/25 focus:border-cocoa outline-none py-3 text-ink mt-1"
      >
        <option value="" disabled>Selecione</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
