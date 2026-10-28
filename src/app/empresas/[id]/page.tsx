import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { contatos, empresas, notas, oportunidades, tarefas } from "@/db/schema";
import { buscarTarefas, pendentes } from "@/app/tarefas/consultas";
import { ListaTarefas } from "@/app/tarefas/lista-tarefas";
import { NovaTarefa } from "@/app/tarefas/nova-tarefa";
import { BotaoLink, Cabecalho, Cartao, Selo, TituloCartao } from "@/components/ui";
import { BotaoConfirmar, Formulario } from "@/components/formulario";
import { STATUS_EMPRESA, nomeEtapa } from "@/lib/constantes";
import { formatarCnpj, formatarData, formatarDataHora, formatarMoeda, linkWhatsapp } from "@/lib/formato";
import {
  criarContato,
  criarNota,
  excluirContato,
  excluirEmpresa,
  excluirNota,
  tornarPrincipal,
} from "../actions";

export async function generateMetadata({ params }: PageProps<"/empresas/[id]">): Promise<Metadata> {
  await connection();
  const e = db.select().from(empresas).where(eq(empresas.id, Number((await params).id))).get();
  return { title: e?.nomeFantasia || e?.razaoSocial || "Empresa" };
}

export default async function EmpresaPage({ params }: PageProps<"/empresas/[id]">) {
  await connection();
  const id = Number((await params).id);
  const empresa = db.select().from(empresas).where(eq(empresas.id, id)).get();
  if (!empresa) notFound();

  const listaContatos = db
    .select()
    .from(contatos)
    .where(eq(contatos.empresaId, id))
    .orderBy(desc(contatos.principal), contatos.nome)
    .all();
  const listaNotas = db.select().from(notas).where(eq(notas.empresaId, id)).orderBy(desc(notas.id)).all();
  const listaOportunidades = db
    .select()
    .from(oportunidades)
    .where(eq(oportunidades.empresaId, id))
    .orderBy(desc(oportunidades.id))
    .all();
  const listaTarefas = buscarTarefas(pendentes(eq(tarefas.empresaId, id)));
  const status = STATUS_EMPRESA[empresa.status];
  const zap = linkWhatsapp(empresa.telefone);

  return (
    <>
      <Cabecalho
        titulo={empresa.nomeFantasia || empresa.razaoSocial}
        subtitulo={
          <span className="flex flex-wrap items-center gap-2">
            <Selo classe={status.classe}>{status.nome}</Selo>
            {empresa.nomeFantasia && <span>{empresa.razaoSocial}</span>}
            {empresa.cnpj && <span>· {formatarCnpj(empresa.cnpj)}</span>}
          </span>
        }
        acoes={
          <>
            <BotaoLink href={`/empresas/${id}/editar`} variante="secundario">
              Editar
            </BotaoLink>
            <BotaoConfirmar
              acao={excluirEmpresa.bind(null, id)}
              mensagem="Excluir esta empresa e tudo ligado a ela (contatos, oportunidades, tarefas, propostas)?"
            >
              Excluir
            </BotaoConfirmar>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Cartao>
            <TituloCartao>Dados da empresa</TituloCartao>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Info rotulo="Segmento" valor={empresa.segmento} />
              <Info rotulo="CNAE" valor={empresa.cnae} />
              <Info rotulo="Grau de risco" valor={empresa.grauRisco ? `GR ${empresa.grauRisco}` : null} />
              <Info rotulo="Funcionários" valor={empresa.numFuncionarios?.toString()} />
              <Info
                rotulo="Telefone"
                valor={
                  empresa.telefone && (
                    <span className="flex items-center gap-2">
                      {empresa.telefone}
                      {zap && (
                        <a href={zap} target="_blank" className="text-xs font-medium text-emerald-700 hover:underline">
                          WhatsApp
                        </a>
                      )}
                    </span>
                  )
                }
              />
              <Info
                rotulo="E-mail"
                valor={empresa.email && <a href={`mailto:${empresa.email}`} className="hover:underline">{empresa.email}</a>}
              />
              <Info rotulo="Endereço" valor={empresa.endereco} />
              <Info rotulo="Cidade" valor={empresa.cidade ? `${empresa.cidade}${empresa.uf ? `/${empresa.uf}` : ""}` : null} />
              <Info rotulo="Origem" valor={empresa.origem} />
              <Info rotulo="Cadastrada em" valor={formatarData(empresa.criadoEm)} />
            </dl>
            {empresa.observacoes && (
              <p className="mt-4 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {empresa.observacoes}
              </p>
            )}
          </Cartao>

          <Cartao>
            <TituloCartao
              acao={
                <BotaoLink href={`/funil/nova?empresa=${id}`} variante="fantasma" className="text-xs">
                  + Oportunidade
                </BotaoLink>
              }
            >
              Oportunidades
            </TituloCartao>
            {listaOportunidades.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma oportunidade com esta empresa.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {listaOportunidades.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <Link href={`/funil/${o.id}`} className="text-sm font-medium text-slate-900 hover:text-marca-700">
                        {o.titulo}
                      </Link>
                      <p className="text-xs text-slate-500">
                        {nomeEtapa(o.etapa)}
                        {o.previsaoFechamento ? ` · previsão ${formatarData(o.previsaoFechamento)}` : ""}
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{formatarMoeda(o.valor)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>

          {/* @secoes-relacionadas */}

          <Cartao>
            <TituloCartao>Tarefas pendentes</TituloCartao>
            {listaTarefas.length === 0 ? (
              <p className="mb-2 text-sm text-slate-500">Nenhuma tarefa pendente.</p>
            ) : (
              <ListaTarefas itens={listaTarefas} mostrarEmpresa={false} />
            )}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-marca-700">+ Agendar follow-up</summary>
              <div className="mt-3">
                <NovaTarefa empresaId={id} />
              </div>
            </details>
          </Cartao>

          <Cartao>
            <TituloCartao>Histórico de interações</TituloCartao>
            <Formulario acao={criarNota.bind(null, id)} textoBotao="Registrar" limparAoSalvar>
              <textarea
                name="texto"
                rows={2}
                required
                placeholder="Ex.: Liguei para o RH, pediram proposta de PGR + PCMSO até sexta."
                className="campo"
              />
            </Formulario>
            <ol className="mt-5 space-y-4 border-l-2 border-slate-100 pl-4">
              {listaNotas.length === 0 && <li className="text-sm text-slate-500">Nenhuma interação registrada.</li>}
              {listaNotas.map((n) => (
                <li key={n.id} className="group relative">
                  <span className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-marca-500" />
                  <p className="text-xs text-slate-500">{formatarDataHora(n.criadoEm)}</p>
                  <p className="whitespace-pre-line text-sm text-slate-800">{n.texto}</p>
                  <form action={excluirNota.bind(null, id, n.id)}>
                    <button className="text-xs text-slate-400 opacity-0 transition hover:text-rose-600 group-hover:opacity-100">
                      remover
                    </button>
                  </form>
                </li>
              ))}
            </ol>
          </Cartao>
        </div>

        <div className="space-y-6">
          <Cartao>
            <TituloCartao>Contatos</TituloCartao>
            <ul className="space-y-3">
              {listaContatos.length === 0 && <li className="text-sm text-slate-500">Nenhum contato ainda.</li>}
              {listaContatos.map((c) => {
                const zapContato = linkWhatsapp(c.telefone);
                return (
                  <li key={c.id} className="rounded-lg border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {c.nome}{" "}
                          {c.principal && <Selo classe="bg-marca-100 text-marca-700">principal</Selo>}
                        </p>
                        {c.cargo && <p className="text-xs text-slate-500">{c.cargo}</p>}
                      </div>
                      <div className="flex gap-1">
                        {!c.principal && (
                          <form action={tornarPrincipal.bind(null, id, c.id)}>
                            <button title="Tornar principal" className="rounded p-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                              ★
                            </button>
                          </form>
                        )}
                        <form action={excluirContato.bind(null, id, c.id)}>
                          <button title="Remover" className="rounded p-1 text-xs text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                            ✕
                          </button>
                        </form>
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                      {c.telefone && (
                        <p>
                          {c.telefone}{" "}
                          {zapContato && (
                            <a href={zapContato} target="_blank" className="font-medium text-emerald-700 hover:underline">
                              WhatsApp
                            </a>
                          )}
                        </p>
                      )}
                      {c.email && (
                        <p>
                          <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-marca-700">+ Adicionar contato</summary>
              <Formulario acao={criarContato.bind(null, id)} textoBotao="Adicionar" limparAoSalvar className="mt-3">
                <div className="space-y-3">
                  <input name="nome" required placeholder="Nome *" className="campo" />
                  <input name="cargo" placeholder="Cargo (ex.: RH, Técnico de Segurança)" className="campo" />
                  <input name="telefone" placeholder="Telefone / WhatsApp" className="campo" />
                  <input name="email" type="email" placeholder="E-mail" className="campo" />
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" name="principal" /> Contato principal
                  </label>
                </div>
              </Formulario>
            </details>
          </Cartao>
        </div>
      </div>
    </>
  );
}

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{rotulo}</dt>
      <dd className="text-slate-900">{valor || "—"}</dd>
    </div>
  );
}
