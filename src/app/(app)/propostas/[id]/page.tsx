import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contratos } from "@/db/schema";
import { BotaoLink, Cabecalho, Cartao, Selo, TituloCartao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario";
import { AREAS, STATUS_CONTRATO, STATUS_PROPOSTA } from "@/lib/constantes";
import { lerConfig } from "@/lib/config";
import { formatarCnpj, formatarData, formatarMoeda, linkWhatsapp } from "@/lib/formato";
import { calcularTotais, numeroProposta } from "@/lib/propostas";
import { excluirProposta, mudarStatusProposta } from "../actions";
import { gerarContratos } from "../../contratos/actions";
import { carregarProposta } from "../carregar";

export const metadata: Metadata = { title: "Proposta" };

const botao = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition";

export default async function PropostaPage({ params }: PageProps<"/propostas/[id]">) {
  await connection();
  const id = Number((await params).id);
  const dados = carregarProposta(id);
  if (!dados) notFound();
  const { proposta, itens, empresa, oportunidade, contato } = dados;
  const config = lerConfig();
  const { subtotal, valorDesconto, total } = calcularTotais(itens, proposta.desconto);
  const numero = numeroProposta(id, proposta.criadoEm);
  const status = STATUS_PROPOSTA[proposta.status];
  const seguranca = itens.filter((i) => i.cobranca === "fixo");
  const exames = itens.filter((i) => i.cobranca === "por_demanda");
  const contratosDaProposta = db.select().from(contratos).where(eq(contratos.propostaId, id)).all();
  const areasContratadas = new Set(itens.filter((i) => !i.opcional).map((i) => i.area));
  const faltamContratos = [...areasContratadas].some((a) => !contratosDaProposta.some((c) => c.area === a));

  const zap = linkWhatsapp(contato?.telefone ?? empresa.telefone);
  const textoZap = encodeURIComponent(
    `Olá${contato ? `, ${contato.nome.split(" ")[0]}` : ""}! Segue a proposta nº ${numero} do ${config.nomeEmpresa}${total ? ` no valor de ${formatarMoeda(total)}` : ""}. Fico à disposição para qualquer dúvida.`,
  );

  return (
    <div className="max-w-5xl">
      <Cabecalho
        titulo={`Proposta nº ${numero}`}
        subtitulo={
          <span className="flex flex-wrap items-center gap-2">
            <Selo classe={status.classe}>{status.nome}</Selo>
            <Link href={`/empresas/${empresa.id}`} className="hover:underline">
              {empresa.razaoSocial}
            </Link>
            {oportunidade && (
              <Link href={`/funil/${oportunidade.id}`} className="hover:underline">
                · {oportunidade.titulo}
              </Link>
            )}
          </span>
        }
        acoes={
          <>
            <a href={`/api/documentos/proposta/${id}`} className={`${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
              Baixar Word
            </a>
            <a href={`/api/documentos/proposta/${id}?formato=pdf`} className={`${botao} bg-marca-600 text-white hover:bg-marca-700`}>
              Baixar PDF
            </a>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {proposta.status === "rascunho" && (
          <form action={mudarStatusProposta.bind(null, id, "enviada")}>
            <button className={`${botao} border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100`}>Marcar como enviada</button>
          </form>
        )}
        {(proposta.status === "enviada" || proposta.status === "rascunho") && (
          <>
            <form action={mudarStatusProposta.bind(null, id, "aceita")}>
              <button className={`${botao} border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}>Aceita ✓</button>
            </form>
            <form action={mudarStatusProposta.bind(null, id, "recusada")}>
              <button className={`${botao} border border-rose-200 bg-white text-rose-700 hover:bg-rose-50`}>Recusada</button>
            </form>
          </>
        )}
        {zap && (
          <a href={`${zap}?text=${textoZap}`} target="_blank" className={`${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}>
            Enviar mensagem no WhatsApp
          </a>
        )}
        <BotaoLink href={`/propostas/${id}/editar`} variante="secundario">
          Editar
        </BotaoLink>
        <BotaoConfirmar acao={excluirProposta.bind(null, id)} mensagem="Excluir esta proposta? Os contratos gerados dela também serão excluídos.">
          Excluir
        </BotaoConfirmar>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {seguranca.length > 0 && (
            <Cartao>
              <TituloCartao>Serviços de Segurança do Trabalho</TituloCartao>
              <ul className="divide-y divide-slate-100">
                {seguranca.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{i.descricao}</p>
                      <p className="text-xs text-slate-500">
                        {[i.natureza, i.periodo, i.opcional ? "opcional, fora do total" : "", i.quantidade !== 1 ? `${i.quantidade} × ${formatarMoeda(i.valorUnitario)}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${i.opcional ? "text-slate-400" : ""}`}>
                      {i.incluso ? "Incluso" : formatarMoeda(i.quantidade * i.valorUnitario)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 space-y-1 border-t border-slate-200 pt-3 text-right text-sm">
                {proposta.desconto > 0 && (
                  <>
                    <p className="text-slate-500">Subtotal {formatarMoeda(subtotal)}</p>
                    <p className="text-slate-500">
                      Desconto ({proposta.desconto.toLocaleString("pt-BR")}%) − {formatarMoeda(valorDesconto)}
                    </p>
                  </>
                )}
                <p className="text-base font-semibold text-marca-900">Total {formatarMoeda(total)}</p>
              </div>
            </Cartao>
          )}

          {exames.length > 0 && (
            <Cartao>
              <TituloCartao>Exames por demanda (valor por exame)</TituloCartao>
              <ul className="grid gap-x-6 sm:grid-cols-2">
                {exames.map((i) => (
                  <li key={i.id} className="flex justify-between gap-2 border-b border-slate-100 py-1.5 text-sm">
                    <span className="text-slate-700">{i.descricao}</span>
                    <span className="tabular-nums text-slate-900">{formatarMoeda(i.valorUnitario)}</span>
                  </li>
                ))}
              </ul>
            </Cartao>
          )}

          <Cartao>
            <TituloCartao>Condições</TituloCartao>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Info rotulo="Forma de pagamento" valor={proposta.condicoesPagamento} />
              <Info rotulo="Prazo de entrega" valor={proposta.prazoEntrega} />
              <Info rotulo="Válida até" valor={proposta.validade ? formatarData(proposta.validade) : null} />
              <Info rotulo="Tabela de medições" valor={proposta.mostrarMedicoes ? "Aparece na proposta" : "Não aparece"} />
              {proposta.observacoes && <Info rotulo="Observações" valor={proposta.observacoes} />}
            </dl>
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao>
            <TituloCartao>Cliente</TituloCartao>
            <p className="text-sm font-semibold text-slate-900">{empresa.razaoSocial}</p>
            {empresa.cnpj && <p className="text-xs text-slate-500">CNPJ {formatarCnpj(empresa.cnpj)}</p>}
            {contato && <p className="mt-2 text-xs text-slate-600">A/C {contato.nome}{contato.cargo ? ` · ${contato.cargo}` : ""}</p>}
          </Cartao>

          <Cartao>
            <TituloCartao>Contratos</TituloCartao>
            {contratosDaProposta.length > 0 && (
              <ul className="mb-3 space-y-2">
                {contratosDaProposta.map((c) => (
                  <li key={c.id}>
                    <Link href={`/contratos/${c.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                      <span className="font-semibold text-slate-900">{AREAS[c.area].nome}</span>
                      <Selo classe={STATUS_CONTRATO[c.status].classe}>{STATUS_CONTRATO[c.status].nome}</Selo>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {proposta.status === "aceita" && faltamContratos ? (
              <form action={gerarContratos.bind(null, id)}>
                <button className={`${botao} w-full bg-marca-600 text-white hover:bg-marca-700`}>
                  {contratosDaProposta.length ? "Gerar contratos que faltam" : "Gerar contratos"}
                </button>
              </form>
            ) : proposta.status !== "aceita" ? (
              <p className="text-xs text-slate-500">Quando a proposta for aceita, os contratos são gerados daqui: Segurança e/ou Saúde, conforme os serviços.</p>
            ) : null}
          </Cartao>
        </div>
      </div>
    </div>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="whitespace-pre-line text-slate-900">{valor || "—"}</dd>
    </div>
  );
}
