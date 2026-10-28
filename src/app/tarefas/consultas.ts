import "server-only";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { empresas, tarefas } from "@/db/schema";
import type { ItemTarefa } from "./lista-tarefas";

export function buscarTarefas(filtro?: SQL, ordem: "vencimento" | "recentes" = "vencimento"): ItemTarefa[] {
  return db
    .select({
      id: tarefas.id,
      titulo: tarefas.titulo,
      tipo: tarefas.tipo,
      prioridade: tarefas.prioridade,
      vencimento: tarefas.vencimento,
      concluida: tarefas.concluida,
      descricao: tarefas.descricao,
      empresaId: tarefas.empresaId,
      empresa: sql<string | null>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
    })
    .from(tarefas)
    .leftJoin(empresas, eq(empresas.id, tarefas.empresaId))
    .where(filtro)
    .orderBy(
      ...(ordem === "vencimento"
        ? [sql`${tarefas.vencimento} is null`, asc(tarefas.vencimento), sql`case ${tarefas.prioridade} when 'alta' then 0 when 'media' then 1 else 2 end`]
        : [desc(tarefas.id)]),
    )
    .all();
}

export const pendentes = (extra?: SQL) => and(eq(tarefas.concluida, false), extra);
