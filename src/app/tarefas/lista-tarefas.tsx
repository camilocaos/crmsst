import Link from "next/link";
import { Selo } from "@/components/ui";
import { PRIORIDADES, TIPOS_TAREFA } from "@/lib/constantes";
import { formatarData, hoje } from "@/lib/formato";
import { adiarTarefa, alternarTarefa, excluirTarefa } from "./actions";

export type ItemTarefa = {
  id: number;
  titulo: string;
  tipo: string;
  prioridade: "baixa" | "media" | "alta";
  vencimento: string | null;
  concluida: boolean;
  descricao: string | null;
  empresaId: number | null;
  empresa: string | null;
};

export function ListaTarefas({ itens, mostrarEmpresa = true }: { itens: ItemTarefa[]; mostrarEmpresa?: boolean }) {
  const dataHoje = hoje();
  return (
    <ul className="divide-y divide-slate-100">
      {itens.map((t) => {
        const atrasada = !t.concluida && t.vencimento && t.vencimento < dataHoje;
        const ehHoje = t.vencimento === dataHoje;
        return (
          <li key={t.id} className="group flex items-start gap-3 py-3">
            <form action={alternarTarefa.bind(null, t.id)} className="pt-0.5">
              <button
                title={t.concluida ? "Reabrir" : "Concluir"}
                className={`flex h-5 w-5 items-center justify-center rounded-md border text-xs transition ${
                  t.concluida
                    ? "border-marca-500 bg-marca-500 text-white"
                    : "border-slate-300 bg-white text-transparent hover:border-marca-500 hover:text-marca-500"
                }`}
              >
                ✓
              </button>
            </form>
            <div className="min-w-0 flex-1">
              <p className={`text-sm ${t.concluida ? "text-slate-400 line-through" : "font-medium text-slate-900"}`}>
                {t.titulo}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span>{TIPOS_TAREFA[t.tipo as keyof typeof TIPOS_TAREFA] ?? t.tipo}</span>
                {mostrarEmpresa && t.empresa && (
                  <Link href={`/empresas/${t.empresaId}`} className="hover:text-marca-700 hover:underline">
                    · {t.empresa}
                  </Link>
                )}
                {t.vencimento && (
                  <span className={atrasada ? "font-medium text-rose-600" : ehHoje ? "font-medium text-amber-700" : ""}>
                    · {ehHoje ? "hoje" : formatarData(t.vencimento)}
                    {atrasada ? " (atrasada)" : ""}
                  </span>
                )}
                {!t.concluida && t.prioridade !== "media" && (
                  <Selo classe={PRIORIDADES[t.prioridade].classe}>{PRIORIDADES[t.prioridade].nome}</Selo>
                )}
              </div>
              {t.descricao && <p className="mt-1 whitespace-pre-line text-xs text-slate-600">{t.descricao}</p>}
            </div>
            <div className="flex gap-1 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
              {!t.concluida && (
                <form action={adiarTarefa.bind(null, t.id)}>
                  <button title="Adiar 1 dia" className="rounded px-1.5 py-1 text-xs text-slate-500 hover:bg-slate-100">
                    +1d
                  </button>
                </form>
              )}
              <form action={excluirTarefa.bind(null, t.id)}>
                <button title="Excluir" className="rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  ✕
                </button>
              </form>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
