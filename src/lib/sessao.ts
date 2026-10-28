import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { sessoes, usuarios } from "@/db/schema";

export const COOKIE_SESSAO = "crm_sessao";
const DURACAO_DIAS = 30;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function criarSessao(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + DURACAO_DIAS * 24 * 60 * 60 * 1000);
  // aproveita para limpar sessões vencidas
  db.delete(sessoes).where(lt(sessoes.expiraEm, new Date().toISOString())).run();
  db.insert(sessoes).values({ id: hashToken(token), usuarioId, expiraEm: expira.toISOString() }).run();

  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, { httpOnly: true, sameSite: "lax", path: "/", expires: expira });
}

export async function encerrarSessao() {
  const jar = await cookies();
  const token = jar.get(COOKIE_SESSAO)?.value;
  if (token) db.delete(sessoes).where(eq(sessoes.id, hashToken(token))).run();
  jar.delete(COOKIE_SESSAO);
}

export type UsuarioLogado = { id: number; usuario: string; nome: string; trocarSenha: boolean };

/** Usuário da sessão atual (ou null). Cacheado por requisição. */
export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  if (!token) return null;
  const linha = db
    .select({ id: usuarios.id, usuario: usuarios.usuario, nome: usuarios.nome, trocarSenha: usuarios.trocarSenha })
    .from(sessoes)
    .innerJoin(usuarios, eq(usuarios.id, sessoes.usuarioId))
    .where(and(eq(sessoes.id, hashToken(token)), gt(sessoes.expiraEm, new Date().toISOString())))
    .get();
  return linha ?? null;
});

/**
 * Exige login. Use no topo de páginas e de toda Server Action.
 * Se a senha precisa ser trocada, manda para /trocar-senha.
 */
export async function exigirUsuario({ permitirTrocaPendente = false } = {}) {
  const usuario = await usuarioAtual();
  if (!usuario) redirect("/login");
  if (usuario.trocarSenha && !permitirTrocaPendente) redirect("/trocar-senha");
  return usuario;
}

/** Ainda não existe nenhum usuário neste computador (primeiro acesso). */
export function semUsuarios() {
  return !db.select({ id: usuarios.id }).from(usuarios).limit(1).get();
}

/** Derruba as outras sessões do usuário (depois de trocar a senha, por exemplo). */
export async function encerrarOutrasSessoes(usuarioId: number) {
  const token = (await cookies()).get(COOKIE_SESSAO)?.value;
  const atual = token ? hashToken(token) : "";
  for (const s of db.select({ id: sessoes.id }).from(sessoes).where(eq(sessoes.usuarioId, usuarioId)).all()) {
    if (s.id !== atual) db.delete(sessoes).where(eq(sessoes.id, s.id)).run();
  }
}
