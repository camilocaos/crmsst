import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { and, count, eq } from "drizzle-orm";
import * as schema from "./schema";
import { conferirSenha } from "../lib/senha";

type Db = BetterSQLite3Database<typeof schema>;

/** Catálogo inicial de serviços de SST (preços são só referência, ajuste em Serviços). */
const SERVICOS_PADRAO: (typeof schema.servicos.$inferInsert)[] = [
  { nome: "PGR - Programa de Gerenciamento de Riscos", categoria: "Programas e laudos", precoBase: 1200, unidade: "por empresa", descricao: "Inventário de riscos e plano de ação (NR-01)." },
  { nome: "PCMSO - Programa de Controle Médico", categoria: "Programas e laudos", precoBase: 900, unidade: "por empresa", descricao: "Programa médico ocupacional (NR-07)." },
  { nome: "LTCAT - Laudo Técnico das Condições Ambientais", categoria: "Programas e laudos", precoBase: 1500, unidade: "por empresa", descricao: "Laudo para fins previdenciários." },
  { nome: "Laudo de Insalubridade e Periculosidade", categoria: "Programas e laudos", precoBase: 1800, unidade: "por empresa", descricao: "Avaliação conforme NR-15 e NR-16." },
  { nome: "AET - Análise Ergonômica do Trabalho", categoria: "Programas e laudos", precoBase: 1600, unidade: "por empresa", descricao: "Avaliação ergonômica (NR-17)." },
  { nome: "ASO - Exame clínico ocupacional", categoria: "Medicina do trabalho", precoBase: 60, unidade: "por funcionário", descricao: "Admissional, periódico, demissional, retorno e mudança de função." },
  { nome: "Exames complementares", categoria: "Medicina do trabalho", precoBase: 35, unidade: "por funcionário", descricao: "Audiometria, acuidade visual, espirometria etc." },
  { nome: "Envio de eventos SST ao eSocial (S-2210, S-2220, S-2240)", categoria: "eSocial", precoBase: 15, unidade: "por funcionário/mês", descricao: "Gestão e envio mensal dos eventos de SST." },
  { nome: "PPP - Perfil Profissiográfico Previdenciário", categoria: "eSocial", precoBase: 80, unidade: "por funcionário", descricao: "Emissão de PPP." },
  { nome: "Treinamento NR-35 - Trabalho em altura", categoria: "Treinamentos", precoBase: 180, unidade: "por participante", descricao: "Carga horária de 8h." },
  { nome: "Treinamento NR-10 - Segurança em eletricidade", categoria: "Treinamentos", precoBase: 350, unidade: "por participante", descricao: "Básico de 40h ou reciclagem." },
  { nome: "Treinamento NR-05 - CIPA", categoria: "Treinamentos", precoBase: 1200, unidade: "por turma", descricao: "Formação de cipeiros." },
  { nome: "Treinamento NR-06 - Uso de EPI", categoria: "Treinamentos", precoBase: 400, unidade: "por turma", descricao: "Uso, guarda e conservação de EPI." },
  { nome: "Treinamento NR-23 - Brigada de incêndio", categoria: "Treinamentos", precoBase: 1500, unidade: "por turma", descricao: "Formação de brigadistas." },
  { nome: "Assessoria mensal em SST", categoria: "Consultoria", precoBase: 800, unidade: "por mês", descricao: "Acompanhamento técnico contínuo." },
];

const CONFIG_PADRAO = [
  { chave: "nome_empresa", valor: "Minha Empresa de SST" },
  { chave: "meta_mensal", valor: "30000" },
  { chave: "validade_proposta_dias", valor: "15" },
  { chave: "condicoes_pagamento", valor: "Pagamento em até 30 dias após emissão da nota fiscal." },
];

export function seedSeVazio(db: Db) {
  const [{ total }] = db.select({ total: count() }).from(schema.servicos).all();
  if (total === 0) {
    db.insert(schema.servicos).values(SERVICOS_PADRAO).run();
  }
  db.insert(schema.configuracoes).values(CONFIG_PADRAO).onConflictDoNothing().run();

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
