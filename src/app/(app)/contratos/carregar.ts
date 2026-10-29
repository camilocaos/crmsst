import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contratos, empresas, propostaItens, propostas } from "@/db/schema";

export function carregarContrato(id: number) {
  const contrato = db.select().from(contratos).where(eq(contratos.id, id)).get();
  if (!contrato) return null;
  const proposta = db.select().from(propostas).where(eq(propostas.id, contrato.propostaId)).get()!;
  const itens = db.select().from(propostaItens).where(eq(propostaItens.propostaId, proposta.id)).orderBy(propostaItens.id).all();
  const empresa = db.select().from(empresas).where(eq(empresas.id, proposta.empresaId)).get()!;
  return { contrato, proposta, itens, empresa };
}
