"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { exigirUsuario } from "@/lib/sessao";
import { empresas, oportunidades, propostaItens, propostas } from "@/db/schema";
import { ETAPAS_ABERTAS } from "@/lib/constantes";
import { hoje } from "@/lib/formato";
import { calcularTotais } from "@/lib/propostas";
import { idOpcional, lerForm, numeroOpcional, textoOpcional, type EstadoForm } from "@/lib/form";

const itemSchema = z.object({
  servicoId: z.number().int().nullable(),
  descricao: z.string().trim().min(1, "Descrição do item é obrigatória"),
  quantidade: z.number().positive("Quantidade deve ser maior que zero"),
  valorUnitario: z.number().min(0, "Valor não pode ser negativo"),
});

const propostaSchema = z.object({
  empresaId: idOpcional.refine((v) => v !== null, "Escolha a empresa").transform((v) => v!),
  oportunidadeId: idOpcional,
  status: z.enum(["rascunho", "enviada", "aceita", "recusada"]).default("rascunho"),
  validade: textoOpcional,
  desconto: numeroOpcional.transform((v) => Math.min(Math.max(v ?? 0, 0), 100)),
  condicoesPagamento: textoOpcional,
  observacoes: textoOpcional,
  itens: z
    .string({ error: "Adicione pelo menos um item" })
    .transform((texto, ctx) => {
      try {
        return JSON.parse(texto) as unknown;
      } catch {
        ctx.addIssue({ code: "custom", message: "itens inválidos" });
        return z.NEVER;
      }
    })
    .pipe(z.array(itemSchema).min(1, "Adicione pelo menos um item")),
});

/** Mantém a oportunidade ligada em sincronia com o status da proposta. */
function sincronizarOportunidade(oportunidadeId: number | null, status: string, total: number) {
  if (!oportunidadeId) return;
  const op = db.select().from(oportunidades).where(eq(oportunidades.id, oportunidadeId)).get();
  if (!op) return;
  const aberta = (ETAPAS_ABERTAS as string[]).includes(op.etapa);

  if (status === "aceita" && op.etapa !== "ganho") {
    db.update(oportunidades)
      .set({ etapa: "ganho", probabilidade: 100, valor: total, fechadoEm: hoje(), motivoPerda: null })
      .where(eq(oportunidades.id, op.id))
      .run();
    db.update(empresas).set({ status: "cliente" }).where(eq(empresas.id, op.empresaId)).run();
  } else if (status === "enviada" && aberta) {
    const antesDaProposta = ["prospeccao", "qualificacao", "visita_tecnica"].includes(op.etapa);
    db.update(oportunidades)
      .set({ valor: total, ...(antesDaProposta ? { etapa: "proposta", probabilidade: 60 } : {}) })
      .where(eq(oportunidades.id, op.id))
      .run();
  } else if (aberta) {
    db.update(oportunidades).set({ valor: total }).where(eq(oportunidades.id, op.id)).run();
  }
}

export async function salvarProposta(id: number | null, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, propostaSchema);
  if (!r.valido) return { erro: r.erro };
  const { itens, ...dados } = r.dados;
  const { total } = calcularTotais(itens, dados.desconto);

  const propostaId = db.transaction((tx) => {
    let pid = id;
    if (pid) {
      tx.update(propostas).set(dados).where(eq(propostas.id, pid)).run();
      tx.delete(propostaItens).where(eq(propostaItens.propostaId, pid)).run();
    } else {
      pid = tx.insert(propostas).values(dados).returning({ id: propostas.id }).get().id;
    }
    tx.insert(propostaItens)
      .values(itens.map((i) => ({ ...i, propostaId: pid! })))
      .run();
    return pid;
  });

  sincronizarOportunidade(dados.oportunidadeId, dados.status, total);
  revalidatePath("/", "layout");
  redirect(`/propostas/${propostaId}`);
}

export async function mudarStatusProposta(id: number, status: "rascunho" | "enviada" | "aceita" | "recusada") {
  await exigirUsuario();
  const p = db.select().from(propostas).where(eq(propostas.id, id)).get();
  if (!p) return;
  db.update(propostas).set({ status }).where(eq(propostas.id, id)).run();
  const itens = db.select().from(propostaItens).where(eq(propostaItens.propostaId, id)).all();
  sincronizarOportunidade(p.oportunidadeId, status, calcularTotais(itens, p.desconto).total);
  revalidatePath("/", "layout");
}

export async function excluirProposta(id: number) {
  await exigirUsuario();
  db.delete(propostas).where(eq(propostas.id, id)).run();
  revalidatePath("/", "layout");
  redirect("/propostas");
}
