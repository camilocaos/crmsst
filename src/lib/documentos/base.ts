import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  AlignmentType, BorderStyle, Document, Header, HorizontalPositionRelativeFrom, ImageRun, LevelFormat, Paragraph,
  Table, TableCell, TableLayoutType, TableRow, TextRun, TextWrappingType, VerticalAlign, VerticalPositionRelativeFrom,
  WidthType, type ISectionOptions,
} from "docx";

// ---------- arquivos de imagem (timbrados e logos) ----------
const PASTA_MIDIA = path.join(process.cwd(), "documentos", "midia");
export const midia = (arquivo: string) => fs.readFileSync(path.join(PASTA_MIDIA, arquivo));

// ---------- estilo comum (o mesmo do modelo aprovado da proposta) ----------
export const FONTE = "Calibri";
export const TEXTO = "2B2B2B";
export const SUAVE = "6B6B6B";
export const LINHA = "D6D6D6";
export const VERDE = "8DC63F"; // CUIDI Segurança do Trabalho
export const AZUL = "1FB5B8"; // CUIDI Saúde Ocupacional
export const LARGURA = 9492; // área útil da página em DXA

export const real = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type OpcoesTexto = { size?: number; bold?: boolean; italics?: boolean; color?: string; espaco?: number; caps?: boolean };
export const t = (texto: string, o: OpcoesTexto = {}) =>
  new TextRun({ text: texto, font: FONTE, size: o.size ?? 21, bold: o.bold, italics: o.italics, color: o.color ?? TEXTO, characterSpacing: o.espaco, allCaps: o.caps });

type OpcoesParagrafo = {
  antes?: number;
  depois?: number;
  linha?: number;
  alinhar?: (typeof AlignmentType)[keyof typeof AlignmentType];
  junto?: boolean;
  recuo?: number;
  borda?: ConstructorParameters<typeof Paragraph>[0] extends infer O ? (O extends { border?: infer B } ? B : never) : never;
  lista?: boolean;
};
export const P = (runs: TextRun | ImageRun | (TextRun | ImageRun)[] | string, o: OpcoesParagrafo = {}) =>
  new Paragraph({
    children: typeof runs === "string" ? [t(runs)] : Array.isArray(runs) ? runs : [runs],
    spacing: { before: o.antes ?? 0, after: o.depois ?? 120, line: o.linha ?? 300 },
    alignment: o.alinhar ?? AlignmentType.JUSTIFIED,
    keepNext: o.junto,
    keepLines: true,
    indent: o.recuo ? { left: o.recuo } : undefined,
    border: o.borda,
    numbering: o.lista ? { reference: "lista", level: 0 } : undefined,
  });

/** Título de seção: número discreto + título, com linha fina embaixo. */
export const secao = (num: string, titulo: string) =>
  P([...(num ? [t(`${num}  `, { color: SUAVE, size: 26 })] : []), t(titulo, { bold: true, size: 28 })], {
    antes: 360,
    depois: 160,
    junto: true,
    alinhar: AlignmentType.LEFT,
    borda: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 6 } },
  });

/** Subtítulo com a barrinha da cor da unidade. */
export const subtitulo = (texto: string, cor: string) =>
  P([t(texto, { bold: true, size: 22 })], {
    antes: 200,
    depois: 120,
    junto: true,
    alinhar: AlignmentType.LEFT,
    borda: { left: { style: BorderStyle.SINGLE, size: 24, color: cor, space: 8 } },
  });

const nenhuma = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
export const semBordas = { top: nenhuma, bottom: nenhuma, left: nenhuma, right: nenhuma, insideHorizontal: nenhuma, insideVertical: nenhuma };

export function celula(filhos: Paragraph[], largura: number, o: { semLinha?: boolean; forte?: boolean; alto?: number; esq?: number; dir?: number } = {}) {
  return new TableCell({
    width: { size: largura, type: WidthType.DXA },
    borders: {
      top: nenhuma,
      left: nenhuma,
      right: nenhuma,
      bottom: o.semLinha ? nenhuma : { style: BorderStyle.SINGLE, size: o.forte ? 8 : 4, color: o.forte ? TEXTO : LINHA },
    },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: o.alto ?? 90, bottom: o.alto ?? 90, left: o.esq ?? 0, right: o.dir ?? 0 },
    children: filhos,
  });
}

