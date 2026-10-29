import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

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
},
  // Uma empresa só: o mesmo CNPJ não pode ter dois cadastros.
  (t) => [uniqueIndex("empresas_cnpj_unico").on(t.cnpj).where(sql`cnpj is not null`)],
);

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
  /** Custo cobrado pelo fornecedor (medições). Com custo, o preço é custo + margem das Configurações. */
  custo: real("custo"),
  unidade: text("unidade").notNull().default("por empresa"),
  ativo: integer("ativo", { mode: "boolean" }).notNull().default(true),
  /** Unidade da CUIDI que presta o serviço: define o contrato e o timbrado. */
  area: text("area", { enum: ["seguranca", "saude"] }).notNull().default("seguranca"),
  /** "por_demanda": cobrado por exame realizado, nunca entra no total da proposta. */
  cobranca: text("cobranca", { enum: ["fixo", "por_demanda"] }).notNull().default("fixo"),
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
  /** Prazo de entrega dos documentos (texto livre, ex.: "até 15 dias úteis após..."). */
  prazoEntrega: text("prazo_entrega"),
  /** Mostra a tabela de referência das avaliações quantitativas não contratadas. */
  mostrarMedicoes: integer("mostrar_medicoes", { mode: "boolean" }).notNull().default(true),
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
  area: text("area", { enum: ["seguranca", "saude"] }).notNull().default("seguranca"),
  cobranca: text("cobranca", { enum: ["fixo", "por_demanda"] }).notNull().default("fixo"),
  /** Elaboração, Renovação ou Atualização (programas e laudos). */
  natureza: text("natureza"),
  /** Período contratado quando limitado (ex.: eSocial "outubro e novembro de 2026"). */
  periodo: text("periodo"),
  /** O que é entregue: aparece no escopo da proposta e no objeto do contrato. */
  detalhe: text("detalhe"),
  /** Incluso sem custo (ex.: eSocial no período inicial). Nunca usado para exames. */
  incluso: integer("incluso", { mode: "boolean" }).notNull().default(false),
  /** Opcional, fora do total (ex.: AET dependendo do resultado da AEP). */
  opcional: integer("opcional", { mode: "boolean" }).notNull().default(false),
});

/** Contrato gerado a partir de uma proposta aceita: um por unidade (Saúde e/ou Segurança). */
export const contratos = sqliteTable("contratos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  propostaId: integer("proposta_id")
    .notNull()
    .references(() => propostas.id, { onDelete: "cascade" }),
  area: text("area", { enum: ["seguranca", "saude"] }).notNull(),
  /** Pontual (serviço específico) ou mensalista (escopo continuado). */
  tipo: text("tipo", { enum: ["pontual", "mensalista"] }).notNull().default("pontual"),
  /** Contrato feito depois de o serviço já ter sido executado. */
  formalizacaoPosterior: integer("formalizacao_posterior", { mode: "boolean" }).notNull().default(false),
  dataExecucao: text("data_execucao"),
  valorMensal: real("valor_mensal"),
  vigencia: text("vigencia"),
  formaPagamento: text("forma_pagamento"),
  vencimento: text("vencimento"),
  /** Pagamentos já feitos (um por linha), para abater e registrar no contrato. */
  pagamentosRealizados: text("pagamentos_realizados"),
  enderecoCliente: text("endereco_cliente"),
  representante: text("representante"),
  testemunha1: text("testemunha1"),
  testemunha2: text("testemunha2"),
  dataAssinatura: text("data_assinatura"),
  status: text("status", { enum: ["rascunho", "enviado", "assinado", "cancelado"] }).notNull().default("rascunho"),
  observacoes: text("observacoes"),
  criadoEm: criadoEm(),
});

export const usuarios = sqliteTable("usuarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  usuario: text("usuario").notNull().unique(),
  nome: text("nome").notNull(),
  /** Formato "scrypt:<salt hex>:<hash hex>". */
  senhaHash: text("senha_hash").notNull(),
  /** Obriga a trocar a senha no próximo login (senha padrão ou redefinida). */
  trocarSenha: integer("trocar_senha", { mode: "boolean" }).notNull().default(false),
  criadoEm: criadoEm(),
});

export const sessoes = sqliteTable("sessoes", {
  /** SHA-256 do token guardado no cookie (o token em si nunca vai pro banco). */
  id: text("id").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  expiraEm: text("expira_em").notNull(),
  criadoEm: criadoEm(),
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
export type Usuario = typeof usuarios.$inferSelect;
export type Contrato = typeof contratos.$inferSelect;
export type Area = "seguranca" | "saude";
