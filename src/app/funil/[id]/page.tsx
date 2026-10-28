import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { oportunidades } from "@/db/schema";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { BotaoConfirmar } from "@/components/formulario";
import { nomeEtapa } from "@/lib/constantes";
import { formatarData } from "@/lib/formato";
import { FormOportunidade } from "../form-oportunidade";
import { atualizarOportunidade, excluirOportunidade } from "../actions";
import { opcoesEmpresasEContatos } from "@/lib/opcoes";

export const metadata: Metadata = { title: "Oportunidade" };

export default async function OportunidadePage({ params }: PageProps<"/funil/[id]">) {
  await connection();
  const id = Number((await params).id);
  const oportunidade = db.select().from(oportunidades).where(eq(oportunidades.id, id)).get();
  if (!oportunidade) notFound();

  return (
    <div className="max-w-3xl">
      <Cabecalho
        titulo={oportunidade.titulo}
        subtitulo={`${nomeEtapa(oportunidade.etapa)} · criada em ${formatarData(oportunidade.criadoEm)}${
          oportunidade.fechadoEm ? ` · fechada em ${formatarData(oportunidade.fechadoEm)}` : ""
        }`}
        acoes={
          <>
            <BotaoLink href={`/propostas/nova?oportunidade=${id}`} variante="secundario">
              Gerar proposta
            </BotaoLink>
            <BotaoLink href="/funil" variante="secundario">
              Voltar
            </BotaoLink>
            <BotaoConfirmar acao={excluirOportunidade.bind(null, id)} mensagem="Excluir esta oportunidade?">
              Excluir
            </BotaoConfirmar>
          </>
        }
      />
      <Cartao>
        <FormOportunidade
          acao={atualizarOportunidade.bind(null, id)}
          oportunidade={oportunidade}
          {...opcoesEmpresasEContatos()}
        />
      </Cartao>
    </div>
  );
}
