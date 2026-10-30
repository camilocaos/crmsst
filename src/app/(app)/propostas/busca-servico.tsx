"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatarMoeda } from "@/lib/formato";

export type OpcaoBusca = {
  id: number;
  nome: string;
  categoria: string;
  precoBase: number;
  precoReciclagem: number | null;
  unidade: string;
};

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const MAXIMO = 80;

/** Campo de busca do catálogo: digite parte do nome (ex.: "empilhadeira", "nr 35"). */
export function BuscaServico<T extends OpcaoBusca>({
  servicos,
  aoEscolher,
  rotulo,
  extra,
}: {
  servicos: T[];
  aoEscolher: (s: T) => void;
  rotulo: string;
  /** Opção fixa no topo da lista (ex.: a tabela de exames inteira). */
  extra?: { rotulo: string; aoEscolher: () => void };
}) {
  const [texto, setTexto] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  const idLista = useId();

  const indice = useMemo(() => servicos.map((s) => ({ s, chave: normalizar(`${s.nome} ${s.categoria}`).replace(/-/g, " ") })), [servicos]);
  const termos = normalizar(texto).replace(/-/g, " ").split(/\s+/).filter(Boolean);
  const achados = indice.filter((i) => termos.every((t) => i.chave.includes(t))).map((i) => i.s);
  const visiveis = achados.slice(0, MAXIMO);
  const mostrarExtra = Boolean(extra) && termos.length === 0;
  const total = visiveis.length + (mostrarExtra ? 1 : 0);

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function escolher(k: number) {
    if (mostrarExtra && k === 0) extra!.aoEscolher();
    else {
      const s = visiveis[k - (mostrarExtra ? 1 : 0)];
      if (s) aoEscolher(s);
    }
    setTexto("");
    setAberto(false);
  }

  return (
    <div ref={caixa} className="relative w-full sm:w-96">
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setAtivo(0);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setAberto(true);
            setAtivo((a) => Math.min(a + 1, total - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setAtivo((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault(); // não envia o formulário
            if (aberto && total) escolher(ativo);
          } else if (e.key === "Escape") setAberto(false);
        }}
        placeholder={rotulo}
        className="campo"
        role="combobox"
        aria-expanded={aberto}
        aria-controls={idLista}
      />
      {aberto && (
        <ul id={idLista} role="listbox" className="absolute z-30 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg sm:w-[32rem]">
          {mostrarExtra && (
            <li
              role="option"
              aria-selected={ativo === 0}
              onMouseDown={(e) => {
                e.preventDefault();
                escolher(0);
              }}
              onMouseEnter={() => setAtivo(0)}
              className={`cursor-pointer px-3 py-2 text-sm font-semibold text-teal-800 ${ativo === 0 ? "bg-teal-50" : ""}`}
            >
              {extra!.rotulo}
            </li>
          )}
          {visiveis.map((s, k) => {
            const pos = k + (mostrarExtra ? 1 : 0);
            const cabecalho = s.categoria !== visiveis[k - 1]?.categoria ? s.categoria : null;
            const preco = s.precoReciclagem ?? s.precoBase;
            return (
              <li key={s.id} role="option" aria-selected={ativo === pos}>
                {cabecalho && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{cabecalho}</p>}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    escolher(pos);
                  }}
                  onMouseEnter={() => setAtivo(pos)}
                  className={`flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left text-sm ${ativo === pos ? "bg-marca-50" : ""}`}
                >
                  <span className="text-slate-800">{s.nome}</span>
                  <span className="shrink-0 text-xs tabular-nums text-slate-500">{preco ? `${s.precoReciclagem != null ? "recicl. " : ""}${formatarMoeda(preco)} ${s.unidade}` : "a definir"}</span>
                </button>
              </li>
            );
          })}
          {total === 0 && <li className="px-3 py-2 text-sm text-slate-500">Nada encontrado.</li>}
          {achados.length > MAXIMO && (
            <li className="px-3 py-2 text-xs text-slate-400">Mais {achados.length - MAXIMO}. Digite mais para filtrar.</li>
          )}
        </ul>
      )}
    </div>
  );
}
