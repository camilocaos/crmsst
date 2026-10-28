const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(valor: number | null | undefined) {
  return moeda.format(valor ?? 0);
}

/** Aceita "2026-10-28" ou "2026-10-28 14:30:00" e devolve "28/10/2026". */
export function formatarData(data: string | null | undefined) {
  if (!data) return "—";
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHora(data: string | null | undefined) {
  if (!data) return "—";
  return `${formatarData(data)} ${data.slice(11, 16)}`.trim();
}

/** Data de hoje no fuso local, no formato YYYY-MM-DD. */
export function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function somarDias(data: string, dias: number) {
  const [a, m, d] = data.split("-").map(Number);
  const nova = new Date(a, m - 1, d + dias);
  return `${nova.getFullYear()}-${String(nova.getMonth() + 1).padStart(2, "0")}-${String(nova.getDate()).padStart(2, "0")}`;
}

export function formatarCnpj(cnpj: string | null | undefined) {
  if (!cnpj) return "";
  const n = cnpj.replace(/\D/g, "");
  if (n.length !== 14) return cnpj;
  return n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/** Link de WhatsApp a partir de um telefone brasileiro. */
export function linkWhatsapp(telefone: string | null | undefined) {
  if (!telefone) return null;
  let n = telefone.replace(/\D/g, "");
  if (n.length < 10) return null;
  if (!n.startsWith("55")) n = "55" + n;
  return `https://wa.me/${n}`;
}
