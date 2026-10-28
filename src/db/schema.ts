import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const criadoEm = () =>
  text("criado_em").notNull().default(sql`(datetime('now', 'localtime'))`);

/** Empresas atendidas (leads e clientes). */
export const empresas = sqliteTable("empresas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  razaoSocial: text("razao_social").notNull(),
  nomeFantasia: text("nome_fantasia"),
  cnpj: text("cnpj"),
  segmento: text("segmento"),
  cnae: text("cnae"),
  /** Grau de risco da NR-04 (1 a 4). */
  grauRisco: integer("grau_risco"),
  numFuncionarios: integer("num_funcionarios"),
  telefone: text("telefone"),
  email: text("email"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  uf: text("uf"),
  origem: text("origem"),
  status: text("status", { enum: ["lead", "cliente", "inativo"] })
    .notNull()
    .default("lead"),
  observacoes: text("observacoes"),
  criadoEm: criadoEm(),
});

export const contatos = sqliteTable("contatos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  empresaId: integer("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  cargo: text("cargo"),
  email: text("email"),
  telefone: text("telefone"),
  principal: integer("principal", { mode: "boolean" }).notNull().default(false),
  criadoEm: criadoEm(),
});

/** Histórico livre de interações com a empresa. */
export const notas = sqliteTable("notas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  empresaId: integer("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  texto: text("texto").notNull(),
  criadoEm: criadoEm(),
});

/** Catálogo de serviços de SST vendidos. */
export const servicos = sqliteTable("servicos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(),
  descricao: text("descricao"),
  precoBase: real("preco_base").notNull().default(0),
  unidade: text("unidade").notNull().default("por empresa"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
});

export const oportunidades = sqliteTable("oportunidades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  empresaId: integer("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  contatoId: integer("contato_id").references(() => contatos.id, {
    onDelete: "set null",
  }),
  etapa: text("etapa").notNull().default("prospeccao"),
  valor: real("valor").notNull().default(0),
  probabilidade: integer("probabilidade").notNull().default(10),
  previsaoFechamento: text("previsao_fechamento"),
  motivoPerda: text("motivo_perda"),
  observacoes: text("observacoes"),
  /** Data em que foi para "ganho" ou "perdido". */
  fechadoEm: text("fechado_em"),
  criadoEm: criadoEm(),
});

export const tarefas = sqliteTable("tarefas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull().default("ligacao"),
  prioridade: text("prioridade", { enum: ["baixa", "media", "alta"] })
    .notNull()
    .default("media"),
  vencimento: text("vencimento"),
  concluida: integer("concluida", { mode: "boolean" }).notNull().default(false),
  descricao: text("descricao"),
  empresaId: integer("empresa_id").references(() => empresas.id, {
    onDelete: "cascade",
  }),
  oportunidadeId: integer("oportunidade_id").references(() => oportunidades.id, {
    onDelete: "set null",
  }),
  criadoEm: criadoEm(),
});

export const propostas = sqliteTable("propostas", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  empresaId: integer("empresa_id")
    .notNull()
    .references(() => empresas.id, { onDelete: "cascade" }),
  oportunidadeId: integer("oportunidade_id").references(() => oportunidades.id, {
    onDelete: "set null",
  }),
  status: text("status", {
    enum: ["rascunho", "enviada", "aceita", "recusada"],
  })
    .notNull()
    .default("rascunho"),
  validade: text("validade"),
  /** Desconto em percentual (0 a 100). */
  desconto: real("desconto").notNull().default(0),
  condicoesPagamento: text("condicoes_pagamento"),
  observacoes: text("observacoes"),
  criadoEm: criadoEm(),
});

export const propostaItens = sqliteTable("proposta_itens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propostaId: integer("proposta_id")
    .notNull()
    .references(() => propostas.id, { onDelete: "cascade" }),
  servicoId: integer("servico_id").references(() => servicos.id, {
    onDelete: "set null",
  }),
  descricao: text("descricao").notNull(),
  quantidade: real("quantidade").notNull().default(1),
  valorUnitario: real("valor_unitario").notNull().default(0),
});

/** Configurações chave/valor (nome da empresa, meta mensal...). */
export const configuracoes = sqliteTable("configuracoes", {
  chave: text("chave").primaryKey(),
  valor: text("valor").notNull(),
});

export type Empresa = typeof empresas.$inferSelect;
export type Contato = typeof contatos.$inferSelect;
export type Nota = typeof notas.$inferSelect;
export type Servico = typeof servicos.$inferSelect;
export type Oportunidade = typeof oportunidades.$inferSelect;
export type Tarefa = typeof tarefas.$inferSelect;
export type Proposta = typeof propostas.$inferSelect;
export type PropostaItem = typeof propostaItens.$inferSelect;
