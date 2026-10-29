import "server-only";
import { AlignmentType, Packer, Paragraph } from "docx";
import type { Contrato, Empresa, Proposta, PropostaItem } from "@/db/schema";
import { formatarCnpj, hoje } from "@/lib/formato";
import { calcularTotais, numeroProposta } from "@/lib/propostas";
import { P, SUAVE, cabecalhoTabela, dataPorExtenso, documento, linhaValor, real, t, tabela, valorComExtenso } from "./base";

/** Dados de cada unidade da CUIDI que aparece como CONTRATADA. */
export const CONTRATADAS = {
  seguranca: {
    razao: "CUID SERVICOS E GESTAO DE NEGOCIOS EMPRESARIAIS LTDA",
    cnpj: "53.912.054/0001-90",
    endereco: "QS 01, Ed. LED, Torre 3, Sala 103, Águas Claras, Brasília/DF",
    timbrado: "timbrado-seguranca.png",
  },
  saude: {
    razao: "CUIDI SAÚDE OCUPACIONAL LTDA",
    cnpj: "63.819.592/0001-98",
    endereco: "QS 03, Ed. Pátio Capital, Salas 201/202, CEP 71.953-000",
    timbrado: "timbrado-saude.png",
  },
} as const;

export type DadosContrato = { contrato: Contrato; proposta: Proposta; itens: PropostaItem[]; empresa: Empresa };

const CLAUSULAS = ["PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA", "OITAVA", "NONA", "DÉCIMA", "DÉCIMA PRIMEIRA", "DÉCIMA SEGUNDA"];

