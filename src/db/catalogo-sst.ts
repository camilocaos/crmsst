import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import * as schema from "./schema";

type Db = BetterSQLite3Database<typeof schema>;
type Item = typeof schema.servicos.$inferInsert;

/** Mude ao alterar o catálogo padrão de Segurança do Trabalho. */
export const VERSAO_CATALOGO_SST = "2026-10";

/** Categoria das avaliações quantitativas: viram a tabela de referência da proposta quando não contratadas. */
export const CATEGORIA_MEDICOES = "Avaliações quantitativas";

const sst = (categoria: string, nome: string, precoBase: number, unidade: string, descricao: string): Item => ({
  categoria,
  nome,
  precoBase,
  unidade,
  descricao,
  area: "seguranca",
  cobranca: "fixo",
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
  sst(CATEGORIA_MEDICOES, "Ruído", 400, "por avaliação", "Avaliação quantitativa de ruído."),
  sst(CATEGORIA_MEDICOES, "Poeira respirável", 450, "por avaliação", "Avaliação quantitativa de poeira respirável."),
  sst(CATEGORIA_MEDICOES, "Vibração de corpo inteiro", 1500, "por avaliação", "Avaliação quantitativa de vibração de corpo inteiro."),
  sst(CATEGORIA_MEDICOES, "Calor", 550, "por avaliação", "Avaliação quantitativa de calor."),
];

/** Nomes antigos do catálogo inicial que viraram os nomes acima. */
const RENOMEAR: Record<string, string> = {
  "PCMSO - Programa de Controle Médico": "PCMSO - Programa de Controle Médico de Saúde Ocupacional",
  "LTCAT - Laudo Técnico das Condições Ambientais": "LTCAT - Laudo Técnico das Condições Ambientais do Trabalho",
  "Laudo de Insalubridade e Periculosidade": "LIP - Laudo de Insalubridade e Periculosidade",
  "Treinamento NR-05 - CIPA": "NR-05 - Constituição da CIPA ou nomeação de representante",
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
]);

/**
 * Aplica o catálogo de SST uma vez por versão: renomeia os itens do catálogo inicial,
 * adiciona os que faltam e completa a descrição vazia. Nunca muda preço já existente.
 */
export function aplicarCatalogoSst(db: Db) {
  const marcador = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, "catalogo_sst_versao")).get();
  if (marcador?.valor === VERSAO_CATALOGO_SST) return;

  db.transaction((tx) => {
    for (const [antigo, novo] of Object.entries(RENOMEAR)) {
      const jaExiste = tx.select({ id: schema.servicos.id }).from(schema.servicos).where(eq(schema.servicos.nome, novo)).get();
      if (!jaExiste) tx.update(schema.servicos).set({ nome: novo }).where(eq(schema.servicos.nome, antigo)).run();
    }
    const existentes = new Map(tx.select().from(schema.servicos).all().map((s) => [s.nome, s]));
    for (const item of CATALOGO_SST) {
      const atual = existentes.get(item.nome);
      if (!atual) tx.insert(schema.servicos).values(item).run();
      else if (!atual.descricao?.trim() || DESCRICOES_ANTIGAS.has(atual.descricao.trim())) {
        tx.update(schema.servicos).set({ descricao: item.descricao }).where(eq(schema.servicos.id, atual.id)).run();
      }
    }
    tx.insert(schema.configuracoes)
      .values({ chave: "catalogo_sst_versao", valor: VERSAO_CATALOGO_SST })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: VERSAO_CATALOGO_SST } })
      .run();
  });
}
