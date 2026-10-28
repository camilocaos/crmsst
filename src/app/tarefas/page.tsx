import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { eq, gt, isNull, lt, lte, and } from "drizzle-orm";
import { tarefas } from "@/db/schema";
import { Cabecalho, Cartao, TituloCartao, Vazio } from "@/components/ui";
import { hoje, somarDias } from "@/lib/formato";
import { opcoesEmpresasEContatos } from "@/lib/opcoes";
import { buscarTarefas, pendentes } from "./consultas";
import { ListaTarefas } from "./lista-tarefas";
import { NovaTarefa } from "./nova-tarefa";

export const metadata: Metadata = { title: "Tarefas" };

const ABAS = [
  { id: "pendentes", nome: "Pendentes" },
  { id: "concluidas", nome: "Concluídas" },
] as const;

export default async function TarefasPage({ searchParams }: PageProps<"/tarefas">) {
  await connection();
  const { aba } = await searchParams;
  const abaAtual = aba === "concluidas" ? "concluidas" : "pendentes";
  const d = hoje();
  const em7 = somarDias(d, 7);

  const grupos =
    abaAtual === "pendentes"
      ? [
          { titulo: "Atrasadas", cor: "text-rose-600", itens: buscarTarefas(pendentes(lt(tarefas.vencimento, d))) },
          { titulo: "Hoje", cor: "text-amber-700", itens: buscarTarefas(pendentes(eq(tarefas.vencimento, d))) },
          {
            titulo: "Próximos 7 dias",
            cor: "text-slate-800",
            itens: buscarTarefas(pendentes(and(gt(tarefas.vencimento, d), lte(tarefas.vencimento, em7)))),
          },
          { titulo: "Mais adiante", cor: "text-slate-800", itens: buscarTarefas(pendentes(gt(tarefas.vencimento, em7))) },
          { titulo: "Sem data", cor: "text-slate-500", itens: buscarTarefas(pendentes(isNull(tarefas.vencimento))) },
        ]
      : [{ titulo: "Concluídas", cor: "text-slate-800", itens: buscarTarefas(eq(tarefas.concluida, true), "recentes") }];

  const total = grupos.reduce((s, g) => s + g.itens.length, 0);
  const atrasadas = abaAtual === "pendentes" ? grupos[0].itens.length : 0;

  return (
    <>
      <Cabecalho
        titulo="Tarefas e follow-ups"
        subtitulo={
          abaAtual === "pendentes"
            ? `${total} pendentes${atrasadas ? ` · ${atrasadas} atrasadas` : ""}`
            : `${total} concluídas`
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div>
          <div className="mb-4 flex gap-1 rounded-lg bg-slate-200/60 p-1 text-sm w-fit">
            {ABAS.map((a) => (
              <Link
                key={a.id}
                href={a.id === "pendentes" ? "/tarefas" : `/tarefas?aba=${a.id}`}
                className={`rounded-md px-3 py-1.5 ${
                  abaAtual === a.id ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {a.nome}
              </Link>
            ))}
          </div>

          {total === 0 ? (
            <Vazio>{abaAtual === "pendentes" ? "Nenhuma tarefa pendente. 🎉" : "Nenhuma tarefa concluída ainda."}</Vazio>
          ) : (
            <div className="space-y-4">
              {grupos
                .filter((g) => g.itens.length > 0)
                .map((g) => (
                  <Cartao key={g.titulo} className="py-3">
                    <h2 className={`text-xs font-semibold uppercase tracking-wide ${g.cor}`}>
                      {g.titulo} <span className="text-slate-400">({g.itens.length})</span>
                    </h2>
                    <ListaTarefas itens={g.itens} />
                  </Cartao>
                ))}
            </div>
          )}
        </div>

        <Cartao className="h-fit">
          <TituloCartao>Nova tarefa</TituloCartao>
          <NovaTarefa empresas={opcoesEmpresasEContatos().empresas} />
        </Cartao>
      </div>
    </>
  );
}
