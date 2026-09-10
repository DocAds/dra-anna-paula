import { CANAL_BADGE, origemDoCard } from "@/lib/leadOrigem";
import type { Lead } from "@/lib/supabase/types";

type LeadOrigem = Pick<
  Lead,
  "source" | "canal" | "utm_source" | "utm_medium" | "utm_campaign" | "gclid" | "fbclid" | "referrer"
>;

/**
 * De onde o lead veio, em uma linha do card.
 *
 * O canal vira selo colorido porque é o que a equipe procura primeiro ("veio de
 * anúncio?"); o detalhe fica em texto ao lado, porque só desempata dois leads do
 * mesmo canal. Tráfego pago mostra a campanha, o resto mostra o botão clicado.
 */
export function SeloOrigem({
  lead,
  tamanho = "md",
}: {
  lead: LeadOrigem;
  tamanho?: "sm" | "md";
}) {
  const { canal, label, detalhe } = origemDoCard(lead);
  const escala = tamanho === "sm" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-3 py-1";

  return (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className={`uppercase tracking-widest2 rounded-full whitespace-nowrap ${escala} ${CANAL_BADGE[canal]}`}>
        {label}
      </span>
      {detalhe && (
        <span
          className={`${tamanho === "sm" ? "text-[10px]" : "text-[11px]"} text-ink/70 truncate normal-case tracking-normal`}
          title={detalhe}
        >
          {detalhe}
        </span>
      )}
    </span>
  );
}
