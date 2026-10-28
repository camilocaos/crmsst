import Link from "next/link";
import { connection } from "next/server";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { empresas, oportunidades, propostas, tarefas } from "@/db/schema";
import { BotaoLink, Cabecalho, Cartao, TituloCartao } from "@/components/ui";
import { ETAPAS, ETAPAS_ABERTAS } from "@/lib/constantes";
import { lerConfig } from "@/lib/config";
import { formatarData, formatarMoeda, hoje, somarDias } from "@/lib/formato";
import { numeroProposta } from "@/lib/propostas";
import { buscarTarefas, pendentes } from "./tarefas/consultas";
import { ListaTarefas } from "./tarefas/lista-tarefas";

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

export default async function DashboardPage() {
  await connection();
  const config = lerConfig();
  const d = hoje();
  const inicioMes = `${d.slice(0, 7)}-01`;

  // Vendas ganhas por mês (últimos 6 meses, incluindo o atual)
  const [ano, mes] = d.split("-").map(Number);
  const meses = Array.from({ length: 6 }, (_, i) => {
    const data = new Date(ano, mes - 1 - (5 - i), 1);
    return { chave: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`, rotulo: MESES[data.getMonth()] };
  });
  const ganhosPorMes = new Map(
    db
      .select({ mes: sql<string>`substr(${oportunidades.fechadoEm}, 1, 7)`, total: sql<number>`sum(${oportunidades.valor})` })
      .from(oportunidades)
      .where(and(eq(oportunidades.etapa, "ganho"), gte(oportunidades.fechadoEm, `${meses[0].chave}-01`)))
      .groupBy(sql`substr(${oportunidades.fechadoEm}, 1, 7)`)
      .all()
      .map((r) => [r.mes, r.total]),
  );
  const serieMensal = meses.map((m) => ({ ...m, valor: ganhosPorMes.get(m.chave) ?? 0 }));
  const vendidoMes = serieMensal.at(-1)!.valor;

  const ganhasMes = db
    .select({ n: count() })
    .from(oportunidades)
    .where(and(eq(oportunidades.etapa, "ganho"), gte(oportunidades.fechadoEm, inicioMes)))
    .get()!.n;
  const perdidasMes = db
    .select({ n: count() })
    .from(oportunidades)
    .where(and(eq(oportunidades.etapa, "perdido"), gte(oportunidades.fechadoEm, inicioMes)))
    .get()!.n;
  const taxaConversao = ganhasMes + perdidasMes > 0 ? Math.round((ganhasMes / (ganhasMes + perdidasMes)) * 100) : null;

  // Funil em aberto por etapa
  const porEtapa = new Map(
    db
      .select({ etapa: oportunidades.etapa, n: count(), total: sql<number>`sum(${oportunidades.valor})` })
      .from(oportunidades)
      .groupBy(oportunidades.etapa)
      .all()
      .map((r) => [r.etapa, r]),
  );
  const funil = ETAPAS.filter((e) => ETAPAS_ABERTAS.includes(e.id)).map((e) => ({
    ...e,
    n: porEtapa.get(e.id)?.n ?? 0,
    total: porEtapa.get(e.id)?.total ?? 0,
  }));
  const totalFunil = funil.reduce((s, e) => s + e.total, 0);
  const maxFunil = Math.max(...funil.map((e) => e.total), 1);

  const leadsMes = db
    .select({ n: count() })
    .from(empresas)
    .where(gte(empresas.criadoEm, inicioMes))
    .get()!.n;

  const tarefasHoje = buscarTarefas(pendentes(lte(tarefas.vencimento, d))).slice(0, 8);
  const aguardando = db
    .select({
      id: propostas.id,
      criadoEm: propostas.criadoEm,
      validade: propostas.validade,
      empresa: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
    })
    .from(propostas)
    .innerJoin(empresas, eq(empresas.id, propostas.empresaId))
    .where(eq(propostas.status, "enviada"))
    .orderBy(desc(propostas.id))
    .limit(6)
    .all();
  const fechandoLogo = db
    .select({ id: oportunidades.id, titulo: oportunidades.titulo, valor: oportunidades.valor, previsao: oportunidades.previsaoFechamento })
    .from(oportunidades)
    .where(
      and(
        sql`${oportunidades.etapa} in ('negociacao', 'proposta')`,
        lte(oportunidades.previsaoFechamento, somarDias(d, 30)),
      ),
    )
    .orderBy(oportunidades.previsaoFechamento)
    .limit(5)
    .all();

  const meta = config.metaMensal;
  const pctMeta = meta > 0 ? Math.min(100, Math.round((vendidoMes / meta) * 100)) : 0;
  const maxMensal = Math.max(...serieMensal.map((m) => m.valor), meta, 1);

  return (
    <>
      <Cabecalho
        titulo="Dashboard"
        subtitulo={`Resumo de ${MESES[mes - 1]}/${ano}`}
        acoes={
          <>
            <BotaoLink href="/empresas/nova" variante="secundario">+ Empresa</BotaoLink>
            <BotaoLink href="/funil/nova">+ Oportunidade</BotaoLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Vendido no mês</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{formatarMoeda(vendidoMes)}</p>
          {meta > 0 ? (
            <>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" title={`${pctMeta}% da meta`}>
                <div className="h-full rounded-full bg-marca-500" style={{ width: `${pctMeta}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {pctMeta}% da meta de {formatarMoeda(meta)}
              </p>
            </>
          ) : (
            <Link href="/configuracoes" className="mt-2 block text-xs text-marca-700 hover:underline">Definir meta mensal</Link>
          )}
        </Cartao>
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Em negociação</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{formatarMoeda(totalFunil)}</p>
          <p className="mt-1.5 text-xs text-slate-500">{funil.reduce((s, e) => s + e.n, 0)} oportunidades abertas</p>
        </Cartao>
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Taxa de conversão no mês</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{taxaConversao === null ? "—" : `${taxaConversao}%`}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            {ganhasMes} ganhas · {perdidasMes} perdidas
          </p>
        </Cartao>
        <Cartao>
          <p className="text-xs font-medium text-slate-500">Novas empresas no mês</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{leadsMes}</p>
          <p className="mt-1.5 text-xs text-slate-500">
            {aguardando.length} propostas aguardando resposta
          </p>
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Cartao>
          <TituloCartao>Vendas ganhas por mês</TituloCartao>
          <div className="relative flex h-48 items-end gap-3 border-b border-slate-200 pt-6">
            {meta > 0 && (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-400"
                style={{ bottom: `${(meta / maxMensal) * 100}%` }}
              >
                <span className="absolute -top-5 right-0 text-[11px] text-slate-500">meta {formatarMoeda(meta)}</span>
              </div>
            )}
            {serieMensal.map((m) => (
              <div key={m.chave} className="group relative flex h-full flex-1 flex-col justify-end" title={`${m.rotulo}: ${formatarMoeda(m.valor)}`}>
                <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                  {formatarMoeda(m.valor)}
                </span>
                <div
                  className="mx-auto w-full max-w-10 rounded-t bg-marca-500 transition group-hover:bg-marca-600"
                  style={{ height: `${(m.valor / maxMensal) * 100}%`, minHeight: m.valor > 0 ? 4 : 0 }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-3">
            {serieMensal.map((m) => (
              <span key={m.chave} className="flex-1 text-center text-xs text-slate-500">
                {m.rotulo}
              </span>
            ))}
          </div>
        </Cartao>

        <Cartao>
          <TituloCartao acao={<Link href="/funil" className="text-xs text-marca-700 hover:underline">Abrir funil</Link>}>
            Funil em aberto
          </TituloCartao>
          <ul className="space-y-3">
            {funil.map((e) => (
              <li key={e.id} className="group" title={`${e.nome}: ${e.n} oportunidades, ${formatarMoeda(e.total)}`}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-700">
                    {e.nome} <span className="text-slate-400">({e.n})</span>
                  </span>
                  <span className="font-medium tabular-nums text-slate-800">{formatarMoeda(e.total)}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-marca-500 transition group-hover:bg-marca-600"
                    style={{ width: `${(e.total / maxFunil) * 100}%`, minWidth: e.total > 0 ? 4 : 0 }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Cartao>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Cartao className="xl:col-span-1">
          <TituloCartao acao={<Link href="/tarefas" className="text-xs text-marca-700 hover:underline">Ver todas</Link>}>
            Para hoje e atrasadas
          </TituloCartao>
          {tarefasHoje.length === 0 ? (
            <p className="text-sm text-slate-500">Nada pendente para hoje.</p>
          ) : (
            <ListaTarefas itens={tarefasHoje} />
          )}
        </Cartao>
        <Cartao>
          <TituloCartao acao={<Link href="/propostas?status=enviada" className="text-xs text-marca-700 hover:underline">Ver todas</Link>}>
            Propostas aguardando resposta
          </TituloCartao>
          {aguardando.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma proposta enviada em aberto.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {aguardando.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <Link href={`/propostas/${p.id}`} className="font-medium text-slate-900 hover:text-marca-700">
                    {p.empresa}
                  </Link>
                  <span className={`text-xs ${p.validade && p.validade < d ? "font-medium text-rose-600" : "text-slate-500"}`}>
                    Nº {numeroProposta(p.id, p.criadoEm)} · até {formatarData(p.validade)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
        <Cartao>
          <TituloCartao>Fechamentos previstos (30 dias)</TituloCartao>
          {fechandoLogo.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma oportunidade em proposta/negociação com previsão para os próximos 30 dias.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {fechandoLogo.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <Link href={`/funil/${o.id}`} className="font-medium text-slate-900 hover:text-marca-700">
                      {o.titulo}
                    </Link>
                    <p className={`text-xs ${o.previsao && o.previsao < d ? "text-rose-600" : "text-slate-500"}`}>
                      {formatarData(o.previsao)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatarMoeda(o.valor)}</span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>
    </>
  );
}
