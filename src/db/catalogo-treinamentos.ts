import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { eq, inArray } from "drizzle-orm";
import * as schema from "./schema";
import { CATEGORIA_TREINAMENTOS } from "../lib/propostas";
import { TREINAMENTOS } from "./catalogo-treinamentos-dados";

type Db = BetterSQLite3Database<typeof schema>;

/** Mude ao alterar a lista de treinamentos. */
export const VERSAO_TREINAMENTOS = "2026-10";

/** Itens de treinamento do catálogo inicial, trocados pelos da planilha. */
const ANTIGOS = [
  "Treinamento NR-35 - Trabalho em altura",
  "Treinamento NR-10 - Segurança em eletricidade",
  "Treinamento NR-06 - Uso de EPI",
  "Treinamento NR-23 - Brigada de incêndio",
];

/**
 * Carrega os 258 treinamentos uma vez por versão. Treinamento que já existe
 * (mesmo nome) não tem preço alterado. Os antigos saem do catálogo, mas as
 * propostas que já usam eles continuam iguais.
 */
export function aplicarTreinamentos(db: Db) {
  const marcador = db.select().from(schema.configuracoes).where(eq(schema.configuracoes.chave, "treinamentos_versao")).get();
  if (marcador?.valor === VERSAO_TREINAMENTOS) return;

  db.transaction((tx) => {
    const existentes = new Set(tx.select({ nome: schema.servicos.nome }).from(schema.servicos).all().map((s) => s.nome));
    const novos = TREINAMENTOS.filter(([nome]) => !existentes.has(nome)).map(([nome, inicial, reciclagem]) => ({
      nome,
      categoria: CATEGORIA_TREINAMENTOS,
      precoBase: inicial ?? 0,
      precoReciclagem: reciclagem,
      unidade: "por participante",
      area: "seguranca" as const,
      cobranca: "fixo" as const,
    }));
    for (let i = 0; i < novos.length; i += 100) tx.insert(schema.servicos).values(novos.slice(i, i + 100)).run();
    tx.update(schema.servicos).set({ ativo: false }).where(inArray(schema.servicos.nome, ANTIGOS)).run();
    tx.insert(schema.configuracoes)
      .values({ chave: "treinamentos_versao", valor: VERSAO_TREINAMENTOS })
      .onConflictDoUpdate({ target: schema.configuracoes.chave, set: { valor: VERSAO_TREINAMENTOS } })
      .run();
  });
}
