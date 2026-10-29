import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { empresas, propostaItens, propostas } from "@/db/schema";
import { BotaoLink, Cabecalho, Selo, Tabela, Td, Th, Vazio } from "@/components/ui";
import { STATUS_PROPOSTA } from "@/lib/constantes";
import { formatarData, formatarMoeda, hoje } from "@/lib/formato";
import { numeroProposta } from "@/lib/propostas";

export const metadata: Metadata = { title: "Propostas" };

export default async function PropostasPage({ searchParams }: PageProps<"/propostas">) {
  await connection();
  const { status } = await searchParams;
  const filtro = typeof status === "string" && status in STATUS_PROPOSTA ? (status as keyof typeof STATUS_PROPOSTA) : null;

  const subtotais = new Map(
    db
      .select({
        propostaId: propostaItens.propostaId,
        subtotal: sql<number>`sum(${propostaItens.quantidade} * ${propostaItens.valorUnitario})`,
      })
      .from(propostaItens)
      // mesma regra de calcularTotais: exames (por demanda), inclusos e opcionais não somam
      .where(and(eq(propostaItens.cobranca, "fixo"), eq(propostaItens.incluso, false), eq(propostaItens.opcional, false)))
      .groupBy(propostaItens.propostaId)
      .all()
      .map((r) => [r.propostaId, r.subtotal]),
  );

  const lista = db
    .select({
      id: propostas.id,
      status: propostas.status,
      validade: propostas.validade,
      criadoEm: propostas.criadoEm,
      desconto: propostas.desconto,
      empresaId: propostas.empresaId,
      empresa: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
    })
    .from(propostas)
    .innerJoin(empresas, eq(empresas.id, propostas.empresaId))
    .where(filtro ? eq(propostas.status, filtro) : undefined)
    .orderBy(desc(propostas.id))
    .all()
    .map((p) => ({ ...p, total: (subtotais.get(p.id) ?? 0) * (1 - p.desconto / 100) }));

  const dataHoje = hoje();

  return (
    <>
      <Cabecalho
        titulo="Propostas"
        subtitulo={`${lista.length} propostas · ${formatarMoeda(lista.reduce((s, p) => s + p.total, 0))}`}
        acoes={<BotaoLink href="/propostas/nova">+ Nova proposta</BotaoLink>}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <FiltroLink href="/propostas" ativo={!filtro}>
          Todas
        </FiltroLink>
        {Object.entries(STATUS_PROPOSTA).map(([id, s]) => (
          <FiltroLink key={id} href={`/propostas?status=${id}`} ativo={filtro === id}>
            {s.nome}
          </FiltroLink>
        ))}
      </div>

      {lista.length === 0 ? (
        <Vazio>Nenhuma proposta {filtro ? "com esse status" : "criada ainda"}.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Nº</Th>
              <Th>Empresa</Th>
              <Th className="hidden md:table-cell">Criada</Th>
              <Th className="hidden md:table-cell">Validade</Th>
              <Th>Status</Th>
              <Th className="text-right">Total</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => {
              const vencida = p.status === "enviada" && p.validade && p.validade < dataHoje;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <Td>
                    <Link href={`/propostas/${p.id}`} className="font-medium text-slate-900 hover:text-marca-700">
                      {numeroProposta(p.id, p.criadoEm)}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/empresas/${p.empresaId}`} className="text-slate-700 hover:underline">
                      {p.empresa}
                    </Link>
                  </Td>
                  <Td className="hidden text-slate-600 md:table-cell">{formatarData(p.criadoEm)}</Td>
                  <Td className={`hidden md:table-cell ${vencida ? "font-medium text-rose-600" : "text-slate-600"}`}>
                    {formatarData(p.validade)}
                    {vencida ? " (vencida)" : ""}
                  </Td>
                  <Td>
                    <Selo classe={STATUS_PROPOSTA[p.status].classe}>{STATUS_PROPOSTA[p.status].nome}</Selo>
                  </Td>
                  <Td className="text-right font-semibold tabular-nums">{formatarMoeda(p.total)}</Td>
                </tr>
              );
            })}
          </tbody>
        </Tabela>
      )}
    </>
  );
}

function FiltroLink({ href, ativo, children }: { href: string; ativo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 ${
        ativo ? "bg-marca-600 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </Link>
  );
}
