import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { empresas } from "@/db/schema";

/** "Cor & Cacho Cabeleireiros S.A." e "COR E CACHO CABELEIREIROS SA" viram a mesma chave. */
export function chaveRazaoSocial(razao: string) {
  return razao
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type EmpresaExistente = { id: number; nome: string };

/**
 * Procura uma empresa já cadastrada igual a esta: pelo CNPJ, ou pela razão social
 * quando um dos dois cadastros não tem CNPJ. `ignorarId` é a própria empresa (na edição).
 */
export function acharEmpresaDuplicada(
  dados: { cnpj: string | null; razaoSocial: string },
  ignorarId?: number,
): EmpresaExistente | null {
  const outra = ignorarId ? ne(empresas.id, ignorarId) : undefined;
  const campos = { id: empresas.id, razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia, cnpj: empresas.cnpj };
  const resposta = (e: { id: number; razaoSocial: string; nomeFantasia: string | null }) => ({
    id: e.id,
    nome: e.nomeFantasia || e.razaoSocial,
  });

  if (dados.cnpj) {
    const e = db.select(campos).from(empresas).where(and(eq(empresas.cnpj, dados.cnpj), outra)).get();
    if (e) return resposta(e);
  }

  const chave = chaveRazaoSocial(dados.razaoSocial);
  if (!chave) return null;
  // Com CNPJs diferentes são empresas (ou filiais) diferentes de verdade, mesmo com o mesmo nome.
  const igual = db
    .select(campos)
    .from(empresas)
    .where(outra)
    .all()
    .find((e) => (!dados.cnpj || !e.cnpj) && chaveRazaoSocial(e.razaoSocial) === chave);
  return igual ? resposta(igual) : null;
}
