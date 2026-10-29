import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { oportunidades, servicos } from "@/db/schema";
import { opcoesEmpresasEContatos } from "@/lib/opcoes";

export function opcoesEditor() {
  return {
    empresas: opcoesEmpresasEContatos().empresas,
    oportunidades: db
      .select({ id: oportunidades.id, titulo: oportunidades.titulo, empresaId: oportunidades.empresaId })
      .from(oportunidades)
      .all(),
    servicos: db
      .select({
        id: servicos.id,
        nome: servicos.nome,
        categoria: servicos.categoria,
        precoBase: servicos.precoBase,
        unidade: servicos.unidade,
        descricao: servicos.descricao,
        area: servicos.area,
        cobranca: servicos.cobranca,
      })
      .from(servicos)
      .where(eq(servicos.ativo, true))
      // na ordem em que entraram no catálogo (a mesma da tabela da clínica: combos por último)
      .orderBy(asc(servicos.id))
      .all(),
  };
}
