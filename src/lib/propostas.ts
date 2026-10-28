export type ItemCalculo = { quantidade: number; valorUnitario: number };

export function calcularTotais(itens: ItemCalculo[], descontoPercentual: number) {
  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const desconto = Math.min(Math.max(descontoPercentual, 0), 100);
  const valorDesconto = (subtotal * desconto) / 100;
  return { subtotal, valorDesconto, total: subtotal - valorDesconto };
}

export function numeroProposta(id: number, criadoEm: string) {
  return `${String(id).padStart(4, "0")}/${criadoEm.slice(0, 4)}`;
}
