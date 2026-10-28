import type { Metadata } from "next";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { oportunidades } from "@/db/schema";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { lerConfig } from "@/lib/config";
import { hoje, somarDias } from "@/lib/formato";
import { EditorProposta } from "../editor-proposta";
import { salvarProposta } from "../actions";
import { opcoesEditor } from "../opcoes-editor";

export const metadata: Metadata = { title: "Nova proposta" };

export default async function NovaPropostaPage({ searchParams }: PageProps<"/propostas/nova">) {
  await connection();
  const { oportunidade, empresa } = await searchParams;
  const config = lerConfig();
  const opcoes = opcoesEditor();

  const op =
    typeof oportunidade === "string"
      ? db.select().from(oportunidades).where(eq(oportunidades.id, Number(oportunidade))).get()
      : undefined;
  const empresaId = op?.empresaId ?? (typeof empresa === "string" ? Number(empresa) : null);

  return (
    <div className="max-w-4xl">
      <Cabecalho
        titulo="Nova proposta"
        subtitulo={op ? `Para a oportunidade "${op.titulo}"` : undefined}
        acoes={<BotaoLink href="/propostas" variante="secundario">Voltar</BotaoLink>}
      />
      {opcoes.empresas.length === 0 ? (
        <Vazio>
          Cadastre uma empresa antes de criar propostas.{" "}
          <BotaoLink href="/empresas/nova" variante="fantasma">Cadastrar empresa</BotaoLink>
        </Vazio>
      ) : (
        <Cartao>
          <EditorProposta
            acao={salvarProposta.bind(null, null)}
            {...opcoes}
            inicial={{
              empresaId,
              oportunidadeId: op?.id ?? null,
              status: "rascunho",
              validade: somarDias(hoje(), config.validadePropostaDias),
              desconto: 0,
              condicoesPagamento: config.condicoesPagamento,
              observacoes: null,
              itens: [],
            }}
          />
        </Cartao>
      )}
    </div>
  );
}
