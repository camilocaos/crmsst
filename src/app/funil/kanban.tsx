"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ETAPAS } from "@/lib/constantes";
import { formatarData, formatarMoeda, hoje } from "@/lib/formato";
import { moverOportunidade } from "./actions";

export type CartaoKanban = {
  id: number;
  titulo: string;
  etapa: string;
  valor: number;
  probabilidade: number;
  previsaoFechamento: string | null;
  empresaId: number;
  empresa: string;
};

export function Kanban({ cartoes }: { cartoes: CartaoKanban[] }) {
  const [lista, moverLocal] = useOptimistic(cartoes, (atual, { id, etapa }: { id: number; etapa: string }) =>
    atual.map((c) => (c.id === id ? { ...c, etapa } : c)),
  );
  const [, startTransition] = useTransition();
  const [arrastando, setArrastando] = useState<number | null>(null);
  const [alvo, setAlvo] = useState<string | null>(null);
  const dataHoje = hoje();

  function soltar(etapa: string) {
    setAlvo(null);
    const id = arrastando;
    setArrastando(null);
    if (id === null) return;
    const cartao = lista.find((c) => c.id === id);
    if (!cartao || cartao.etapa === etapa) return;

    let motivo: string | undefined;
    if (etapa === "perdido") {
      const resposta = prompt("Motivo da perda (opcional): preço, concorrente, sem resposta...");
      if (resposta === null) return; // cancelou
      motivo = resposta;
    }
    startTransition(async () => {
      moverLocal({ id, etapa });
      await moverOportunidade(id, etapa, motivo);
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
      <div className="flex min-w-max gap-4">
        {ETAPAS.map((etapa) => {
          const daEtapa = lista.filter((c) => c.etapa === etapa.id);
          const total = daEtapa.reduce((s, c) => s + c.valor, 0);
          return (
            <section
              key={etapa.id}
              onDragOver={(e) => {
                e.preventDefault();
                setAlvo(etapa.id);
              }}
              onDragLeave={() => setAlvo((a) => (a === etapa.id ? null : a))}
              onDrop={() => soltar(etapa.id)}
              className={`flex w-64 flex-col rounded-xl border p-3 transition ${
                alvo === etapa.id ? "border-marca-500 bg-marca-50" : "border-slate-200 bg-slate-100/70"
              }`}
            >
              <header className="mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${etapa.cor}`} />
                  <h2 className="text-sm font-semibold text-slate-800">{etapa.nome}</h2>
                  <span className="ml-auto rounded-full bg-white px-2 text-xs text-slate-500">{daEtapa.length}</span>
                </div>
                <p className="mt-1 text-xs font-medium tabular-nums text-slate-500">{formatarMoeda(total)}</p>
              </header>
              <div className="flex min-h-24 flex-1 flex-col gap-2">
                {daEtapa.map((c) => {
                  const atrasada =
                    c.previsaoFechamento && c.previsaoFechamento < dataHoje && etapa.id !== "ganho" && etapa.id !== "perdido";
                  return (
                    <article
                      key={c.id}
                      draggable
                      onDragStart={() => setArrastando(c.id)}
                      onDragEnd={() => setArrastando(null)}
                      className={`cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow active:cursor-grabbing ${
                        arrastando === c.id ? "opacity-50" : ""
                      }`}
                    >
                      <Link href={`/funil/${c.id}`} className="block text-sm font-medium text-slate-900 hover:text-marca-700">
                        {c.titulo}
                      </Link>
                      <Link href={`/empresas/${c.empresaId}`} className="block text-xs text-slate-500 hover:underline">
                        {c.empresa}
                      </Link>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-semibold tabular-nums text-slate-800">{formatarMoeda(c.valor)}</span>
                        <span className={atrasada ? "font-medium text-rose-600" : "text-slate-500"}>
                          {c.previsaoFechamento ? formatarData(c.previsaoFechamento) : `${c.probabilidade}%`}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
