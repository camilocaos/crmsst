"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { salvarConfig } from "@/lib/config";
import { aplicarMargemMedicoes } from "@/db/catalogo-sst";
import { lerForm, nomeUsuarioSchema, numeroOpcional, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";
import { gerarHashSenha } from "@/lib/senha";
import { exigirUsuario } from "@/lib/sessao";

const nomeUsuario = nomeUsuarioSchema;

export async function salvarEmpresa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(
    formData,
    z.object({
      nomeEmpresa: textoObrigatorio("Nome da empresa"),
      cnpjEmpresa: textoOpcional,
      telefoneEmpresa: textoOpcional,
      emailEmpresa: textoOpcional,
      enderecoEmpresa: textoOpcional,
      metaMensal: numeroOpcional,
      validadePropostaDias: numeroOpcional,
      condicoesPagamento: textoOpcional,
      margemMedicoes: numeroOpcional,
    }),
  );
  if (!r.valido) return { erro: r.erro };
  const d = r.dados;
  salvarConfig({
    nome_empresa: d.nomeEmpresa,
    empresa_cnpj: d.cnpjEmpresa ?? "",
    empresa_telefone: d.telefoneEmpresa ?? "",
    empresa_email: d.emailEmpresa ?? "",
    empresa_endereco: d.enderecoEmpresa ?? "",
    meta_mensal: String(Math.max(0, d.metaMensal ?? 0)),
    validade_proposta_dias: String(Math.max(1, Math.trunc(d.validadePropostaDias ?? 15))),
    condicoes_pagamento: d.condicoesPagamento ?? "",
    margem_medicoes: String(Math.max(0, d.margemMedicoes ?? 0)),
  });
  aplicarMargemMedicoes(db, Math.max(0, d.margemMedicoes ?? 0));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function salvarPerfil(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const eu = await exigirUsuario();
  const r = lerForm(formData, z.object({ nome: textoObrigatorio("Nome"), usuario: nomeUsuario }));
  if (!r.valido) return { erro: r.erro.replace(/^\w+: /, "") };
  const emUso = db
    .select({ id: usuarios.id })
    .from(usuarios)
    .where(and(eq(usuarios.usuario, r.dados.usuario), ne(usuarios.id, eu.id)))
    .get();
  if (emUso) return { erro: "Esse nome de usuário já está em uso." };
  db.update(usuarios).set(r.dados).where(eq(usuarios.id, eu.id)).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function criarUsuario(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(
    formData,
    z.object({
      nome: textoObrigatorio("Nome"),
      usuario: nomeUsuario,
      senha: z.string({ error: "Defina uma senha provisória" }).min(6, "a senha provisória precisa de 6+ caracteres"),
    }),
  );
  if (!r.valido) return { erro: r.erro.replace(/^\w+: /, "") };
  if (db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.usuario, r.dados.usuario)).get()) {
    return { erro: "Esse nome de usuário já existe." };
  }
  db.insert(usuarios)
    .values({ nome: r.dados.nome, usuario: r.dados.usuario, senhaHash: gerarHashSenha(r.dados.senha), trocarSenha: true })
    .run();
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function redefinirSenha(id: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, z.object({ senha: z.string({ error: "Digite a senha" }).min(6, "mínimo de 6 caracteres") }));
  if (!r.valido) return { erro: r.erro.replace(/^\w+: /, "") };
  db.update(usuarios).set({ senhaHash: gerarHashSenha(r.dados.senha), trocarSenha: true }).where(eq(usuarios.id, id)).run();
  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function excluirUsuario(id: number) {
  const eu = await exigirUsuario();
  if (id === eu.id) return; // ninguém se exclui (evita ficar sem acesso)
  db.delete(usuarios).where(eq(usuarios.id, id)).run();
  revalidatePath("/configuracoes");
}
