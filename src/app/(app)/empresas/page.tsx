import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { and, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { contatos, empresas, oportunidades } from "@/db/schema";
import { BotaoLink, Cabecalho, Selo, Tabela, Td, Th, Vazio } from "@/components/ui";
import { ETAPAS_ABERTAS, STATUS_EMPRESA } from "@/lib/constantes";
import { formatarCnpj, formatarMoeda } from "@/lib/formato";

export const metadata: Metadata = { title: "Empresas" };

export default async function EmpresasPage({ searchParams }: PageProps<"/empresas">) {
  await connection();
  const { q, status } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";
  const filtroStatus = typeof status === "string" && status in STATUS_EMPRESA ? status : "";

  const condicoes: SQL[] = [];
  if (busca) {
    const termo = `%${busca}%`;
    condicoes.push(
      or(
        like(empresas.razaoSocial, termo),
        like(empresas.nomeFantasia, termo),
        like(empresas.cnpj, `%${busca.replace(/\D/g, "") || busca}%`),
        like(empresas.cidade, termo),
      )!,
    );
  }
  if (filtroStatus) condicoes.push(eq(empresas.status, filtroStatus as "lead"));

  const empresasFiltradas = db
    .select()
    .from(empresas)
    .where(condicoes.length ? and(...condicoes) : undefined)
    .orderBy(desc(empresas.id))
    .all();

  // Valor em aberto e contato principal de cada empresa
  const emAbertoPorEmpresa = new Map(
    db
      .select({ empresaId: oportunidades.empresaId, total: sql<number>`sum(${oportunidades.valor})` })
      .from(oportunidades)
      .where(inArray(oportunidades.etapa, ETAPAS_ABERTAS))
      .groupBy(oportunidades.empresaId)
      .all()
      .map((r) => [r.empresaId, r.total]),
  );
  const contatoPorEmpresa = new Map<number, string>();
  for (const c of db.select().from(contatos).orderBy(desc(contatos.principal), contatos.id).all()) {
    if (!contatoPorEmpresa.has(c.empresaId)) contatoPorEmpresa.set(c.empresaId, c.nome);
  }

  const lista = empresasFiltradas.map((empresa) => ({
    empresa,
    contato: contatoPorEmpresa.get(empresa.id) ?? null,
    emAberto: emAbertoPorEmpresa.get(empresa.id) ?? 0,
  }));

  return (
    <>
      <Cabecalho
        titulo="Empresas"
        subtitulo={`${lista.length} ${lista.length === 1 ? "empresa" : "empresas"}`}
        acoes={<BotaoLink href="/empresas/nova">+ Nova empresa</BotaoLink>}
      />

      <form className="mb-4 flex flex-wrap gap-2">
        <input name="q" defaultValue={busca} placeholder="Buscar por nome, CNPJ ou cidade..." className="campo max-w-sm" />
        <select name="status" defaultValue={filtroStatus} className="campo w-auto">
          <option value="">Todos os status</option>
          <option value="lead">Leads</option>
          <option value="cliente">Clientes</option>
          <option value="inativo">Inativos</option>
        </select>
        <button className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Filtrar
        </button>
      </form>

      {lista.length === 0 ? (
        <Vazio>
          {busca || filtroStatus ? "Nenhuma empresa encontrada com esse filtro." : "Nenhuma empresa cadastrada ainda."}
        </Vazio>
      ) : (
        <Tabela>
          <thead>
            <tr>
              <Th>Empresa</Th>
              <Th className="hidden md:table-cell">Contato</Th>
              <Th className="hidden lg:table-cell">Cidade</Th>
              <Th className="hidden md:table-cell">Func. / GR</Th>
              <Th>Status</Th>
              <Th className="text-right">Em negociação</Th>
            </tr>
          </thead>
          <tbody>
            {lista.map(({ empresa: e, contato, emAberto }) => (
              <tr key={e.id} className="hover:bg-slate-50">
                <Td>
                  <Link href={`/empresas/${e.id}`} className="font-medium text-slate-900 hover:text-marca-700">
                    {e.nomeFantasia || e.razaoSocial}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {e.nomeFantasia ? e.razaoSocial : ""} {e.cnpj ? `· ${formatarCnpj(e.cnpj)}` : ""}
                  </p>
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">{contato ?? "—"}</Td>
                <Td className="hidden text-slate-600 lg:table-cell">
                  {e.cidade ? `${e.cidade}${e.uf ? `/${e.uf}` : ""}` : "—"}
                </Td>
                <Td className="hidden text-slate-600 md:table-cell">
                  {e.numFuncionarios ?? "—"} / {e.grauRisco ?? "—"}
                </Td>
                <Td>
                  <Selo classe={STATUS_EMPRESA[e.status].classe}>{STATUS_EMPRESA[e.status].nome}</Selo>
                </Td>
                <Td className="text-right font-medium tabular-nums">{emAberto ? formatarMoeda(emAberto) : "—"}</Td>
              </tr>
            ))}
          </tbody>
        </Tabela>
      )}
    </>
  );
}
