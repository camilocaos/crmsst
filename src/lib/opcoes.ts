import "server-only";
import { db } from "@/db";
import { contatos, empresas } from "@/db/schema";

/** Listas de empresas e contatos para os selects de formulários. */
export function opcoesEmpresasEContatos() {
  const listaEmpresas = db
    .select({ id: empresas.id, razaoSocial: empresas.razaoSocial, nomeFantasia: empresas.nomeFantasia })
    .from(empresas)
    .orderBy(empresas.razaoSocial)
    .all()
    .map((e) => ({ id: e.id, nome: e.nomeFantasia ? `${e.nomeFantasia} (${e.razaoSocial})` : e.razaoSocial }));
  const listaContatos = db
    .select({ id: contatos.id, nome: contatos.nome, empresaId: contatos.empresaId })
    .from(contatos)
    .orderBy(contatos.nome)
    .all();
  return { empresas: listaEmpresas, contatos: listaContatos };
}
