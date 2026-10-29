import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contratos, empresas, propostas } from "@/db/schema";
import { Cabecalho, Selo, Tabela, Td, Th, Vazio } from "@/components/ui";
import { AREAS, STATUS_CONTRATO } from "@/lib/constantes";
import { formatarData } from "@/lib/formato";
import { numeroProposta } from "@/lib/propostas";

export const metadata: Metadata = { title: "Contratos" };

export default async function ContratosPage() {
  await connection();
  const lista = db
    .select({
      id: contratos.id,
      area: contratos.area,
      tipo: contratos.tipo,
      status: contratos.status,
      criadoEm: contratos.criadoEm,
      propostaId: propostas.id,
      propostaCriada: propostas.criadoEm,
      empresaId: empresas.id,
      empresa: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
    })
    .from(contratos)
    .innerJoin(propostas, eq(propostas.id, contratos.propostaId))
    .innerJoin(empresas, eq(empresas.id, propostas.empresaId))
    .orderBy(desc(contratos.id))
    .all();

  return (
    <>
      <Cabecalho
        titulo="Contratos"
      />
      {lista.length === 0 ? (
        <Vazio>Nenhum contrato ainda.</Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th>Unidade</Th>
              <Th className="hidden md:table-cell">Tipo</Th>
              <Th className="hidden md:table-cell">Proposta</Th>
              <Th className="hidden md:table-cell">Criado</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/contratos/${c.id}`} className="font-medium text-slate-900 hover:text-marca-700">
                    {c.empresa}
                  </Link>
                </Td>
                <Td>
                  <Selo classe={AREAS[c.area].classe}>{AREAS[c.area].curto}</Selo>
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">{c.area === "saude" ? "Por demanda" : c.tipo === "mensalista" ? "Mensalista" : "Pontual"}</Td>
                <Td className="hidden md:table-cell">
                  <Link href={`/propostas/${c.propostaId}`} className="text-slate-600 hover:underline">
                    Nº {numeroProposta(c.propostaId, c.propostaCriada)}
                  </Link>
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">{formatarData(c.criadoEm)}</Td>
                <Td>
                  <Selo classe={STATUS_CONTRATO[c.status].classe}>{STATUS_CONTRATO[c.status].nome}</Selo>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
