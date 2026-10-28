import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BotaoLink, Selo } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario";
import { STATUS_PROPOSTA } from "@/lib/constantes";
import { lerConfig } from "@/lib/config";
import { formatarCnpj, formatarData, formatarMoeda, linkWhatsapp } from "@/lib/formato";
import { calcularTotais, numeroProposta } from "@/lib/propostas";
import { excluirProposta, mudarStatusProposta } from "../actions";
import { carregarProposta } from "../carregar";
import { BotaoImprimir } from "./botao-imprimir";

export const metadata: Metadata = { title: "Proposta" };

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
  const zap = linkWhatsapp(contato?.telefone ?? empresa.telefone);
  const textoZap = encodeURIComponent(
    `Olá${contato ? `, ${contato.nome.split(" ")[0]}` : ""}! Segue a proposta nº ${numero} de ${config.nomeEmpresa} no valor de ${formatarMoeda(total)}. Fico à disposição para qualquer dúvida.`,
  );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="nao-imprimir mb-6 flex flex-wrap items-center justify-between gap-3 pl-10 lg:pl-0">
        <div className="flex items-center gap-3">
          <Link href="/propostas" className="text-sm text-slate-500 hover:text-slate-800">
            ← Propostas
          </Link>
          <Selo classe={status.classe}>{status.nome}</Selo>
          {oportunidade && (
            <Link href={`/funil/${oportunidade.id}`} className="text-xs text-slate-500 hover:underline">
              Oportunidade: {oportunidade.titulo}
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {proposta.status === "rascunho" && (
            <form action={mudarStatusProposta.bind(null, id, "enviada")}>
              <button className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2 text-sm font-medium text-sky-800 hover:bg-sky-100">
                Marcar como enviada
              </button>
            </form>
          )}
          {(proposta.status === "enviada" || proposta.status === "rascunho") && (
            <>
              <form action={mudarStatusProposta.bind(null, id, "aceita")}>
                <button className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100">
                  Aceita ✓
                </button>
              </form>
              <form action={mudarStatusProposta.bind(null, id, "recusada")}>
                <button className="rounded-lg border border-rose-200 bg-white px-3.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                  Recusada
                </button>
              </form>
            </>
          )}
          {zap && (
            <a
              href={`${zap}?text=${textoZap}`}
              target="_blank"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Enviar no WhatsApp
            </a>
          )}
          <BotaoLink href={`/propostas/${id}/editar`} variante="secundario">
            Editar
          </BotaoLink>
          <BotaoImprimir />
          <BotaoConfirmar acao={excluirProposta.bind(null, id)} mensagem="Excluir esta proposta?">
            Excluir
          </BotaoConfirmar>
        </div>
      </div>

      {/* Documento da proposta (é o que sai na impressão) */}
      <article className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none md:p-12">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-marca-600 pb-6">
          <div>
            <p className="text-xl font-bold text-marca-900">{config.nomeEmpresa}</p>
            <p className="text-sm text-slate-500">Saúde e Segurança do Trabalho</p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              {config.cnpjEmpresa && <p>CNPJ {formatarCnpj(config.cnpjEmpresa)}</p>}
              {(config.telefoneEmpresa || config.emailEmpresa) && (
                <p>{[config.telefoneEmpresa, config.emailEmpresa].filter(Boolean).join(" · ")}</p>
              )}
              {config.enderecoEmpresa && <p>{config.enderecoEmpresa}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Proposta comercial</p>
            <p className="text-lg font-semibold text-slate-900">Nº {numero}</p>
            <p className="text-sm text-slate-500">Emitida em {formatarData(proposta.criadoEm)}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</p>
            <p className="font-medium text-slate-900">{empresa.razaoSocial}</p>
            {empresa.cnpj && <p className="text-slate-600">CNPJ {formatarCnpj(empresa.cnpj)}</p>}
            {(empresa.endereco || empresa.cidade) && (
              <p className="text-slate-600">
                {[empresa.endereco, empresa.cidade && `${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {(empresa.numFuncionarios || empresa.grauRisco) && (
              <p className="text-slate-600">
                {empresa.numFuncionarios ? `${empresa.numFuncionarios} funcionários` : ""}
                {empresa.numFuncionarios && empresa.grauRisco ? " · " : ""}
                {empresa.grauRisco ? `Grau de risco ${empresa.grauRisco}` : ""}
              </p>
            )}
          </div>
          {contato && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">A/C</p>
              <p className="font-medium text-slate-900">{contato.nome}</p>
              {contato.cargo && <p className="text-slate-600">{contato.cargo}</p>}
              {contato.email && <p className="text-slate-600">{contato.email}</p>}
              {contato.telefone && <p className="text-slate-600">{contato.telefone}</p>}
            </div>
          )}
        </section>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 font-medium">Serviço</th>
              <th className="py-2 text-right font-medium">Qtd.</th>
              <th className="py-2 text-right font-medium">Valor unit.</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((i) => (
              <tr key={i.id} className="border-b border-slate-100">
                <td className="py-2.5 pr-4 text-slate-800">{i.descricao}</td>
                <td className="py-2.5 text-right tabular-nums">{i.quantidade.toLocaleString("pt-BR")}</td>
                <td className="py-2.5 text-right tabular-nums">{formatarMoeda(i.valorUnitario)}</td>
                <td className="py-2.5 text-right font-medium tabular-nums">{formatarMoeda(i.quantidade * i.valorUnitario)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatarMoeda(subtotal)}</span>
          </div>
          {proposta.desconto > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Desconto ({proposta.desconto.toLocaleString("pt-BR")}%)</span>
              <span className="tabular-nums">− {formatarMoeda(valorDesconto)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-2 text-base font-bold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">{formatarMoeda(total)}</span>
          </div>
        </div>

        <section className="mt-8 space-y-4 text-sm text-slate-700">
          {proposta.condicoesPagamento && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Condições de pagamento</p>
              <p className="whitespace-pre-line">{proposta.condicoesPagamento}</p>
            </div>
          )}
          {proposta.observacoes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observações</p>
              <p className="whitespace-pre-line">{proposta.observacoes}</p>
            </div>
          )}
          {proposta.validade && (
            <p className="text-slate-500">Proposta válida até {formatarData(proposta.validade)}.</p>
          )}
        </section>

        <footer className="mt-16 grid gap-10 text-center text-xs text-slate-500 sm:grid-cols-2">
          <div className="border-t border-slate-400 pt-2">{config.nomeEmpresa}</div>
          <div className="border-t border-slate-400 pt-2">De acordo — {empresa.razaoSocial}</div>
        </footer>
      </article>
    </div>
  );
}
