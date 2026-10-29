import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, isNotNull, sql } from "drizzle-orm";
import * as schema from "./schema";
import { CATEGORIA_MEDICOES, MARGEM_MEDICOES_PADRAO, NOME_DESLOCAMENTO } from "../lib/propostas";

export { CATEGORIA_MEDICOES };

type Db = BetterSQLite3Database<typeof schema>;
type Item = typeof schema.servicos.$inferInsert;

/** Mude ao alterar o catálogo padrão de Segurança do Trabalho. */
export const VERSAO_CATALOGO_SST = "2026-10.2";

const sst = (categoria: string, nome: string, precoBase: number, unidade: string, descricao: string): Item => ({
  categoria,
  nome,
  precoBase,
  unidade,
  descricao,
  area: "seguranca",
  cobranca: "fixo",
});

/** Medição do fornecedor: guarda o custo; o preço de venda é custo + margem (Configurações). */
const medicao = (nome: string, custo: number, descricao: string): Item => ({
  ...sst(CATEGORIA_MEDICOES, nome, custo + MARGEM_MEDICOES_PADRAO, "por avaliação", descricao),
  custo,
});

/**
 * Catálogo padrão de Segurança do Trabalho. A descrição é o texto "o que é entregue"
 * que vai para o escopo da proposta e para o objeto do contrato.
 * Preços de PGR, PCMSO, LIP, NR-05, certificados e medições vêm de documentos reais da CUIDI;
 * os demais são referência e devem ser revisados em Serviços.
 */
