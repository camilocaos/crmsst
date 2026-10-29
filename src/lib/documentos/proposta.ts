import "server-only";
import { AlignmentType, BorderStyle, Packer, PageBreak, Paragraph, TableRow } from "docx";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { servicos, type Empresa, type Proposta, type PropostaItem } from "@/db/schema";
import { CATEGORIA_MEDICOES, NOME_DESLOCAMENTO } from "@/lib/propostas";
import { lerConfig } from "@/lib/config";
import { formatarCnpj, formatarData } from "@/lib/formato";
import { calcularTotais, numeroProposta } from "@/lib/propostas";
import {
  AZUL, LARGURA, LINHA, P, SUAVE, VERDE, cabecalhoTabela, celula, dataPorExtenso, documento, imagem, linhaValor, real,
  secao, semBordas, subtitulo, t, tabela,
} from "./base";
import { Table, TableLayoutType, WidthType } from "docx";

export type DadosProposta = { proposta: Proposta; itens: PropostaItem[]; empresa: Empresa };

const tagItem = (i: PropostaItem) => [i.natureza, i.periodo].filter(Boolean).join(" · ");

/** Gera a proposta comercial (.docx) no modelo do Grupo CUIDI. */
export async function gerarPropostaDocx({ proposta, itens, empresa }: DadosProposta): Promise<Buffer> {
  const config = lerConfig();
  const numero = numeroProposta(proposta.id, proposta.criadoEm);
  const seguranca = itens.filter((i) => i.cobranca === "fixo");
  const contratados = seguranca.filter((i) => !i.opcional);
  const opcionais = seguranca.filter((i) => i.opcional);
  const exames = itens.filter((i) => i.cobranca === "por_demanda");
  const { subtotal, valorDesconto, total } = calcularTotais(itens, proposta.desconto);

  // Medições contratadas aparecem como item; a tabela de referência mostra só as não contratadas
  const medicoesContratadas = new Set(seguranca.map((i) => i.servicoId).filter(Boolean));
  const tabelaMedicoes = proposta.mostrarMedicoes && seguranca.length
    ? db
        .select()
        .from(servicos)
        .where(and(eq(servicos.categoria, CATEGORIA_MEDICOES), eq(servicos.ativo, true)))
        .orderBy(asc(servicos.id))
        .all()
        .filter((m) => !medicoesContratadas.has(m.id))
    : [];
  const deslocamento = tabelaMedicoes.find((m) => m.nome === NOME_DESLOCAMENTO);
  const medicoesReferencia = tabelaMedicoes.filter((m) => m !== deslocamento);

  const local = [empresa.cidade, empresa.uf].filter(Boolean).join("/");
  const contato = [config.telefoneEmpresa, config.emailEmpresa].filter(Boolean).join(" · ");
  let n = 0;
  const proxima = () => String(++n);

  // ---------- capa ----------
  const capa = [
    P("", { depois: 1700 }),
    P([t("PROPOSTA TÉCNICA E COMERCIAL", { size: 20, color: SUAVE, espaco: 60 })], { alinhar: AlignmentType.LEFT, depois: 160 }),
    P([t("Saúde e Segurança", { bold: true, size: 64 })], { alinhar: AlignmentType.LEFT, depois: 0, linha: 240 }),
    P([t("do Trabalho", { bold: true, size: 64 })], { alinhar: AlignmentType.LEFT, depois: 600, linha: 240 }),
    P([t("Preparada para", { size: 20, color: SUAVE })], { alinhar: AlignmentType.LEFT, depois: 60 }),
    P([t(empresa.razaoSocial, { bold: true, size: 30 })], { alinhar: AlignmentType.LEFT, depois: 60 }),
    P([t([empresa.cnpj ? `CNPJ ${formatarCnpj(empresa.cnpj)}` : "", local].filter(Boolean).join("   ·   "), { size: 21, color: SUAVE })], { alinhar: AlignmentType.LEFT, depois: 2600 }),
    P(
      [
        t(`Proposta nº ${numero}`, { size: 20, color: SUAVE }),
        t("      Emitida em ", { size: 20, color: SUAVE }),
        t(dataPorExtenso(proposta.criadoEm), { size: 20 }),
        ...(proposta.validade ? [t("      Válida até ", { size: 20, color: SUAVE }), t(formatarData(proposta.validade), { size: 20 })] : []),
      ],
      { alinhar: AlignmentType.LEFT, borda: { top: { style: BorderStyle.SINGLE, size: 4, color: LINHA, space: 10 } }, depois: 0 },
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  // ---------- sobre o grupo ----------
  const logos = new Table({
    width: { size: LARGURA, type: WidthType.DXA },
    columnWidths: [3164, 3164, 3164],
    layout: TableLayoutType.FIXED,
    borders: semBordas,
    rows: [
      new TableRow({
        children: (
          [
            ["logo-seguranca.png", 150, 60, "Saúde e segurança no trabalho: programas, laudos, treinamentos e eSocial."],
            ["logo-saude.png", 150, 59, "Exames clínicos e complementares, com agilidade no atendimento."],
            ["logo-epi.png", 150, 60, "Equipamentos de proteção individual para cada etapa da operação."],
          ] as const
        ).map(([arq, w, h, desc]) =>
          celula(
            [P([imagem(arq, w, h)], { alinhar: AlignmentType.CENTER, depois: 80 }), P([t(desc, { size: 18, color: SUAVE })], { alinhar: AlignmentType.CENTER, depois: 0, linha: 260 })],
            3164,
            { semLinha: true, esq: 80 },
          ),
        ),
      }),
    ],
  });
  const sobre = [
    secao("", "Sobre o Grupo CUIDI"),
    P("O Grupo CUIDI reúne, em um só parceiro, as soluções que a sua empresa precisa para cuidar das pessoas e cumprir as obrigações legais de Saúde e Segurança do Trabalho. Nossa missão é simplificar a gestão de SST com uma equipe técnica qualificada e atendimento ágil.", { depois: 240 }),
    logos,
  ];

  // ---------- escopo ----------
  const escopo = [
    secao(proxima(), "Escopo dos serviços"),
    P("Esta proposta contempla exclusivamente os serviços descritos abaixo. Qualquer serviço não listado depende de orçamento e aprovação prévia."),
    ...(seguranca.length
      ? [
          subtitulo("CUIDI Segurança do Trabalho", VERDE),
          ...seguranca.flatMap((i) => {
            const tag = [tagItem(i), i.opcional ? "Opcional" : ""].filter(Boolean).join(" · ");
            return [
              P([t(i.descricao, { bold: true }), ...(tag ? [t(`   ${tag}`, { size: 18, color: SUAVE, caps: true, espaco: 10 })] : [])], { depois: 40, junto: true, alinhar: AlignmentType.LEFT, recuo: 220 }),
              ...(i.detalhe ? [P(i.detalhe, { depois: 160, recuo: 220 })] : [P("", { depois: 80 })]),
            ];
          }),
        ]
      : []),
    ...(exames.length
      ? [
          subtitulo("CUIDI Saúde Ocupacional", AZUL),
          P([t("Realização dos exames ocupacionais, por demanda", { bold: true })], { depois: 40, junto: true, alinhar: AlignmentType.LEFT, recuo: 220 }),
          P("Os exames são realizados conforme a necessidade da empresa, mediante encaminhamento, e cobrados individualmente pelo valor de cada exame efetivamente realizado. O protocolo definitivo segue o PCMSO: se ele indicar exames adicionais, eles serão informados e orçados antes da realização.", { depois: 160, recuo: 220 }),
        ]
      : []),
  ];

  // ---------- investimento ----------
  const valorDoItem = (i: PropostaItem) => (i.incluso ? "Incluso" : real(i.quantidade * i.valorUnitario));
  const notaDoItem = (i: PropostaItem) => (i.quantidade !== 1 && !i.incluso ? `${i.quantidade.toLocaleString("pt-BR")} × ${real(i.valorUnitario)}` : undefined);
  const investimento = [
    secao(proxima(), "Investimento"),
    ...(contratados.length
      ? [
          subtitulo("Serviços de Segurança do Trabalho", VERDE),
          tabela([
            cabecalhoTabela("Serviço", "Valor"),
            ...contratados.map((i) => linhaValor(i.descricao, valorDoItem(i), { nota: notaDoItem(i) })),
            ...(proposta.desconto > 0
              ? [linhaValor("Subtotal", real(subtotal)), linhaValor(`Desconto (${proposta.desconto.toLocaleString("pt-BR")}%)`, `− ${real(valorDesconto)}`)]
              : []),
            linhaValor("Total dos serviços de Segurança do Trabalho", real(total), { negrito: true, forte: true, semLinha: true, size: 23 }),
          ]),
          P("", { depois: 120 }),
        ]
      : []),
    ...(opcionais.length
      ? [
          subtitulo("Opcionais (não incluídos no total)", VERDE),
          P("Realizados somente se houver necessidade técnica e após aprovação da contratante.", { depois: 80, junto: true }),
          tabela([cabecalhoTabela("Serviço", "Valor"), ...opcionais.map((i) => linhaValor(i.descricao, real(i.quantidade * i.valorUnitario), { nota: notaDoItem(i) }))]),
          P("", { depois: 120 }),
        ]
      : []),
    ...(exames.length
      ? [
          subtitulo("Realização dos exames ocupacionais (valor por exame realizado)", AZUL),
          // a última linha fica presa à frase da regra, para ela não ir sozinha para outra página
          tabela([cabecalhoTabela("Exame", "Valor por exame"), ...exames.map((i, k) => linhaValor(i.descricao, real(i.valorUnitario), { junto: k === exames.length - 1 }))]),
          P("Cobrança somente pelos exames efetivamente realizados, sem pacote, sem quantidade mínima e sem valor fixo mensal.", { antes: 100, depois: 0 }),
        ]
      : []),
  ];

  // ---------- medições ----------
  const medicoes = medicoesReferencia.length
    ? [
        secao(proxima(), "Avaliações quantitativas, quando necessárias"),
        P("Durante a visita, o levantamento técnico ou o acompanhamento das atividades, pode ser identificada a necessidade de medições ambientais para complementar os documentos. Essas avaliações não estão incluídas nos valores acima e só serão realizadas após a aprovação prévia da contratante, conforme a tabela vigente da CUIDI:", { junto: true }),
        tabela([
          cabecalhoTabela("Avaliação quantitativa", "Valor de referência"),
          ...medicoesReferencia.map((m, k) => linhaValor(m.nome, real(m.precoBase), { junto: k < medicoesReferencia.length - 1 })),
        ]),
        ...(deslocamento
          ? [P(`Valores por avaliação. Em cada visita para as medições é cobrada também a taxa de deslocamento de ${real(deslocamento.precoBase)}.`, { antes: 100, depois: 0 })]
          : []),
      ]
    : [];

  // ---------- condições ----------
  const condicoes = [
    secao(proxima(), "Condições comerciais"),
    ...(proposta.condicoesPagamento ? [P([t("Forma de pagamento. ", { bold: true }), t(proposta.condicoesPagamento)], { lista: true, depois: 80 })] : []),
    ...(seguranca.length && proposta.prazoEntrega ? [P([t("Prazo de entrega. ", { bold: true }), t(fimComPonto(capitalizar(proposta.prazoEntrega)))], { lista: true, depois: 80 })] : []),
    ...(seguranca.length
      ? [P([t("Informações necessárias. ", { bold: true }), t("Dados dos estabelecimentos, relação de colaboradores com função e setor, descrição das atividades e acesso aos locais para o levantamento técnico.")], { lista: true, depois: 80 })]
      : []),
    ...(proposta.validade ? [P([t("Validade. ", { bold: true }), t(`Esta proposta é válida até ${formatarData(proposta.validade)}.`)], { lista: true, depois: 80 })] : []),
    ...(proposta.observacoes ? [P([t("Observações. ", { bold: true }), t(proposta.observacoes)], { lista: true, depois: 80 })] : []),
  ];

  // ---------- aprovação ----------
  const aprovacao = [
    secao(proxima(), "Aprovação"),
    P(`Para seguir, basta confirmar a aprovação${contato ? ` pelo contato ${contato}` : ""}. Em seguida, enviaremos o contrato de prestação de serviços para assinatura.`, { depois: 700, junto: true, alinhar: AlignmentType.LEFT }),
    P([t("_____________________________________________", { color: SUAVE })], { alinhar: AlignmentType.LEFT, depois: 40, junto: true }),
    P([t(empresa.razaoSocial, { bold: true, size: 20 })], { alinhar: AlignmentType.LEFT, depois: 20, junto: true }),
    P([t("Nome, cargo e data da aprovação", { size: 18, color: SUAVE })], { alinhar: AlignmentType.LEFT, depois: 0 }),
  ];

  const doc = documento("timbrado-grupo.png", `Proposta ${numero} - ${empresa.razaoSocial}`, [
    ...capa,
    ...sobre,
    ...escopo,
    ...investimento,
    ...medicoes,
    ...condicoes,
    ...aprovacao,
  ]);
  return Packer.toBuffer(doc);
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const fimComPonto = (s: string) => (/[.!?]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
