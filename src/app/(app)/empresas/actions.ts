"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { exigirUsuario } from "@/lib/sessao";
import { cnpjValido, consultarCnpj, type DadosCnpj } from "@/lib/cnpj";
import { grauRiscoPorCnae } from "@/lib/grau-risco";
import { acharEmpresaDuplicada, type EmpresaExistente } from "@/lib/empresa-duplicada";
import { contatos, empresas, notas } from "@/db/schema";
import { checkbox, idOpcional, lerForm, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";

const empresaSchema = z.object({
  razaoSocial: textoObrigatorio("Razão social"),
  nomeFantasia: textoOpcional,
  cnpj: textoOpcional.transform((v) => (v ? v.replace(/\D/g, "") : null)),
  segmento: textoOpcional,
  cnae: textoOpcional,
  grauRisco: idOpcional.refine((v) => v === null || (v >= 1 && v <= 4), "deve ser de 1 a 4"),
  numFuncionarios: idOpcional,
  telefone: textoOpcional,
  email: z.email("e-mail inválido").nullish().transform((v) => v ?? null),
  endereco: textoOpcional,
  cidade: textoOpcional,
  uf: textoOpcional,
  origem: textoOpcional,
  status: z.enum(["lead", "cliente", "inativo"]).default("lead"),
  observacoes: textoOpcional,
})
  // Sem grau de risco informado, usa o da NR-04 pelo CNAE (escolha manual sempre prevalece)
  .transform((d) => ({ ...d, grauRisco: d.grauRisco ?? grauRiscoPorCnae(d.cnae) }));

/** Mensagem de bloqueio quando a empresa já existe (o formulário mostra o link para o cadastro). */
const jaCadastrada = (e: EmpresaExistente): EstadoForm => ({
  erro: `Essa empresa já está cadastrada como "${e.nome}". Abra o cadastro existente em vez de criar outro.`,
  link: { href: `/empresas/${e.id}`, texto: "Abrir o cadastro existente" },
});

export async function criarEmpresa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, empresaSchema);
  if (!r.valido) return { erro: r.erro };
  const existente = acharEmpresaDuplicada(r.dados);
  if (existente) return jaCadastrada(existente);
  const [nova] = db.insert(empresas).values(r.dados).returning({ id: empresas.id }).all();
  revalidatePath("/empresas");
  redirect(`/empresas/${nova.id}`);
}

export async function atualizarEmpresa(id: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, empresaSchema);
  if (!r.valido) return { erro: r.erro };
  const existente = acharEmpresaDuplicada(r.dados, id);
  if (existente) return jaCadastrada(existente);
  db.update(empresas).set(r.dados).where(eq(empresas.id, id)).run();
  revalidatePath("/empresas");
  redirect(`/empresas/${id}`);
}

export async function excluirEmpresa(id: number) {
  await exigirUsuario();
  db.delete(empresas).where(eq(empresas.id, id)).run();
  revalidatePath("/", "layout");
  redirect("/empresas");
}

const contatoSchema = z.object({
  nome: textoObrigatorio("Nome"),
  cargo: textoOpcional,
  email: z.email("e-mail inválido").nullish().transform((v) => v ?? null),
  telefone: textoOpcional,
  principal: checkbox,
});

export async function criarContato(empresaId: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, contatoSchema);
  if (!r.valido) return { erro: r.erro };
  db.transaction((tx) => {
    if (r.dados.principal) {
      tx.update(contatos).set({ principal: false }).where(eq(contatos.empresaId, empresaId)).run();
    }
    tx.insert(contatos).values({ ...r.dados, empresaId }).run();
  });
  revalidatePath(`/empresas/${empresaId}`);
  return { ok: true };
}

export async function excluirContato(empresaId: number, contatoId: number) {
  await exigirUsuario();
  db.delete(contatos)
    .where(and(eq(contatos.id, contatoId), eq(contatos.empresaId, empresaId)))
    .run();
  revalidatePath(`/empresas/${empresaId}`);
}

export async function tornarPrincipal(empresaId: number, contatoId: number) {
  await exigirUsuario();
  db.transaction((tx) => {
    tx.update(contatos).set({ principal: false }).where(eq(contatos.empresaId, empresaId)).run();
    tx.update(contatos)
      .set({ principal: true })
      .where(and(eq(contatos.id, contatoId), eq(contatos.empresaId, empresaId)))
      .run();
  });
  revalidatePath(`/empresas/${empresaId}`);
}

export async function criarNota(empresaId: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, z.object({ texto: textoObrigatorio("Texto") }));
  if (!r.valido) return { erro: r.erro };
  db.insert(notas).values({ empresaId, texto: r.dados.texto }).run();
  revalidatePath(`/empresas/${empresaId}`);
  return { ok: true };
}

/** Busca os dados públicos do CNPJ na Receita (via BrasilAPI) para preencher o formulário. */
export async function buscarCnpj(
  cnpj: string,
  empresaAtualId?: number,
): Promise<{ ok: true; dados: DadosCnpj } | { ok: false; erro: string; existente?: EmpresaExistente }> {
  await exigirUsuario();
  if (!cnpjValido(cnpj)) return { ok: false, erro: "CNPJ inválido. Confira os números." };
  const existente = acharEmpresaDuplicada({ cnpj: cnpj.replace(/\D/g, ""), razaoSocial: "" }, empresaAtualId);
  if (existente) return { ok: false, erro: `Essa empresa já está cadastrada como "${existente.nome}".`, existente };
  const r = await consultarCnpj(cnpj);
  if (r === "nao-encontrado") return { ok: false, erro: "CNPJ não encontrado na Receita." };
  if (r === "indisponivel") return { ok: false, erro: "Não deu para consultar agora (sem internet ou serviço fora do ar). Preencha à mão." };
  return { ok: true, dados: r };
}

export async function excluirNota(empresaId: number, notaId: number) {
  await exigirUsuario();
  db.delete(notas).where(and(eq(notas.id, notaId), eq(notas.empresaId, empresaId))).run();
  revalidatePath(`/empresas/${empresaId}`);
}
