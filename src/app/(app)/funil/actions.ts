"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { exigirUsuario } from "@/lib/sessao";
import { empresas, oportunidades } from "@/db/schema";
import { ETAPAS, type EtapaId } from "@/lib/constantes";
import { hoje } from "@/lib/formato";
import { idOpcional, lerForm, numeroOpcional, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";

const idsEtapas = ETAPAS.map((e) => e.id) as [EtapaId, ...EtapaId[]];

const oportunidadeSchema = z.object({
  titulo: textoObrigatorio("Título"),
  empresaId: idOpcional.refine((v) => v !== null, "Escolha a empresa").transform((v) => v!),
  contatoId: idOpcional,
  etapa: z.enum(idsEtapas).default("prospeccao"),
  valor: numeroOpcional.transform((v) => v ?? 0),
  probabilidade: idOpcional,
  previsaoFechamento: textoOpcional,
  motivoPerda: textoOpcional,
  observacoes: textoOpcional,
});

/** Campos que dependem da etapa: probabilidade padrão, data de fechamento e status da empresa. */
function camposDaEtapa(etapa: EtapaId, probabilidade: number | null) {
  const padrao = ETAPAS.find((e) => e.id === etapa)!.probabilidade;
  const fechada = etapa === "ganho" || etapa === "perdido";
  return {
    probabilidade: fechada ? padrao : (probabilidade ?? padrao),
    fechadoEm: fechada ? hoje() : null,
  };
}

function marcarClienteSeGanho(empresaId: number, etapa: EtapaId) {
  if (etapa === "ganho") {
    db.update(empresas).set({ status: "cliente" }).where(eq(empresas.id, empresaId)).run();
  }
}

export async function criarOportunidade(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, oportunidadeSchema);
  if (!r.valido) return { erro: r.erro };
  const d = r.dados;
  db.insert(oportunidades)
    .values({ ...d, ...camposDaEtapa(d.etapa, d.probabilidade) })
    .run();
  marcarClienteSeGanho(d.empresaId, d.etapa);
  revalidatePath("/", "layout");
  redirect("/funil");
}

export async function atualizarOportunidade(id: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, oportunidadeSchema);
  if (!r.valido) return { erro: r.erro };
  const d = r.dados;
  const atual = db.select().from(oportunidades).where(eq(oportunidades.id, id)).get();
  if (!atual) return { erro: "Oportunidade não encontrada" };
  const mudouEtapa = atual.etapa !== d.etapa;
  db.update(oportunidades)
    .set({
      ...d,
      ...(mudouEtapa ? camposDaEtapa(d.etapa, d.probabilidade) : { probabilidade: d.probabilidade ?? atual.probabilidade }),
    })
    .where(eq(oportunidades.id, id))
    .run();
  if (mudouEtapa) marcarClienteSeGanho(d.empresaId, d.etapa);
  revalidatePath("/", "layout");
  redirect("/funil");
}

/** Usado pelo arrastar-e-soltar do Kanban. */
export async function moverOportunidade(id: number, etapa: string, motivoPerda?: string) {
  await exigirUsuario();
  const etapaValida = z.enum(idsEtapas).parse(etapa);
  const atual = db.select().from(oportunidades).where(eq(oportunidades.id, id)).get();
  if (!atual || atual.etapa === etapaValida) return;
  db.update(oportunidades)
    .set({
      etapa: etapaValida,
      ...camposDaEtapa(etapaValida, null),
      motivoPerda: etapaValida === "perdido" ? (motivoPerda?.trim() || null) : null,
    })
    .where(eq(oportunidades.id, id))
    .run();
  marcarClienteSeGanho(atual.empresaId, etapaValida);
  revalidatePath("/", "layout");
}

export async function excluirOportunidade(id: number) {
  await exigirUsuario();
  db.delete(oportunidades).where(eq(oportunidades.id, id)).run();
  revalidatePath("/", "layout");
  redirect("/funil");
}