const COLUNAS = [7092, 2400];
/** Linha "rótulo .......... valor" das tabelas leves. */
export const linhaValor = (rotulo: string, valor: string, o: { negrito?: boolean; forte?: boolean; semLinha?: boolean; size?: number; junto?: boolean; nota?: string } = {}) =>
  new TableRow({
    cantSplit: true,
    children: [
      celula(
        [
          P([t(rotulo, { bold: o.negrito, size: o.size })], { depois: o.nota ? 20 : 0, alinhar: AlignmentType.LEFT, junto: o.junto }),
          ...(o.nota ? [P([t(o.nota, { size: 18, color: SUAVE })], { depois: 0, alinhar: AlignmentType.LEFT, linha: 260, junto: o.junto })] : []),
        ],
        COLUNAS[0],
        { ...o, dir: 240 },
      ),
      celula([P([t(valor, { bold: o.negrito, size: o.size })], { depois: 0, alinhar: AlignmentType.RIGHT, junto: o.junto })], COLUNAS[1], o),
    ],
  });
export const cabecalhoTabela = (a: string, b: string) =>
  new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      celula([P([t(a, { size: 17, color: SUAVE, caps: true, espaco: 20 })], { depois: 0, alinhar: AlignmentType.LEFT, junto: true })], COLUNAS[0], { alto: 60 }),
      celula([P([t(b, { size: 17, color: SUAVE, caps: true, espaco: 20 })], { depois: 0, alinhar: AlignmentType.RIGHT, junto: true })], COLUNAS[1], { alto: 60 }),
    ],
  });
export const tabela = (linhas: TableRow[], colunas = COLUNAS) =>
  new Table({ width: { size: LARGURA, type: WidthType.DXA }, columnWidths: colunas, layout: TableLayoutType.FIXED, borders: semBordas, rows: linhas });

export const imagem = (arquivo: string, width: number, height: number) =>
  new ImageRun({ type: "png", data: midia(arquivo), transformation: { width, height } });

/** Documento A4 com o timbrado de página inteira atrás do texto. */
export function documento(timbrado: string, titulo: string, children: ISectionOptions["children"]) {
  const fundo = new ImageRun({
    type: "png",
    data: midia(timbrado),
    transformation: { width: 796, height: 1124 },
    floating: {
      horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
      verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
      behindDocument: true,
      allowOverlap: true,
      wrap: { type: TextWrappingType.NONE },
    },
  });
  return new Document({
    creator: "CRM Comercial",
    title: titulo,
    styles: { default: { document: { run: { font: FONTE, size: 21, color: TEXTO } } } },
    numbering: {
      config: [{ reference: "lista", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 300, hanging: 220 } } } }] }],
    },
    sections: [
      {
        properties: { page: { size: { width: 11940, height: 16860 }, margin: { top: 1900, right: 1224, bottom: 1550, left: 1224, header: 0, footer: 0 } } },
        headers: { default: new Header({ children: [new Paragraph({ children: [fundo] })] }) },
        children,
      },
    ],
  });
}

// ---------- datas e números por extenso ----------
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** "2026-10-14" -> "14 de outubro de 2026" */
export function dataPorExtenso(iso: string) {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function ate999(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (resto < 20) {
    if (resto) partes.push(UNIDADES[resto]);
  } else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    partes.push(u ? `${DEZENAS[d]} e ${UNIDADES[u]}` : DEZENAS[d]);
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (milhoes) partes.push(milhoes === 1 ? "um milhão" : `${ate999(milhoes)} milhões`);
  if (milhares) partes.push(milhares === 1 ? "mil" : `${ate999(milhares)} mil`);
  if (resto) partes.push(ate999(resto));
  if (partes.length === 1) return partes[0];
  // "mil e quinhentos", "dois mil e cem", "mil duzentos e cinquenta"
  const ultimo = partes.pop()!;
  const usaE = resto < 100 || resto % 100 === 0;
  return `${partes.join(" ")}${usaE ? " e " : " "}${ultimo}`;
}

/** 1500 -> "mil e quinhentos reais"; 845.5 -> "oitocentos e quarenta e cinco reais e cinquenta centavos" */
export function reaisPorExtenso(valor: number) {
  const centavosTotais = Math.round(valor * 100);
  const reais = Math.floor(centavosTotais / 100);
  const centavos = centavosTotais % 100;
  const parteReais = reais ? `${inteiroPorExtenso(reais)} ${reais === 1 ? "real" : "reais"}` : "";
  const parteCentavos = centavos ? `${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}` : "";
  if (!parteReais && !parteCentavos) return "zero reais";
  return [parteReais, parteCentavos].filter(Boolean).join(" e ");
}

/** "R$ 1.500,00 (mil e quinhentos reais)" */
export const valorComExtenso = (v: number) => `${real(v)} (${reaisPorExtenso(v)})`;
