import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, eq } from "drizzle-orm";
import * as schema from "./schema";
import { conferirSenha } from "../lib/senha";
import { aplicarTabelaClinica } from "./tabela-clinica";
import { aplicarCatalogoSst } from "./catalogo-sst";

type Db = BetterSQLite3Database<typeof schema>;

const CONFIG_PADRAO = [
  { chave: "nome_empresa", valor: "Grupo CUIDI" },
  { chave: "meta_mensal", valor: "30000" },
  { chave: "validade_proposta_dias", valor: "15" },
  { chave: "condicoes_pagamento", valor: "Pix, em parcela única na aprovação da proposta." },
];

/** Roda a cada abertura do app: completa o banco sem mexer no que a pessoa já editou. */
export function seedSeVazio(db: Db) {
  db.insert(schema.configuracoes).values(CONFIG_PADRAO).onConflictDoNothing().run();
  aplicarCatalogoSst(db); // serviços de Segurança do Trabalho (uma vez por versão do catálogo)
  aplicarTabelaClinica(db); // exames da CUIDI Saúde Ocupacional (uma vez por versão da tabela)
  removerAcessoPadraoAntigo(db);
}

/**
 * Versões até a 1.2.0 criavam "camilocaos" com a senha "admin" (pública no código).
 * Se esse acesso nunca teve a senha trocada, ele é apagado: o app então mostra a tela
 * de primeiro acesso, onde a pessoa cria o próprio administrador.
 */
function removerAcessoPadraoAntigo(db: Db) {
  const padrao = db
    .select()
    .from(schema.usuarios)
    .where(and(eq(schema.usuarios.usuario, "camilocaos"), eq(schema.usuarios.trocarSenha, true)))
    .get();
  if (padrao && conferirSenha("admin", padrao.senhaHash)) {
    db.delete(schema.usuarios).where(eq(schema.usuarios.id, padrao.id)).run();
  }
}
