"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { lerForm, textoObrigatorio, type EstadoForm } from "@/lib/form";
import { conferirSenha, gerarHashSenha } from "@/lib/senha";
import { criarSessao, encerrarOutrasSessoes, encerrarSessao, exigirUsuario } from "@/lib/sessao";

export async function entrar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const r = lerForm(formData, z.object({ usuario: textoObrigatorio("Usuário"), senha: textoObrigatorio("Senha") }));
  if (!r.valido) return { erro: "Preencha usuário e senha." };

  const u = db.select().from(usuarios).where(eq(usuarios.usuario, r.dados.usuario.toLowerCase())).get();
  if (!u || !conferirSenha(r.dados.senha, u.senhaHash)) {
    await new Promise((ok) => setTimeout(ok, 600)); // freia tentativas em sequência
    return { erro: "Usuário ou senha incorretos." };
  }
  await criarSessao(u.id);
  redirect(u.trocarSenha ? "/trocar-senha" : "/");
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

// (arquivos "use server" só podem exportar funções async)
const senhaNova = z
  .string({ error: "Digite a nova senha" })
  .min(6, "A nova senha precisa ter pelo menos 6 caracteres");

/** Troca a senha do usuário logado (confere a atual). */
export async function trocarSenha(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const usuario = await exigirUsuario({ permitirTrocaPendente: true });
  const r = lerForm(
    formData,
    z.object({ senhaAtual: textoObrigatorio("Senha atual"), novaSenha: senhaNova, confirmacao: z.string().nullish() }),
  );
  if (!r.valido) return { erro: r.erro.replace(/^\w+: /, "") };
  const { senhaAtual, novaSenha, confirmacao } = r.dados;
  if (novaSenha !== confirmacao) return { erro: "A confirmação não bate com a nova senha." };

  const u = db.select().from(usuarios).where(eq(usuarios.id, usuario.id)).get()!;
  if (!conferirSenha(senhaAtual, u.senhaHash)) return { erro: "A senha atual está incorreta." };
  if (conferirSenha(novaSenha, u.senhaHash)) return { erro: "A nova senha precisa ser diferente da atual." };

  db.update(usuarios).set({ senhaHash: gerarHashSenha(novaSenha), trocarSenha: false }).where(eq(usuarios.id, u.id)).run();
  await encerrarOutrasSessoes(u.id);
  return { ok: true };
}

/** Versão usada na tela de primeiro acesso: troca e já entra no CRM. */
export async function trocarSenhaPrimeiroAcesso(estado: EstadoForm, formData: FormData): Promise<EstadoForm> {
  const resultado = await trocarSenha(estado, formData);
  if (resultado?.ok) redirect("/");
  return resultado;
}
