import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Cabecalho, Campo, Cartao, Selo, TituloCartao } from "@/components/ui";
import { BotaoConfirmar, Formulario } from "@/components/formulario";
import { AREAS, STATUS_CONTRATO } from "@/lib/constantes";
import { formatarCnpj, formatarMoeda } from "@/lib/formato";
import { calcularTotais, numeroProposta } from "@/lib/propostas";
import { CONTRATADAS } from "@/lib/documentos/contrato";
import { excluirContrato, salvarContrato } from "../actions";
import { carregarContrato } from "../carregar";

export const metadata: Metadata = { title: "Contrato" };

const botao = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition";

export default async function ContratoPage({ params }: PageProps<"/contratos/[id]">) {
  await connection();
  const id = Number((await params).id);
  const dados = carregarContrato(id);
  if (!dados) notFound();
  const { contrato: c, proposta, itens, empresa } = dados;
  const area = AREAS[c.area];
  const contratada = CONTRATADAS[c.area];
  const doContrato = itens.filter((i) => i.area === c.area && !i.opcional);
  const { total } = calcularTotais(doContrato, proposta.desconto);
  const seguranca = c.area === "seguranca";

  return (
    <div className="max-w-4xl">
      <Cabecalho
        titulo={`Contrato · ${area.nome}`}
        subtitulo={
          <span className="flex flex-wrap items-center gap-2">
            <Selo classe={STATUS_CONTRATO[c.status].classe}>{STATUS_CONTRATO[c.status].nome}</Selo>
            <span>{empresa.razaoSocial}</span>
            <Link href={`/propostas/${proposta.id}`} className="hover:underline">
              · proposta nº {numeroProposta(proposta.id, proposta.criadoEm)}
            </Link>
          </span>
        }
        acoes={
          <>
            <a href={`/api/documentos/contrato/${id}`} className={`${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
              Baixar Word
            </a>
            <a href={`/api/documentos/contrato/${id}?formato=pdf`} className={`${botao} bg-marca-600 text-white hover:bg-marca-700`}>
              Baixar PDF
            </a>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Cartao>
          <TituloCartao>Dados do contrato</TituloCartao>
          <p className="-mt-2 mb-4 text-xs text-slate-500">
            Empresa, serviços e valores vêm da proposta aceita. Aqui ficam só as informações que o contrato precisa a mais. Salve e baixe de novo para atualizar o documento.
          </p>
          <Formulario acao={salvarContrato.bind(null, id)} mensagemSucesso="Contrato salvo. Baixe o Word ou o PDF para ver a versão atualizada.">
            <div className="grid gap-4 md:grid-cols-2">
              {seguranca ? (
                <Campo rotulo="Tipo de contrato">
                  <select name="tipo" defaultValue={c.tipo} className="campo">
                    <option value="pontual">Pontual (serviço específico)</option>
                    <option value="mensalista">Mensalista (escopo continuado)</option>
                  </select>
                </Campo>
              ) : (
                <Campo rotulo="Tipo de contrato">
                  <input disabled value="Exames por demanda" className="campo bg-slate-50" />
                </Campo>
              )}
              <Campo rotulo="Status">
                <select name="status" defaultValue={c.status} className="campo">
                  {Object.entries(STATUS_CONTRATO).map(([v, s]) => (
                    <option key={v} value={v}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </Campo>

              {seguranca && (
                <Campo rotulo="Valor mensal (só para mensalista)">
                  <input name="valorMensal" type="number" min={0} step="0.01" defaultValue={c.valorMensal ?? ""} className="campo" />
                </Campo>
              )}
              <Campo rotulo={seguranca ? "Vigência (vazio = até concluir os serviços)" : "Vigência"}>
                <input name="vigencia" defaultValue={c.vigencia ?? ""} placeholder={seguranca ? "ex.: 12 (doze) meses" : "ex.: prazo indeterminado"} className="campo" />
              </Campo>

              <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 md:col-span-2">
                <input type="checkbox" name="formalizacaoPosterior" defaultChecked={c.formalizacaoPosterior} className="mt-1" />
                <span>
                  <span className="font-semibold">Formalização de serviço já executado.</span> O contrato passa a dizer que os serviços já foram realizados e não cria prazo futuro de execução.
                </span>
              </label>
              <Campo rotulo="Data em que o serviço foi executado (se já executado)">
                <input name="dataExecucao" type="date" defaultValue={c.dataExecucao ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Data da assinatura">
                <input name="dataAssinatura" type="date" defaultValue={c.dataAssinatura ?? ""} className="campo" />
              </Campo>

              <Campo rotulo="Forma de pagamento">
                <input name="formaPagamento" defaultValue={c.formaPagamento ?? ""} placeholder="ex.: Pix, à vista, após a assinatura" className="campo" />
              </Campo>
              <Campo rotulo="Vencimento / parcelas">
                <input name="vencimento" defaultValue={c.vencimento ?? ""} placeholder="ex.: 50% na assinatura e 50% até 05/11/2026" className="campo" />
              </Campo>
              <Campo rotulo="Pagamentos já realizados (um por linha)" className="md:col-span-2">
                <textarea
                  name="pagamentosRealizados"
                  rows={3}
                  defaultValue={c.pagamentosRealizados ?? ""}
                  placeholder={"ex.: 18/10/2026 - R$ 500,00 via Pix - primeira parcela dos programas"}
                  className="campo"
                />
              </Campo>

              <Campo rotulo="Endereço completo do cliente" className="md:col-span-2">
                <input name="enderecoCliente" defaultValue={c.enderecoCliente ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Representante do cliente (nome e CPF)" className="md:col-span-2">
                <input name="representante" defaultValue={c.representante ?? ""} placeholder="ex.: Maria Souza, CPF 000.000.000-00, sócia-administradora" className="campo" />
              </Campo>
              <Campo rotulo="Testemunha 1 (nome e CPF)">
                <input name="testemunha1" defaultValue={c.testemunha1 ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Testemunha 2 (nome e CPF)">
                <input name="testemunha2" defaultValue={c.testemunha2 ?? ""} className="campo" />
              </Campo>
              <Campo rotulo="Condições específicas (viram uma cláusula extra, se preenchido)" className="md:col-span-2">
                <textarea name="observacoes" rows={3} defaultValue={c.observacoes ?? ""} className="campo" />
              </Campo>
            </div>
          </Formulario>
        </Cartao>

        <div className="space-y-6">
          <Cartao>
            <TituloCartao>Contratada</TituloCartao>
            <p className="text-sm font-semibold text-slate-900">{contratada.razao}</p>
            <p className="text-xs text-slate-500">CNPJ {contratada.cnpj}</p>
            <p className="mt-1 text-xs text-slate-500">{contratada.endereco}</p>
          </Cartao>
          <Cartao>
            <TituloCartao>Entra no contrato</TituloCartao>
            <ul className="space-y-2 text-sm">
              {doContrato.map((i, k) => (
                <li key={k} className="flex justify-between gap-2">
                  <span className="text-slate-700">{i.descricao}</span>
                  <span className="shrink-0 tabular-nums text-slate-500">
                    {i.cobranca === "por_demanda" ? `${formatarMoeda(i.valorUnitario)}/exame` : i.incluso ? "Incluso" : formatarMoeda(i.quantidade * i.valorUnitario)}
                  </span>
                </li>
              ))}
            </ul>
            {seguranca && (
              <p className="mt-3 border-t border-slate-100 pt-2 text-right text-sm font-semibold">Total {formatarMoeda(total)}</p>
            )}
            <p className="mt-3 text-xs text-slate-500">
              Cliente: {empresa.razaoSocial}
              {empresa.cnpj ? ` · ${formatarCnpj(empresa.cnpj)}` : ""}. Opcionais da proposta não entram no contrato.
            </p>
          </Cartao>
          <BotaoConfirmar acao={excluirContrato.bind(null, id)} mensagem="Excluir este contrato? A proposta continua.">
            Excluir contrato
          </BotaoConfirmar>
        </div>
      </div>
    </div>
  );
}