const J = (texto: string, o: { depois?: number } = {}) => P(texto, { depois: o.depois ?? 120 });
const item = (texto: string) => P(texto, { lista: true, depois: 60 });
const linhas = (texto: string | null | undefined) => (texto ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

/** Gera o contrato (.docx) da unidade (Segurança ou Saúde), só com o que foi contratado. */
export async function gerarContratoDocx({ contrato, proposta, itens, empresa }: DadosContrato): Promise<Buffer> {
  const unidade = CONTRATADAS[contrato.area];
  const numero = numeroProposta(proposta.id, proposta.criadoEm);
  const posterior = contrato.formalizacaoPosterior;
  const mensalista = contrato.area === "seguranca" && contrato.tipo === "mensalista";
  const doContrato = itens.filter((i) => i.area === contrato.area && !i.opcional);
  const servicos = doContrato.filter((i) => i.cobranca === "fixo");
  const exames = doContrato.filter((i) => i.cobranca === "por_demanda");
  const { total } = calcularTotais(servicos, proposta.desconto);
  const temEsocial = servicos.some((i) => /esocial/i.test(i.descricao));
  const temAep = servicos.some((i) => /^AEP\b/i.test(i.descricao));
  const temAet = servicos.some((i) => /^AET\b/i.test(i.descricao));
  const dataExecucao = contrato.dataExecucao ? ` em ${dataPorExtenso(contrato.dataExecucao)}` : "";

  let k = 0;
  const clausula = (titulo: string) =>
    P([t(`CLÁUSULA ${CLAUSULAS[k++]} - ${titulo}`, { bold: true, size: 22 })], { antes: 320, depois: 120, junto: true, alinhar: AlignmentType.LEFT });

  // ---------- título e partes ----------
  const titulo =
    contrato.area === "saude"
      ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE SAÚDE OCUPACIONAL"
      : mensalista
        ? "CONTRATO DE PRESTAÇÃO DE SERVIÇOS CONTINUADOS DE CONSULTORIA EM SST"
        : "CONTRATO DE PRESTAÇÃO DE SERVIÇOS PONTUAIS EM SST";
  const enderecoCliente = contrato.enderecoCliente || [empresa.endereco, empresa.cidade && `${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}`].filter(Boolean).join(", ");
  const partes = [
    P([t(titulo, { bold: true, size: 28 })], { alinhar: AlignmentType.CENTER, depois: 60 }),
    P([t(`Referente à proposta nº ${numero}`, { size: 19, color: SUAVE })], { alinhar: AlignmentType.CENTER, depois: 320 }),
    P(
      [
        t("CONTRATANTE: ", { bold: true }),
        t(
          `${empresa.razaoSocial}, inscrita no CNPJ nº ${formatarCnpj(empresa.cnpj) || "[CNPJ]"}, situada no endereço ${enderecoCliente || "[ENDEREÇO]"}${
            contrato.representante ? `, neste ato representada por ${contrato.representante}` : ""
          }, doravante denominada simplesmente CONTRATANTE.`,
        ),
      ],
      { depois: 120 },
    ),
    P(
      [
        t("CONTRATADA: ", { bold: true }),
        t(`${unidade.razao}, inscrita no CNPJ nº ${unidade.cnpj}, situada no endereço ${unidade.endereco}, doravante denominada simplesmente CONTRATADA.`),
      ],
      { depois: 120 },
    ),
  ];

  const corpo = contrato.area === "saude" ? clausulasSaude() : clausulasSeguranca();

  // ---------- assinaturas (uma embaixo da outra) ----------
  // Todo o bloco de assinaturas fica junto (keepNext em cadeia) para não sobrar testemunha sozinha numa página
  const assinatura = (rotulo: string, nome: string, extra?: string) => [
    P([t("____________________________________________", { color: SUAVE })], { antes: 600, depois: 40, junto: true, alinhar: AlignmentType.LEFT }),
    P([t(`${rotulo}: `, { bold: true }), t(nome, { bold: true })], { depois: 0, junto: true, alinhar: AlignmentType.LEFT }),
    ...(extra ? [P([t(extra, { size: 19 })], { depois: 0, junto: true, alinhar: AlignmentType.LEFT })] : []),
  ];
  const fecho = [
    P("E, por estarem justas e contratadas, as partes assinam o presente instrumento, física ou eletronicamente, juntamente com duas testemunhas.", { depois: 200, junto: true }),
    ...assinatura("CONTRATANTE", empresa.razaoSocial, `CNPJ: ${formatarCnpj(empresa.cnpj) || "[CNPJ]"}`),
    ...assinatura("CONTRATADA", unidade.razao, `CNPJ: ${unidade.cnpj}`),
    ...assinatura("TESTEMUNHA 1", contrato.testemunha1 || "[NOME E CPF]"),
    ...assinatura("TESTEMUNHA 2", contrato.testemunha2 || "[NOME E CPF]"),
    P([t(`Brasília - DF, ${dataPorExtenso(contrato.dataAssinatura || hoje())}.`, { bold: true })], { antes: 500, alinhar: AlignmentType.CENTER, depois: 0 }),
  ];

  const doc = documento(unidade.timbrado, `${titulo} - ${empresa.razaoSocial}`, [...partes, ...corpo, ...fecho]);
  return Packer.toBuffer(doc);

  // =====================================================================
  function clausulasSeguranca(): Paragraph[] | (Paragraph | ReturnType<typeof tabela>)[] {
    const descreverItem = (i: PropostaItem) => {
      const nome = [i.descricao, i.natureza ? `(${i.natureza.toLowerCase()})` : ""].filter(Boolean).join(" ");
      const periodo = i.periodo ? `, referente a ${i.periodo}` : "";
      const valor = i.incluso
        ? ", incluso sem custo adicional"
        : i.quantidade === 1
          ? `, no valor de ${valorComExtenso(i.valorUnitario)}`
          : `, no valor unitário de ${valorComExtenso(i.valorUnitario)}, para ${i.quantidade.toLocaleString("pt-BR")} unidades, totalizando ${valorComExtenso(i.quantidade * i.valorUnitario)}`;
      return `${nome}${periodo}${valor}.${i.detalhe ? ` ${fimComPonto(i.detalhe)}` : ""}`;
    };

    const objeto = [
      clausula("DO OBJETO"),
      J(
        posterior
          ? `O presente instrumento formaliza a contratação de serviços técnicos de Saúde e Segurança do Trabalho já executados pela CONTRATADA${dataExecucao}, conforme a proposta nº ${numero} aprovada pela CONTRATANTE, contemplando exclusivamente os serviços descritos abaixo.`
          : mensalista
            ? `O presente contrato tem por objeto a prestação continuada de serviços de consultoria em Saúde e Segurança do Trabalho para a CONTRATANTE, conforme a proposta nº ${numero} aprovada, compreendendo exclusivamente as atividades descritas abaixo.`
            : `O presente contrato tem por objeto a prestação pontual dos serviços técnicos de Saúde e Segurança do Trabalho descritos abaixo, conforme a proposta nº ${numero} aprovada pela CONTRATANTE.`,
      ),
      J(posterior ? "Os serviços executados contemplam:" : "Os serviços contratados contemplam:", { depois: 80 }),
      ...servicos.map((i) => item(descreverItem(i))),
    ];

    const execucao = [
      clausula(posterior ? "DAS INFORMAÇÕES E DA EXECUÇÃO REALIZADA" : "DAS INFORMAÇÕES E DA EXECUÇÃO"),
      J(
        posterior
          ? "Os serviços foram executados com base nas informações e nos documentos fornecidos pela CONTRATANTE e nos levantamentos técnicos realizados, cuja veracidade, atualização e completude são de responsabilidade da CONTRATANTE."
          : "A execução dos serviços dependerá do envio, pela CONTRATANTE, das informações necessárias, incluindo dados cadastrais da empresa, relação atualizada de colaboradores, funções, setores, endereços de atuação e descrição das atividades, além do acesso aos locais para o levantamento técnico, quando aplicável. A veracidade, atualização e completude dessas informações são de responsabilidade da CONTRATANTE.",
      ),
      J("Caso sejam identificadas necessidades técnicas não previstas neste instrumento, inclusive medições ambientais e avaliações quantitativas, treinamentos, exames ou serviços complementares, a CONTRATADA apresentará os respectivos valores para aprovação prévia da CONTRATANTE antes de qualquer execução."),
      ...(temAep && !temAet
        ? [J("A AET - Análise Ergonômica do Trabalho não integra o objeto deste contrato e somente será realizada, mediante nova aprovação, se a avaliação ergonômica preliminar indicar a necessidade de aprofundamento.")]
        : []),
    ];

    const prazo = [
      clausula(posterior ? "DA EXECUÇÃO JÁ REALIZADA" : mensalista ? "DA PRESTAÇÃO DOS SERVIÇOS" : "DO PRAZO DE EXECUÇÃO"),
      J(
        posterior
          ? `Os serviços objeto deste instrumento já foram executados e entregues pela CONTRATADA${dataExecucao}. Este contrato não estabelece novo prazo de execução para esses serviços.`
          : mensalista
            ? "Os serviços serão prestados de forma continuada durante a vigência deste contrato, conforme cronograma e demandas acordados entre as partes."
            : `Os serviços serão iniciados após a assinatura deste contrato e o recebimento das informações necessárias. O prazo para entrega é de ${proposta.prazoEntrega || "[PRAZO DE ENTREGA]"}, e eventuais pendências que afetem esse prazo serão comunicadas por escrito.`,
      ),
    ];

    const responsabilidades = [
      clausula("DA APLICAÇÃO E DAS RESPONSABILIDADES"),
      J("A aplicação prática dos programas, planos de ação, medidas preventivas e recomendações constantes nos documentos elaborados é de responsabilidade da CONTRATANTE, que deverá comunicar à CONTRATADA alterações de funções, processos, locais e condições de trabalho. À CONTRATADA cabe executar o objeto com profissionais habilitados e prestar as orientações dentro do escopo contratado. A elaboração dos documentos não substitui a implementação das medidas pelo empregador."),
      J(
        `Não estão incluídos serviços além dos expressamente descritos neste instrumento${temEsocial ? "" : ", inclusive a transmissão de eventos ao eSocial"}. Qualquer acréscimo de escopo ou de preço dependerá de autorização escrita da CONTRATANTE.${
          temEsocial ? " O envio ao eSocial limita-se ao período indicado na Cláusula Primeira; a continuidade depende de nova negociação." : ""
        } As partes protegerão os dados pessoais e de saúde envolvidos, respeitando o sigilo e os prazos legais de guarda.`,
      ),
    ];

    const pagamento = [
      clausula("DO PAGAMENTO"),
      J(
        mensalista && contrato.valorMensal
          ? `Pelos serviços contratados, a CONTRATANTE pagará à CONTRATADA o valor mensal de ${valorComExtenso(contrato.valorMensal)}.`
          : `Pelos serviços ${posterior ? "executados" : "contratados"}, a CONTRATANTE pagará à CONTRATADA o valor total de ${valorComExtenso(total)}${proposta.desconto > 0 ? `, já considerado o desconto de ${proposta.desconto.toLocaleString("pt-BR")}%` : ""}.`,
      ),
      ...pagamentoComum(),
      J("Em caso de atraso, a CONTRATADA notificará a CONTRATANTE por escrito e concederá 5 (cinco) dias úteis para regularização. Persistindo o débito, poderá suspender novos serviços ainda não iniciados, mediante aviso. Não haverá cobrança de serviço não executado nem de custo adicional sem autorização prévia."),
    ];

    const vigencia = [
      clausula("DA VIGÊNCIA"),
      J(
        mensalista
          ? `O presente contrato terá início na data de sua assinatura e vigorará por ${contrato.vigencia || "[PRAZO DE VIGÊNCIA]"}. Eventual renovação dependerá de acordo expresso entre as partes.`
          : contrato.vigencia
            ? `O presente contrato terá início na data de sua assinatura e vigorará por ${contrato.vigencia}. Ao final desse prazo, a continuidade dos serviços dependerá de nova contratação.`
            : `O presente contrato terá início na data de sua assinatura e vigorará até ${posterior ? "a liquidação das obrigações correspondentes aos serviços já executados" : "a conclusão dos serviços contratados e a liquidação das obrigações correspondentes"}. Não haverá renovação automática nem obrigação de mensalidade.`,
      ),
    ];

    return [...objeto, ...execucao, ...prazo, ...responsabilidades, ...pagamento, ...vigencia, ...clausulasFinais()];
  }

  // =====================================================================
  function clausulasSaude() {
    return [
      clausula("DO OBJETO"),
      J(
        posterior
          ? `O presente instrumento formaliza a contratação dos serviços de Saúde Ocupacional já realizados pela CONTRATADA${dataExecucao}, conforme a proposta nº ${numero} aprovada pela CONTRATANTE, e dos que vierem a ser solicitados por demanda, pelos valores abaixo.`
          : `O presente contrato tem por objeto a prestação de serviços de Saúde Ocupacional por demanda, compreendendo a realização dos exames e serviços relacionados abaixo, mediante encaminhamento da CONTRATANTE, conforme a proposta nº ${numero} aprovada.`,
        { depois: 160 },
      ),
      tabela([cabecalhoTabela("Exame / serviço", "Valor por exame"), ...exames.map((i) => linhaValor(i.descricao, real(i.valorUnitario)))]),
      P("", { depois: 60 }),

      clausula("DA EXECUÇÃO E DAS RESPONSABILIDADES"),
      J("Os atendimentos serão realizados mediante encaminhamento da CONTRATANTE e conforme a disponibilidade de agenda da clínica. A CONTRATANTE deverá informar corretamente os dados do trabalhador, a função, o tipo de exame (admissional, periódico, demissional, retorno ao trabalho ou mudança de função) e demais informações necessárias."),
      J("Os exames clínicos e complementares observarão o PCMSO aplicável. Exames não previstos, alterações de protocolo ou procedimentos adicionais serão informados e orçados antes da realização e dependerão de aprovação da CONTRATANTE."),
      J("Os resultados e documentos serão disponibilizados conforme os prazos técnicos de cada procedimento. Exames laboratoriais, de imagem ou com laudo especializado podem ter prazo diferente da avaliação clínica. As partes protegerão os dados pessoais e de saúde envolvidos, respeitando o sigilo médico e os prazos legais de guarda."),

      clausula("DO PAGAMENTO"),
      J("Os serviços serão cobrados por exame efetivamente realizado, conforme os valores da Cláusula Primeira, sem pacote, sem quantidade mínima e sem valor fixo mensal."),
      ...pagamentoComum(),

      clausula("DA VIGÊNCIA"),
      J(`O presente contrato terá início na data de sua assinatura e vigorará por ${contrato.vigencia || "[PRAZO DE VIGÊNCIA]"}. Eventual alteração dos valores será comunicada previamente por escrito.`),

      ...clausulasFinais(),
    ];
  }

  // =====================================================================
  function pagamentoComum() {
    const feitos = linhas(contrato.pagamentosRealizados);
    const pix = /pix/i.test(contrato.formaPagamento ?? "");
    return [
      ...(contrato.formaPagamento || contrato.vencimento
        ? [
            J(
              [contrato.formaPagamento ? `Forma de pagamento: ${fimComPonto(contrato.formaPagamento)}` : "", contrato.vencimento ? `Vencimento: ${fimComPonto(contrato.vencimento)}` : ""]
                .filter(Boolean)
                .join(" "),
            ),
          ]
        : []),
      ...(pix ? [J(`Chave Pix: CNPJ ${unidade.cnpj} (${unidade.razao}).`)] : []),
      ...(feitos.length
        ? [
            J("A CONTRATANTE já efetuou os pagamentos abaixo, que serão abatidos dos respectivos serviços, sem cobrança em duplicidade:", { depois: 60 }),
            ...feitos.map((f) => item(fimComPonto(f))),
          ]
        : []),
    ];
  }

  function clausulasFinais() {
    return [
      clausula("DA DIVULGAÇÃO INSTITUCIONAL"),
      J("A CONTRATANTE autoriza, de forma gratuita e não exclusiva, o uso de sua razão social, nome fantasia, marca e logotipo pela CONTRATADA exclusivamente para fins institucionais e de portfólio, incluindo sua identificação na seção “Clientes que confiam na CUIDI” do site institucional, bem como em apresentações comerciais e materiais institucionais do Grupo CUIDI. A autorização também abrange imagens institucionais de instalações, produtos ou materiais da CONTRATANTE que sejam por ela fornecidas ou previamente autorizadas, não abrangendo dados confidenciais nem imagens de pessoas identificáveis sem autorização específica. A CONTRATANTE poderá solicitar por escrito a retirada desses materiais dos canais sob controle direto da CONTRATADA."),
      clausula("DA RESCISÃO"),
      J("O contrato poderá ser encerrado por qualquer das partes mediante comunicação escrita. Em caso de descumprimento passível de correção, será concedido prazo de 5 (cinco) dias úteis após o recebimento da notificação para regularização. Serão devidos os serviços efetivamente prestados e os custos previamente autorizados e comprovados até a data do encerramento."),
      clausula("DO FORO"),
      J("As partes elegem o foro de Brasília/DF, na circunscrição judiciária competente para Águas Claras, observadas as regras legais de competência, para dirimir controvérsias decorrentes deste contrato."),
      ...(contrato.observacoes ? [clausula("DAS DISPOSIÇÕES ESPECÍFICAS"), J(contrato.observacoes)] : []),
    ];
  }
}

const fimComPonto = (s: string) => (/[.!?;:]$/.test(s.trim()) ? s.trim() : `${s.trim()}.`);
