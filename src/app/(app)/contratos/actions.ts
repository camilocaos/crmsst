"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { contratos, empresas, propostaItens, propostas, type Area } from "@/db/schema";
import { checkbox, lerForm, numeroOpcional, textoOpcional, type EstadoForm } from "@/lib/form";
import { exigirUsuario } from "@/lib/sessao";

/**
 * Cria os contratos de uma proposta aceita: um da Segurança (programas, laudos, treinamentos...)
 * e/ou um da Saúde (exames), conforme o que foi contratado. Não duplica os que já existem.
 */
export async function gerarContratos(propostaId: number) {
  await exigirUsuario();
  const proposta = db.select().from(propostas).where(eq(propostas.id, propostaId)).get();
  if (!proposta) return;
  const empresa = db.select().from(empresas).where(eq(empresas.id, proposta.empresaId)).get()!;
  const itens = db.select().from(propostaItens).where(and(eq(propostaItens.propostaId, propostaId), eq(propostaItens.opcional, false))).all();
  const areas = [...new Set(itens.map((i) => i.area))] as Area[];

  let primeiro: number | null = null;
  for (const area of areas) {
    const existente = db.select({ id: contratos.id }).from(contratos).where(and(eq(contratos.propostaId, propostaId), eq(contratos.area, area))).get();
    if (existente) {
      primeiro ??= existente.id;
      continue;
    }
    const novo = db
      .insert(contratos)
      .values({
        propostaId,
        area,
        tipo: "pontual",
        // Saúde é por demanda: sem prazo final, até alguém encerrar. Fica visível e editável no contrato.
        vigencia: area === "saude" ? "prazo indeterminado" : null,
        formaPagamento: area === "seguranca" ? proposta.condicoesPagamento : null,
        enderecoCliente: [empresa.endereco, empresa.cidade && `${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}`].filter(Boolean).join(", ") || null,
      })
      .returning({ id: contratos.id })
      .get();
    primeiro ??= novo.id;
  }
  revalidatePath("/", "layout");
  if (primeiro) redirect(`/contratos/${primeiro}`);
}

/** Botão "Gerar contrato" / "Abrir contrato": só para proposta aceita. Abre o contrato. */
export async function contratoDaProposta(propostaId: number) {
  await exigirUsuario();
  const p = db.select({ status: propostas.status }).from(propostas).where(eq(propostas.id, propostaId)).get();
  if (p?.status === "aceita") await gerarContratos(propostaId); // redireciona para o contrato
  redirect(`/propostas/${propostaId}`); // não aceita ou sem itens: volta para a proposta
}

const contratoSchema = z.object({
  tipo: z.enum(["pontual", "mensalista"]).default("pontual"),
  formalizacaoPosterior: checkbox,
  dataExecucao: textoOpcional,
  valorMensal: numeroOpcional,
  vigencia: textoOpcional,
  formaPagamento: textoOpcional,
  vencimento: textoOpcional,
  pagamentosRealizados: textoOpcional,
  enderecoCliente: textoOpcional,
  representante: textoOpcional,
  testemunha1: textoOpcional,
  testemunha2: textoOpcional,
  dataAssinatura: textoOpcional,
  status: z.enum(["rascunho", "enviado", "assinado", "cancelado"]).default("rascunho"),
  observacoes: textoOpcional,
});

export async function salvarContrato(id: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, contratoSchema);
  if (!r.valido) return { erro: r.erro };
  const atual = db.select({ area: contratos.area }).from(contratos).where(eq(contratos.id, id)).get();
  if (!atual) return { erro: "Contrato não encontrado." };
  const d = r.dados;
  if (atual.area === "seguranca" && d.tipo === "mensalista" && !d.valorMensal) return { erro: "Informe o valor mensal do contrato mensalista." };
  if (d.formalizacaoPosterior === false) d.dataExecucao = null;
  db.update(contratos)
    .set({ ...d, tipo: atual.area === "saude" ? "pontual" : d.tipo, valorMensal: d.tipo === "mensalista" ? d.valorMensal : null })
    .where(eq(contratos.id, id))
    .run();
  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  return { ok: true };
}

export async function excluirContrato(id: number) {
  await exigirUsuario();
  const c = db.select({ propostaId: contratos.propostaId }).from(contratos).where(eq(contratos.id, id)).get();
  db.delete(contratos).where(eq(contratos.id, id)).run();
  revalidatePath("/", "layout");
  redirect(c ? `/propostas/${c.propostaId}` : "/contratos");
}
