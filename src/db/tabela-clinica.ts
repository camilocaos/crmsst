import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, inArray } from "drizzle-orm";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;
type Item = typeof schema.servicos.$inferInsert;

/** Versão da tabela padrão da clínica. Mude ao publicar uma tabela nova. */
export const VERSAO_TABELA_CLINICA = "2026-10.2"; // .2: inclui o VDRL

const exame = (categoria: string, nome: string, precoBase: number, descricao?: string): Item => ({
  categoria,
  nome,
  precoBase,
  unidade: "por exame",
  descricao: descricao ?? "Cobrado por exame realizado, por demanda.",
});

/** Tabela de valores padrão da CUIDI Saúde Ocupacional (exames sempre por demanda). */
export const TABELA_CLINICA: Item[] = [
  exame("Exames clínicos", "Avaliação clínica (emissão do ASO)", 50),
  exame("Exames clínicos", "ASO + envio do evento S-2220 ao eSocial", 75),
  exame("Exames clínicos", "Avaliação psicossocial", 60),
  exame("Exames clínicos", "Acuidade visual", 25),
  exame("Exames clínicos", "Audiometria", 35),
  exame("Exames clínicos", "Espirometria", 35),
  exame("Exames clínicos", "Eletrocardiograma", 50),
  exame("Exames clínicos", "Eletroencefalograma", 55),
  exame("Exames clínicos", "Homologação de atestado (cada atestado)", 25),
  exame("Exames clínicos", "Teste de Ishihara (daltonismo)", 45),
  exame("Exames clínicos", "Teste de Romberg (equilíbrio)", 30),

  exame("Exames de imagem", "Raio-X de tórax (padrão OIT)", 110),
  exame("Exames de imagem", "Raio-X de tórax (padrão convencional PA)", 75),
  exame("Exames de imagem", "Raio-X da coluna (cervical, torácica ou lombossacra)", 75),

  exame("Exames laboratoriais", "Hemograma", 20),
  exame("Exames laboratoriais", "Glicemia", 20),
  exame("Exames laboratoriais", "EAS / Urina tipo I", 25),
  exame("Exames laboratoriais", "Parasitológico de fezes / EPF", 35),
  exame("Exames laboratoriais", "Coprocultura / Cultura de fezes", 60),
  exame("Exames laboratoriais", "Tipagem sanguínea + fator RH", 35),
  exame("Exames laboratoriais", "Gama GT", 30),
  exame("Exames laboratoriais", "TGO / AST", 25),
  exame("Exames laboratoriais", "TGP / ALT", 25),
  exame("Exames laboratoriais", "Hepatite B (HBsAg / Anti-HBs)", 60),
  exame("Exames laboratoriais", "Micológico das unhas", 20),
  exame("Exames laboratoriais", "VDRL", 20),

  exame("Serviços ocupacionais complementares", "Laudo PCD", 70),
  exame("Serviços ocupacionais complementares", "Avaliação de retorno ao trabalho", 50),
  exame("Serviços ocupacionais complementares", "Exame toxicológico", 250),

  {
    categoria: "Combos de exames por função",
    nome: "Combo NR-35 (trabalho em altura)",
    precoBase: 320,
    unidade: "por colaborador",
    descricao:
      "Valor no Pix (crédito ou boleto: R$ 420,00), por colaborador atendido. Avaliação clínica, avaliação psicossocial, acuidade visual, audiometria, eletrocardiograma, eletroencefalograma, glicemia, hemograma, teste de Romberg e raio-X lombossacra.",
  },
  {
    categoria: "Combos de exames por função",
    nome: "Combo NR-10 (eletricidade)",
    precoBase: 335,
    unidade: "por colaborador",
    descricao:
      "Valor no Pix (crédito ou boleto: R$ 435,00), por colaborador atendido. Avaliação clínica, avaliação psicossocial, acuidade visual, audiometria, teste de Ishihara, eletrocardiograma, eletroencefalograma, glicemia, hemograma e raio-X lombossacra.",
  },
  {
    categoria: "Combos de exames por função",
    nome: "Combo manipulação de alimentos",
    precoBase: 180,
    unidade: "por colaborador",
    descricao:
      "Valor no Pix (crédito ou boleto: R$ 230,00), por colaborador atendido. Avaliação clínica, VDRL, parasitológico de fezes (EPF), micológico de unhas, hemograma, EAS (urina tipo I) e coprocultura de fezes.",
  },
];

/** Itens genéricos de exame do catálogo antigo, substituídos pela tabela da clínica. */
const GENERICOS_ANTIGOS = ["ASO - Exame clínico ocupacional", "Exames complementares"];

/**
 * Aplica a tabela da clínica uma vez por computador: adiciona os exames que ainda não
 * existem (não altera preços já editados) e desativa os genéricos antigos.
 */
export function aplicarTabelaClinica(db: Db) {
  const marcador = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, "tabela_clinica_versao")).get();
  if (marcador?.valor === VERSAO_TABELA_CLINICA) return;

  db.transaction((tx) => {
    const existentes = new Set(tx.select({ nome: schema.servicos.nome }).from(schema.servicos).all().map((s) => s.nome));
    const novos = TABELA_CLINICA.filter((i) => !existentes.has(i.nome));
    if (novos.length) tx.insert(schema.servicos).values(novos).run();
    tx.update(schema.servicos).set({ ativo: false }).where(inArray(schema.servicos.nome, GENERICOS_ANTIGOS)).run();
    tx.insert(schema.configuracoes)
      .values({ chave: "tabela_clinica_versao", valor: VERSAO_TABELA_CLINICA })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: VERSAO_TABELA_CLINICA } })
      .run();
  });
}
