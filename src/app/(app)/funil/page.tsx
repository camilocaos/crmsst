import type { Metadata } from "next";
import { connection } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { empresas, oportunidades } from "@/db/schema";
import { BotaoLink, Cabecalho } from "@/components/ui";
import { ETAPAS_ABERTAS } from "@/lib/constantes";
import { formatarMoeda } from "@/lib/formato";
import { Kanban } from "./kanban";

export const metadata: Metadata = { title: "Funil de vendas" };

export default async function FunilPage() {
  await connection();
  const cartoes = db
    .select({
      id: oportunidades.id,
      titulo: oportunidades.titulo,
      etapa: oportunidades.etapa,
      valor: oportunidades.valor,
      probabilidade: oportunidades.probabilidade,
      previsaoFechamento: oportunidades.previsaoFechamento,
      empresaId: oportunidades.empresaId,
      empresa: empresas.razaoSocial,
      nomeFantasia: empresas.nomeFantasia,
    })
    .from(oportunidades)
    .innerJoin(empresas, eq(empresas.id, oportunidades.empresaId))
    .orderBy(desc(oportunidades.id))
    .all()
    .map(({ nomeFantasia, ...c }) => ({ ...c, empresa: nomeFantasia || c.empresa }));

  const abertas = db
    .select({ valor: oportunidades.valor, probabilidade: oportunidades.probabilidade })
    .from(oportunidades)
    .where(inArray(oportunidades.etapa, ETAPAS_ABERTAS))
    .all();
  const totalAberto = abertas.reduce((s, o) => s + o.valor, 0);
  const ponderado = abertas.reduce((s, o) => s + (o.valor * o.probabilidade) / 100, 0);

  return (
    <>
      <Cabecalho
        titulo="Funil de vendas"
        subtitulo={`${abertas.length} em aberto · ${formatarMoeda(totalAberto)} no funil · ${formatarMoeda(ponderado)} ponderado pela probabilidade`}
        acoes={<BotaoLink href="/funil/nova">+ Nova oportunidade</BotaoLink>}
      />
      <p className="mb-3 text-xs text-slate-500">Arraste os cartões entre as colunas para mudar a etapa.</p>
      <Kanban cartoes={cartoes} />
    </>
  );
}
