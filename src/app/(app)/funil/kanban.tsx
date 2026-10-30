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

    if (etapa === "perdido") {
      setPerda({ id, titulo: cartao.titulo });
      return;
    }
    mover(id, etapa);
  }

  function mover(id: number, etapa: string, motivo?: string) {
    startTransition(async () => {
      moverLocal({ id, etapa });
      await moverOportunidade(id, etapa, motivo);
    });
  }

  const [perda, setPerda] = useState<{ id: number; titulo: string } | null>(null);
  const [motivo, setMotivo] = useState("");

  function fecharPerda(confirmar: boolean) {
    if (confirmar && perda) mover(perda.id, "perdido", motivo);
    setPerda(null);
    setMotivo("");
  }

  return (
    <>
    {perda && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => fecharPerda(false)}>
        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={(e) => {
            e.preventDefault();
            fecharPerda(true);
          }}
          className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        >
          <h2 className="text-base font-semibold text-slate-900">Marcar como perdida</h2>
          <p className="mt-1 text-sm text-slate-500">{perda.titulo}</p>
          <label className="mt-4 block">
            <span className="rotulo">Motivo da perda (opcional)</span>
            <input
              autoFocus
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Preço, concorrente, sem resposta..."
              className="campo"
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => fecharPerda(false)} className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700">
              Marcar como perdida
            </button>
          </div>
        </form>
      </div>
    )}
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
              className={`flex w-64 flex-col rounded-xl border border-t-4 ${etapa.borda} p-3 transition ${
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
    </>
  );
}
