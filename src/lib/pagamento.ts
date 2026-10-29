/** Formas de pagamento prontas do contrato. O texto que vai para o documento sai daqui. */
export const OPCOES_PAGAMENTO = {
  pix: "Pix",
  boleto_vista: "Boleto à vista",
  boleto_parcelado: "Boleto parcelado",
  outro: "Outro",
} as const;

export type Pagamento = keyof typeof OPCOES_PAGAMENTO;

const dataBr = (iso: string) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

/** Vencimentos mensais a partir da 1ª parcela (dia 31 vira o último dia do mês). */
export function datasParcelas(primeira: string, quantidade: number): string[] {
  const [a, m, d] = primeira.split("-").map(Number);
  if (!a || !m || !d) return [];
  return Array.from({ length: Math.max(0, quantidade) }, (_, k) => {
    const ultimoDia = new Date(Date.UTC(a, m - 1 + k + 1, 0)).getUTCDate();
    const data = new Date(Date.UTC(a, m - 1 + k, Math.min(d, ultimoDia)));
    return data.toISOString().slice(0, 10);
  });
}

const juntar = (itens: string[]) => (itens.length > 1 ? `${itens.slice(0, -1).join(", ")} e ${itens.at(-1)}` : (itens[0] ?? ""));

/** Monta "forma de pagamento" e "vencimento" do contrato a partir da opção marcada. */
export function textoPagamento(d: {
  pagamento: Pagamento | null;
  parcelas: number | null;
  vencimentoData: string | null;
  formaPagamento: string | null;
  vencimento: string | null;
}): { formaPagamento: string | null; vencimento: string | null } {
  const data = d.vencimentoData ? dataBr(d.vencimentoData) : null;
  switch (d.pagamento) {
    case "pix":
      return { formaPagamento: "Pix, à vista", vencimento: data };
    case "boleto_vista":
      return { formaPagamento: "Boleto bancário, à vista", vencimento: data };
    case "boleto_parcelado": {
      const n = d.parcelas ?? 0;
      const datas = d.vencimentoData ? datasParcelas(d.vencimentoData, n).map(dataBr) : [];
      return {
        formaPagamento: `Boleto bancário, em ${n} parcelas mensais`,
        vencimento: datas.length ? juntar(datas) : null,
      };
    }
    case "outro":
      return { formaPagamento: d.formaPagamento, vencimento: d.vencimento };
    default:
      return { formaPagamento: null, vencimento: null };
  }
}

/** Contratos antigos (só com texto): descobre a opção para a tela. */
export function pagamentoInicial(c: { pagamento: Pagamento | null; formaPagamento: string | null }): Pagamento | null {
  if (c.pagamento) return c.pagamento;
  if (!c.formaPagamento) return null;
  return /pix/i.test(c.formaPagamento) ? "pix" : "outro";
}
