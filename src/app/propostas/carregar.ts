import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contatos, empresas, oportunidades, propostaItens, propostas } from "@/db/schema";

export function carregarProposta(id: number) {
  const proposta = db.select().from(propostas).where(eq(propostas.id, id)).get();
  if (!proposta) return null;
  const itens = db.select().from(propostaItens).where(eq(propostaItens.propostaId, id)).orderBy(propostaItens.id).all();
  const empresa = db.select().from(empresas).where(eq(empresas.id, proposta.empresaId)).get()!;
  const oportunidade = proposta.oportunidadeId
    ? db.select().from(oportunidades).where(eq(oportunidades.id, proposta.oportunidadeId)).get()
    : undefined;
  const contatoId = oportunidade?.contatoId;
  const contato = contatoId
    ? db.select().from(contatos).where(eq(contatos.id, contatoId)).get()
    : db.select().from(contatos).where(eq(contatos.empresaId, empresa.id)).orderBy(contatos.principal).all().at(-1);
  return { proposta, itens, empresa, oportunidade, contato };
}