export const CATALOGO_SST: Item[] = [
  sst("Programas e laudos", "PGR - Programa de Gerenciamento de Riscos", 750, "por empresa", "Identificação dos perigos e avaliação dos riscos ocupacionais de cada função, com inventário de riscos e plano de ação, conforme a NR-01."),
  sst("Programas e laudos", "PCMSO - Programa de Controle Médico de Saúde Ocupacional", 750, "por empresa", "Definição do protocolo de exames por função e da periodicidade dos acompanhamentos médicos, conforme a NR-07."),
  sst("Programas e laudos", "LIP - Laudo de Insalubridade e Periculosidade", 1000, "por empresa", "Avaliação técnica das condições de insalubridade e periculosidade das atividades (NR-15 e NR-16). O LIP não substitui o LTCAT."),
  sst("Programas e laudos", "LTCAT - Laudo Técnico das Condições Ambientais do Trabalho", 1500, "por empresa", "Laudo de finalidade previdenciária, que avalia a exposição a agentes nocivos para fins de aposentadoria especial."),
  sst("Programas e laudos", "AEP - Avaliação Ergonômica Preliminar", 800, "por empresa", "Avaliação preliminar das condições ergonômicas das atividades, conforme a NR-17. Indica se é necessária uma AET."),
  sst("Programas e laudos", "AET - Análise Ergonômica do Trabalho", 1600, "por empresa", "Análise aprofundada das condições ergonômicas, realizada quando a avaliação preliminar indicar necessidade (NR-17)."),
  sst("eSocial", "Envio dos eventos de SST ao eSocial (S-2210, S-2220, S-2240)", 15, "por funcionário/mês", "Transmissão dos eventos de SST ao eSocial: S-2210 (comunicação de acidente de trabalho), S-2220 (monitoramento da saúde do trabalhador) e S-2240 (condições ambientais do trabalho)."),
  sst("eSocial", "PPP - Perfil Profissiográfico Previdenciário", 80, "por funcionário", "Emissão do PPP dos colaboradores indicados."),
  sst("Treinamentos", "NR-05 - Constituição da CIPA ou nomeação de representante", 165, "por participante", "Constituição da CIPA ou nomeação do representante da NR-05, conforme o enquadramento, com treinamento e certificado."),
  sst("Treinamentos", "Certificado de treinamento de NR", 100, "por certificado", "Emissão de certificado de treinamento (NR-06, NR-12, NR-18, NR-35 ou outra), condicionada à realização e comprovação do treinamento."),
  sst("Treinamentos", "Treinamento NR-35 - Trabalho em altura", 180, "por participante", "Treinamento de trabalho em altura com carga horária conforme a NR-35."),
  sst("Treinamentos", "Treinamento NR-10 - Segurança em eletricidade", 350, "por participante", "Treinamento básico ou reciclagem de segurança em instalações e serviços em eletricidade."),
  sst("Treinamentos", "Treinamento NR-06 - Uso de EPI", 400, "por turma", "Orientação sobre uso, guarda e conservação dos equipamentos de proteção individual."),
  sst("Treinamentos", "Treinamento NR-23 - Brigada de incêndio", 1500, "por turma", "Formação de brigadistas para prevenção e combate a princípio de incêndio."),
  sst("Consultoria", "Assessoria mensal em SST", 800, "por mês", "Acompanhamento técnico contínuo em Saúde e Segurança do Trabalho, conforme o escopo contratado."),
  // Medições: custo da tabela do fornecedor (BSB MED)
  medicao("Medição de álcool etílico / etanol (CAS 64-17-5)", 200, "Avaliação quantitativa de exposição a álcool etílico (etanol)."),
  medicao("Medição de álcool metílico / metanol (CAS 67-56-1)", 600, "Avaliação quantitativa de exposição a álcool metílico (metanol)."),
  medicao("Medição de BTXE (benzeno, tolueno, xileno e etilbenzeno)", 500, "Avaliação quantitativa de exposição a benzeno, tolueno, xileno e etilbenzeno."),
  medicao("Medição de calor (IBUTG)", 400, "Avaliação quantitativa de exposição ao calor pelo IBUTG (NR-15, Anexo 3)."),
  medicao("Medição de dióxido de carbono - CO₂ (CAS 124-38-9)", 400, "Avaliação quantitativa de exposição a dióxido de carbono."),
  medicao("Medição de fumos metálicos", 450, "Avaliação quantitativa de exposição a fumos metálicos."),
  medicao("Medição de MEK - metiletilcetona ou butanona (CAS 78-93-3)", 500, "Avaliação quantitativa de exposição a metiletilcetona (butanona)."),
  medicao("Medição de monóxido de carbono - CO (CAS 630-08-0)", 300, "Avaliação quantitativa de exposição a monóxido de carbono."),
  medicao("Medição de óleos e graxas (O.G.)", 350, "Avaliação quantitativa de exposição a óleos e graxas."),
  medicao("Medição de ozônio (CAS 10028-15-6)", 300, "Avaliação quantitativa de exposição a ozônio."),
  medicao("Medição de poeira com sílica", 500, "Avaliação quantitativa de exposição a poeira contendo sílica."),
  medicao("Medição de poeira respirável (PNOS)", 350, "Avaliação quantitativa de poeira respirável (partículas não especificadas de outra forma)."),
  medicao("Medição de vibração de corpo inteiro (VCI)", 500, "Avaliação quantitativa de vibração de corpo inteiro (NR-15, Anexo 8)."),
  medicao("Medição de vibração de membros superiores (VMB)", 500, "Avaliação quantitativa de vibração de mãos e braços (NR-15, Anexo 8)."),
  medicao("Medição de gás cloro (CAS 7782-50-5)", 250, "Avaliação quantitativa de exposição a gás cloro."),
  medicao("Dosimetria de ruído", 300, "Avaliação quantitativa de exposição ao ruído por dosimetria (NR-15, Anexo 1)."),
  sst(CATEGORIA_MEDICOES, NOME_DESLOCAMENTO, 100, "por visita", "Deslocamento da equipe técnica até o local das medições."),
];

/** Nomes antigos do catálogo inicial que viraram os nomes acima. */
const RENOMEAR: Record<string, string> = {
  "PCMSO - Programa de Controle Médico": "PCMSO - Programa de Controle Médico de Saúde Ocupacional",
  "LTCAT - Laudo Técnico das Condições Ambientais": "LTCAT - Laudo Técnico das Condições Ambientais do Trabalho",
  "Laudo de Insalubridade e Periculosidade": "LIP - Laudo de Insalubridade e Periculosidade",
  "Treinamento NR-05 - CIPA": "NR-05 - Constituição da CIPA ou nomeação de representante",
  "Envio de eventos SST ao eSocial (S-2210, S-2220, S-2240)": "Envio dos eventos de SST ao eSocial (S-2210, S-2220, S-2240)",
  "Ruído": "Dosimetria de ruído",
  "Poeira respirável": "Medição de poeira respirável (PNOS)",
  "Vibração de corpo inteiro": "Medição de vibração de corpo inteiro (VCI)",
  "Calor": "Medição de calor (IBUTG)",
};

/**
 * Preço e unidade do catálogo inicial. Se o serviço ainda está exatamente assim,
 * ninguém mexeu nele: passa para o preço real da CUIDI.
 */
