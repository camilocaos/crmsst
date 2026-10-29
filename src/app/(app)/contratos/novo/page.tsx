import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contratos, empresas, propostas } from "@/db/schema";
import { BotaoEnviar } from "@/components/formulario";
import { BotaoLink, Cabecalho, Tabela, Td, Th, Vazio } from "@/components/ui";
import { formatarData } from "@/lib/formato";
import { numeroProposta } from "@/lib/propostas";
import { contratoDaProposta } from "../actions";

export const metadata: Metadata = { title: "Novo contrato" };

/** Escolhe a proposta de onde sai o contrato. */
export default async function NovoContratoPage() {
  await connection();
  const lista = db
    .select({
      id: propostas.id,
      criadoEm: propostas.criadoEm,
      empresa: sql<string>`coalesce(${empresas.nomeFantasia}, ${empresas.razaoSocial})`,
    })
    .from(propostas)
    .innerJoin(empresas, eq(empresas.id, propostas.empresaId))
    .where(eq(propostas.status, "aceita"))
    .orderBy(desc(propostas.id))
    .all();
  const comContrato = new Set(
    db.selectDistinct({ id: contratos.propostaId }).from(contratos).all().map((c) => c.id),
  );

  return (
    <>
      <Cabecalho titulo="Novo contrato" subtitulo="Propostas aceitas" acoes={<BotaoLink href="/contratos" variante="secundario">Voltar</BotaoLink>} />
      {lista.length === 0 ? (
        <Vazio>
          Nenhuma proposta aceita.{" "}
          <Link href="/propostas" className="font-semibold text-marca-700 hover:underline">
            Ver propostas
          </Link>
        </Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th className="hidden md:table-cell">Proposta</Th>
              <Th className="hidden md:table-cell">Data</Th>
              <Th className="text-right">{""}</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <Td className="font-medium text-slate-900">{p.empresa}</Td>
                <Td className="hidden md:table-cell">
                  <Link href={`/propostas/${p.id}`} className="text-slate-600 hover:underline">
                    Nº {numeroProposta(p.id, p.criadoEm)}
                  </Link>
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">{formatarData(p.criadoEm)}</Td>
                <Td className="text-right">
                  <form action={contratoDaProposta.bind(null, p.id)} className="inline">
                    <BotaoEnviar className="whitespace-nowrap">
                      {comContrato.has(p.id) ? "Abrir contrato" : "Gerar contrato"}
                    </BotaoEnviar>
                  </form>
                </Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
