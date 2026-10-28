import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { empresas } from "@/db/schema";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { FormEmpresa } from "../../form-empresa";
import { atualizarEmpresa } from "../../actions";

export const metadata: Metadata = { title: "Editar empresa" };

export default async function EditarEmpresaPage({ params }: PageProps<"/empresas/[id]/editar">) {
  await connection();
  const id = Number((await params).id);
  const empresa = db.select().from(empresas).where(eq(empresas.id, id)).get();
  if (!empresa) notFound();

  return (
    <div className="max-w-3xl">
      <Cabecalho
        titulo="Editar empresa"
        subtitulo={empresa.razaoSocial}
        acoes={<BotaoLink href={`/empresas/${id}`} variante="secundario">Voltar</BotaoLink>}
      />
      <Cartao>
        <FormEmpresa acao={atualizarEmpresa.bind(null, id)} empresa={empresa} />
      </Cartao>
    </div>
  );
}
