/**
 * Preenche o banco com dados fictícios para demonstração.
 * Uso: npm run demo   (apaga e recria data/crm-demo.db)
 * Depois rode: npm run dev:demo
 */
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import * as s from "../src/db/schema";
import { seedSeVazio } from "../src/db/seed";

const arquivo = path.join(process.cwd(), "data", "crm-demo.db");
fs.mkdirSync(path.dirname(arquivo), { recursive: true });
for (const ext of ["", "-wal", "-shm"]) fs.rmSync(arquivo + ext, { force: true });

const sqlite = new Database(arquivo);
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema: s });
migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
seedSeVazio(db);

const dia = (delta: number) => {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
};

const EMPRESAS = [
  { razaoSocial: "Construtora Horizonte Ltda", nomeFantasia: "Horizonte Engenharia", segmento: "Construção civil", grauRisco: 3, numFuncionarios: 120, cidade: "Brasília", uf: "DF", origem: "Indicação", status: "cliente" as const },
  { razaoSocial: "Metalúrgica Planalto S.A.", nomeFantasia: "Metal Planalto", segmento: "Indústria", grauRisco: 3, numFuncionarios: 240, cidade: "Anápolis", uf: "GO", origem: "Prospecção ativa", status: "lead" as const },
  { razaoSocial: "Supermercados Bom Preço Ltda", nomeFantasia: "Bom Preço", segmento: "Comércio", grauRisco: 2, numFuncionarios: 65, cidade: "Taguatinga", uf: "DF", origem: "Instagram", status: "lead" as const },
  { razaoSocial: "Clínica Vida e Saúde Ltda", nomeFantasia: "Clínica Vida", segmento: "Saúde", grauRisco: 3, numFuncionarios: 30, cidade: "Brasília", uf: "DF", origem: "Site", status: "cliente" as const },
  { razaoSocial: "Transportadora Rota Certa Ltda", nomeFantasia: "Rota Certa", segmento: "Transporte e logística", grauRisco: 3, numFuncionarios: 80, cidade: "Goiânia", uf: "GO", origem: "Google", status: "lead" as const },
  { razaoSocial: "Padaria Pão Dourado ME", nomeFantasia: "Pão Dourado", segmento: "Alimentação", grauRisco: 2, numFuncionarios: 14, cidade: "Águas Claras", uf: "DF", origem: "WhatsApp", status: "lead" as const },
];

const ids = EMPRESAS.map((e) => db.insert(s.empresas).values(e).returning({ id: s.empresas.id }).get().id);

const CONTATOS = ["Ana Souza", "Carlos Lima", "Juliana Rocha", "Marcos Pereira", "Fernanda Alves", "Roberto Dias"];
const CARGOS = ["Gerente de RH", "Técnico de Segurança", "Sócia-administradora", "Diretor de Operações", "Analista de DP", "Proprietário"];
ids.forEach((empresaId, i) =>
  db.insert(s.contatos).values({ empresaId, nome: CONTATOS[i], cargo: CARGOS[i], telefone: `(61) 9${8000 + i}-12${10 + i}`, principal: true }).run(),
);

const OPS: (typeof s.oportunidades.$inferInsert)[] = [
  { empresaId: ids[0], titulo: "Renovação PGR + PCMSO", etapa: "ganho", valor: 9800, probabilidade: 100, fechadoEm: dia(-5) },
  { empresaId: ids[0], titulo: "Treinamento NR-35 (2 turmas)", etapa: "ganho", valor: 4320, probabilidade: 100, fechadoEm: dia(-40) },
  { empresaId: ids[3], titulo: "PGR + PCMSO + LTCAT", etapa: "ganho", valor: 5200, probabilidade: 100, fechadoEm: dia(-70) },
  { empresaId: ids[3], titulo: "Assessoria mensal", etapa: "ganho", valor: 9600, probabilidade: 100, fechadoEm: dia(-110) },
  { empresaId: ids[1], titulo: "Pacote completo SST + eSocial", etapa: "negociacao", valor: 28500, probabilidade: 80, previsaoFechamento: dia(6) },
  { empresaId: ids[2], titulo: "PGR + PCMSO + ASOs", etapa: "proposta", valor: 6240, probabilidade: 60, previsaoFechamento: dia(12) },
  { empresaId: ids[4], titulo: "Laudo de insalubridade + LTCAT", etapa: "visita_tecnica", valor: 3300, probabilidade: 40, previsaoFechamento: dia(20) },
  { empresaId: ids[5], titulo: "PGR simplificado", etapa: "qualificacao", valor: 1500, probabilidade: 25 },
  { empresaId: ids[4], titulo: "Treinamento NR-06 e NR-23", etapa: "prospeccao", valor: 1900, probabilidade: 10 },
  { empresaId: ids[2], titulo: "Brigada de incêndio", etapa: "perdido", valor: 1500, probabilidade: 0, fechadoEm: dia(-3), motivoPerda: "Fechou com concorrente" },
];
const opIds = OPS.map((o) => db.insert(s.oportunidades).values(o).returning({ id: s.oportunidades.id }).get().id);

db.insert(s.tarefas)
  .values([
    { titulo: "Ligar para negociar desconto do pacote", tipo: "ligacao", prioridade: "alta", vencimento: dia(0), empresaId: ids[1], oportunidadeId: opIds[4] },
    { titulo: "Cobrar retorno da proposta", tipo: "whatsapp", prioridade: "media", vencimento: dia(-1), empresaId: ids[2] },
    { titulo: "Visita técnica para levantamento de riscos", tipo: "visita", prioridade: "alta", vencimento: dia(3), empresaId: ids[4] },
    { titulo: "Enviar apresentação da empresa", tipo: "email", prioridade: "baixa", vencimento: dia(5), empresaId: ids[5] },
    { titulo: "Agendar periódicos de dezembro", tipo: "outro", prioridade: "media", vencimento: dia(10), empresaId: ids[0] },
  ])
  .run();

db.insert(s.notas)
  .values([
    { empresaId: ids[1], texto: "Reunião com o diretor: querem centralizar SST e eSocial num único fornecedor." },
    { empresaId: ids[2], texto: "RH pediu proposta com ASO para todos os 65 funcionários." },
  ])
  .run();

const proposta = db
  .insert(s.propostas)
  .values({ empresaId: ids[2], oportunidadeId: opIds[5], status: "enviada", validade: dia(10), desconto: 0, condicoesPagamento: "Pagamento em até 30 dias após emissão da nota fiscal." })
  .returning({ id: s.propostas.id })
  .get();
db.insert(s.propostaItens)
  .values([
    { propostaId: proposta.id, servicoId: 1, descricao: "PGR - Programa de Gerenciamento de Riscos (por empresa)", quantidade: 1, valorUnitario: 1200 },
    { propostaId: proposta.id, servicoId: 2, descricao: "PCMSO - Programa de Controle Médico (por empresa)", quantidade: 1, valorUnitario: 900 },
    {
      propostaId: proposta.id,
      servicoId: db.select({ id: s.servicos.id }).from(s.servicos).where(eq(s.servicos.nome, "Avaliação clínica (emissão do ASO)")).get()?.id ?? null,
      descricao: "Avaliação clínica (emissão do ASO) (por exame)",
      quantidade: 69,
      valorUnitario: 50,
    },
  ])
  .run();

sqlite.close();
console.log(`Banco de demonstração criado em ${arquivo}`);
