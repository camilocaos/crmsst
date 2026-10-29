export type ItemCalculo = {
  quantidade: number;
  valorUnitario: number;
  /** "por_demanda" (exames): mostrado como valor por exame, nunca soma no total. */
  cobranca?: "fixo" | "por_demanda" | string | null;
  incluso?: boolean | null;
  opcional?: boolean | null;
};

/** Só entra no total o que tem valor fixo, não é incluso nem opcional. */
export const somaNoTotal = (i: ItemCalculo) => (i.cobranca ?? "fixo") === "fixo" && !i.incluso && !i.opcional;

export function calcularTotais(itens: ItemCalculo[], descontoPercentual: number) {
  const subtotal = itens.filter(somaNoTotal).reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const desconto = Math.min(Math.max(descontoPercentual, 0), 100);
  const valorDesconto = (subtotal * desconto) / 100;
  return { subtotal, valorDesconto, total: subtotal - valorDesconto };
}

export function numeroProposta(id: number, criadoEm: string) {
  return `${String(id).padStart(4, "0")}/${criadoEm.slice(0, 4)}`;
}

export const NATUREZAS = ["Elaboração", "Renovação", "Atualização"] as const;

/** Categoria das avaliações quantitativas (medições ambientais). */
export const CATEGORIA_MEDICOES = "Avaliações quantitativas";

/** Taxa cobrada pelo fornecedor das medições a cada visita; repassada sem margem. */
export const NOME_DESLOCAMENTO = "Taxa de deslocamento (medições)";

/** Margem padrão em R$ sobre o custo de cada medição do fornecedor. */
export const MARGEM_MEDICOES_PADRAO = 100;
