"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { AIConfigDialog } from "./AIDialogs";
import { saveAiConfig } from "@/app/admin/posts/ai-actions";

type Provider = "gemini" | "openai" | "anthropic";

type InitialCfg = {
  provider?: Provider;
  model?: string;
  instructions?: string;
  hasToken?: boolean;
} | null;

export function AiConfigButton({ initial }: { initial: InitialCfg }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-cocoa/30 text-cocoa px-5 py-3 text-[12px] uppercase tracking-widest2 hover:bg-cocoa hover:text-bone transition-colors"
      >
        <Settings2 className="h-4 w-4" /> Configurar IA
      </button>
      <AIConfigDialog
        open={open}
        onClose={() => setOpen(false)}
        initial={initial}
        onSave={saveAiConfig}
      />
    </>
  );
}