const PRECOS_ANTIGOS: Record<string, { precoBase: number; unidade: string }> = {
  "PGR - Programa de Gerenciamento de Riscos": { precoBase: 1200, unidade: "por empresa" },
  "PCMSO - Programa de Controle Médico de Saúde Ocupacional": { precoBase: 900, unidade: "por empresa" },
  "LIP - Laudo de Insalubridade e Periculosidade": { precoBase: 1800, unidade: "por empresa" },
  "NR-05 - Constituição da CIPA ou nomeação de representante": { precoBase: 1200, unidade: "por turma" },
};

/** Descrições genéricas do catálogo inicial (podem ser trocadas pelas novas; textos editados não). */
const DESCRICOES_ANTIGAS = new Set([
  "Inventário de riscos e plano de ação (NR-01).",
  "Programa médico ocupacional (NR-07).",
  "Laudo para fins previdenciários.",
  "Avaliação conforme NR-15 e NR-16.",
  "Avaliação ergonômica (NR-17).",
  "Gestão e envio mensal dos eventos de SST.",
  "Emissão de PPP.",
  "Carga horária de 8h.",
  "Básico de 40h ou reciclagem.",
  "Formação de cipeiros.",
  "Uso, guarda e conservação de EPI.",
  "Formação de brigadistas.",
  "Acompanhamento técnico contínuo.",
  "Avaliação quantitativa de ruído.",
  "Avaliação quantitativa de poeira respirável.",
  "Avaliação quantitativa de vibração de corpo inteiro.",
  "Avaliação quantitativa de calor.",
]);

/** Lê a margem das medições salva em Configurações. */
export function lerMargemMedicoes(db: Db) {
  const c = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, "margem_medicoes")).get();
  const v = Number(c?.valor);
  return c && Number.isFinite(v) ? v : MARGEM_MEDICOES_PADRAO;
}

/** Recalcula o preço de venda de tudo que tem custo de fornecedor: custo + margem. */
export function aplicarMargemMedicoes(db: Db, margem: number) {
  db.update(schema.servicos)
    .set({ precoBase: sql`${schema.servicos.custo} + ${margem}` })
    .where(isNotNull(schema.servicos.custo))
    .run();
}

/**
 * Aplica o catálogo de SST uma vez por versão: renomeia os itens do catálogo inicial,
 * adiciona os que faltam e completa a descrição vazia. Preço só muda se ainda for o do
 * catálogo inicial (nunca editado) ou se for medição com custo de fornecedor.
 */
export function aplicarCatalogoSst(db: Db) {
  const marcador = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, "catalogo_sst_versao")).get();
  if (marcador?.valor === VERSAO_CATALOGO_SST) return;

  db.transaction((tx) => {
    for (const [antigo, novo] of Object.entries(RENOMEAR)) {
      const jaExiste = tx.select({ id: schema.servicos.id }).from(schema.servicos).where(eq(schema.servicos.nome, novo)).get();
      // Se o nome novo já existe, o antigo é uma cópia: sai do catálogo (propostas antigas não mudam)
      tx.update(schema.servicos)
        .set(jaExiste ? { ativo: false } : { nome: novo })
        .where(eq(schema.servicos.nome, antigo))
        .run();
    }
    const margem = lerMargemMedicoes(tx);
    const existentes = new Map(tx.select().from(schema.servicos).all().map((s) => [s.nome, s]));
    for (const item of CATALOGO_SST) {
      const atual = existentes.get(item.nome);
      const preco = item.custo != null ? { custo: item.custo, precoBase: item.custo + margem } : {};
      if (!atual) {
        tx.insert(schema.servicos).values({ ...item, ...preco }).run();
        continue;
      }
      const mudanca: Partial<Item> = { ...preco };
      if (item.custo != null) mudanca.unidade = item.unidade;
      if (!atual.descricao?.trim() || DESCRICOES_ANTIGAS.has(atual.descricao.trim())) mudanca.descricao = item.descricao;
      const antigo = PRECOS_ANTIGOS[item.nome];
      if (antigo && atual.precoBase === antigo.precoBase && atual.unidade === antigo.unidade) {
        mudanca.precoBase = item.precoBase;
        mudanca.unidade = item.unidade;
      }
      if (Object.keys(mudanca).length) tx.update(schema.servicos).set(mudanca).where(eq(schema.servicos.id, atual.id)).run();
    }
    tx.insert(schema.configuracoes)
      .values({ chave: "catalogo_sst_versao", valor: VERSAO_CATALOGO_SST })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: VERSAO_CATALOGO_SST } })
      .run();
  });
}
