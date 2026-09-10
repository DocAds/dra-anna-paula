"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { PERIODOS, type PeriodoLead } from "@/lib/leadFiltros";
import { diaSP, somaDias } from "@/lib/dataSP";

// Os atalhos resolvem quase todo dia de trabalho; o calendário existe para a
// exceção. Por isso ele fica atrás de um botão, numa janelinha sobreposta, e
// não ocupando espaço fixo na barra.
const ATALHOS = PERIODOS.filter((p) => p.v !== "personalizado");

const DIAS_DA_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const parteDoDia = (dia: string) => {
  const [a, m, d] = dia.split("-").map(Number);
  return { ano: a, mes: m - 1, dia: d };
};
const montaDia = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const porExtenso = (dia: string) => {
  const { ano, mes, dia: d } = parteDoDia(dia);
  return `${d} de ${MESES[mes]} de ${ano}`;
};
const curto = (dia: string) => {
  const { mes, dia: d } = parteDoDia(dia);
  return `${String(d).padStart(2, "0")} ${MESES[mes].slice(0, 3)}`;
};

export function SeletorPeriodo({
  periodo,
  de,
  ate,
  queryBase,
}: {
  periodo: PeriodoLead;
  de?: string;
  ate?: string;
  /** Demais filtros ativos, para o período não zerar o recorte da tela. */
  queryBase: Record<string, string>;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [inicio, setInicio] = useState<string | undefined>(de);
  const [fim, setFim] = useState<string | undefined>(ate);
  const [foco, setFoco] = useState<string>(de ?? diaSP());

  const popoverRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);

  const hoje = diaSP();
  const mesVisivel = foco.slice(0, 7);

  // A URL é a fonte da verdade do recorte aplicado. Sem esta sincronia, limpar
  // o filtro pela barra deixava o calendário destacando o intervalo antigo.
  useEffect(() => {
    setInicio(de);
    setFim(ate);
    setFoco(de ?? diaSP());
  }, [de, ate, periodo]);

  // Escape fecha devolvendo o foco ao botão, e clique fora fecha sem aplicar.
  useEffect(() => {
    if (!aberto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const alvo = e.target as Node;
      if (popoverRef.current?.contains(alvo) || botaoRef.current?.contains(alvo)) return;
      setAberto(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [aberto]);

  // Um único dia participa da ordem de tabulação (roving tabindex): com 31
  // botões focáveis, chegar ao "Aplicar" pelo teclado custava 36 tabuladas.
  useEffect(() => {
    if (!aberto) return;
    const alvo =
      popoverRef.current?.querySelector<HTMLButtonElement>('[data-dia][tabindex="0"]') ??
      popoverRef.current?.querySelector<HTMLButtonElement>("[data-dia]:not([disabled])");
    alvo?.focus();
  }, [aberto]);

  const grade = useMemo(() => {
    const [ano, mes] = mesVisivel.split("-").map(Number);
    const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
    const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    return {
      ano,
      mes: mes - 1,
      vazios: primeiro.getUTCDay(),
      dias: Array.from({ length: diasNoMes }, (_, i) => i + 1),
    };
  }, [mesVisivel]);

  function mudaMes(passo: number) {
    const [ano, mes] = mesVisivel.split("-").map(Number);
    const d = new Date(Date.UTC(ano, mes - 1 + passo, 1));
    const novo = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    setFoco(`${novo}-01`);
  }

  function onTeclaNaGrade(e: React.KeyboardEvent) {
    const passo: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      PageUp: -30,
      PageDown: 30,
    };
    if (e.key in passo) {
      e.preventDefault();
      const alvo = somaDias(foco, passo[e.key]);
      setFoco(alvo > hoje ? hoje : alvo);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setFoco(`${mesVisivel}-01`);
    }
    if (e.key === "End") {
      e.preventDefault();
      const ultimo = new Date(Date.UTC(grade.ano, grade.mes + 1, 0)).getUTCDate();
      const fimDoMes = montaDia(grade.ano, grade.mes, ultimo);
      setFoco(fimDoMes > hoje ? hoje : fimDoMes);
    }
  }

  function escolheDia(dia: string) {
    // Primeiro clique abre o intervalo; o segundo fecha. Clicar antes do início
    // recomeça, que é o que a pessoa quer quando errou a primeira data.
    if (!inicio || (inicio && fim) || dia < inicio) {
      setInicio(dia);
      setFim(undefined);
      return;
    }
    setFim(dia);
  }

  function aplica() {
    const params = new URLSearchParams({ ...queryBase, periodo: "personalizado" });
    if (inicio) params.set("de", inicio);
    params.set("ate", fim ?? inicio ?? hoje);
    setAberto(false);
    router.push(`/admin/crm/leads?${params.toString()}`);
  }

  const rotuloBotao =
    periodo === "personalizado" && de
      ? `${curto(de)} — ${ate ? curto(ate) : "hoje"}`
      : "Escolher datas";

  const pill =
    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] uppercase tracking-widest2 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60";

  return (
    <div className="relative flex flex-wrap items-center gap-1.5">
      {ATALHOS.map((p) => {
        const ativo = periodo === p.v;
        const query = { ...queryBase, ...(p.v === "tudo" ? {} : { periodo: p.v }) };
        return (
          <Link
            key={p.v}
            href={{ pathname: "/admin/crm/leads", query }}
            aria-current={ativo ? "true" : undefined}
            className={`${pill} ${
              ativo ? "bg-cocoa text-bone" : "border border-cocoa/15 text-ink/75 hover:text-cocoa hover:border-cocoa/40"
            }`}
          >
            {p.l}
          </Link>
        );
      })}

      <button
        ref={botaoRef}
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        className={`${pill} ${
          periodo === "personalizado"
            ? "bg-cocoa text-bone"
            : "border border-cocoa/15 text-ink/75 hover:text-cocoa hover:border-cocoa/40"
        }`}
      >
        <CalendarRange className="h-3.5 w-3.5" aria-hidden />
        {rotuloBotao}
      </button>

      {aberto && (
        /* Ancorado no container da barra, não no botão: preso ao botão, a
           janelinha saía pela direita no celular e o "mês anterior" ficava
           inalcançável. A largura nunca passa da viewport. */
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Escolher período por data"
          className="absolute top-full left-0 sm:left-auto sm:right-0 z-30 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-3xl border border-cocoa/15 bg-porcelain p-4 shadow-xl shadow-ink/10"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => mudaMes(-1)}
              aria-label="Mês anterior"
              className="grid place-items-center h-9 w-9 rounded-full text-cocoa hover:bg-cocoa/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <div aria-live="polite" className="font-display text-base text-ink">
              {MESES[grade.mes]} {grade.ano}
            </div>
            <button
              type="button"
              onClick={() => mudaMes(1)}
              disabled={mesVisivel >= hoje.slice(0, 7)}
              aria-label="Próximo mês"
              className="grid place-items-center h-9 w-9 rounded-full text-cocoa hover:bg-cocoa/10 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/50"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div role="grid" aria-label={`${MESES[grade.mes]} de ${grade.ano}`} onKeyDown={onTeclaNaGrade}>
            <div role="row" className="grid grid-cols-7 gap-0.5 mb-1">
              {DIAS_DA_SEMANA.map((d) => (
                <div
                  key={d}
                  role="columnheader"
                  aria-label={d}
                  className="text-center text-[10px] uppercase tracking-widest2 text-ink/70 py-1"
                >
                  {d.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>

            <div role="row" className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: grade.vazios }, (_, i) => (
                <div key={`v${i}`} role="gridcell" aria-hidden />
              ))}
              {grade.dias.map((n) => {
                const dia = montaDia(grade.ano, grade.mes, n);
                const ehInicio = dia === inicio;
                const ehFim = dia === fim;
                const dentro = !!inicio && !!fim && dia > inicio && dia < fim;
                const futuro = dia > hoje;
                const selecionado = ehInicio || ehFim || dentro;
                return (
                  <div role="gridcell" aria-selected={selecionado} key={dia}>
                    <button
                      type="button"
                      data-dia={dia}
                      disabled={futuro}
                      tabIndex={dia === foco ? 0 : -1}
                      onFocus={() => setFoco(dia)}
                      onClick={() => escolheDia(dia)}
                      aria-label={porExtenso(dia)}
                      aria-current={dia === hoje ? "date" : undefined}
                      className={`w-full h-9 rounded-xl text-[12px] transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60 disabled:opacity-25 disabled:cursor-not-allowed ${
                        ehInicio || ehFim
                          ? "bg-cocoa text-bone"
                          : dentro
                            ? "bg-cocoa/12 text-ink"
                            : "text-ink/80 hover:bg-cocoa/10"
                      } ${dia === hoje && !selecionado ? "ring-1 ring-cocoa/40" : ""}`}
                    >
                      {n}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p aria-live="polite" className="text-[11px] text-ink/70 mt-3 leading-snug">
            {inicio && !fim
              ? "Agora escolha a data final."
              : inicio && fim
                ? `${curto(inicio)} até ${curto(fim)}`
                : "Escolha a data inicial."}
          </p>

          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              onClick={aplica}
              disabled={!inicio}
              className="flex-1 rounded-full bg-cocoa text-bone px-4 py-2.5 text-[11px] uppercase tracking-widest2 hover:bg-ink transition-colors motion-reduce:transition-none disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={() => {
                const ontem = somaDias(hoje, -1);
                setInicio(ontem);
                setFim(ontem);
                setFoco(ontem);
              }}
              className="rounded-full border border-cocoa/20 px-4 py-2.5 text-[11px] uppercase tracking-widest2 text-ink/75 hover:text-cocoa hover:border-cocoa transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cocoa/60"
            >
              Ontem
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
