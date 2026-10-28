import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { BotaoLink, Cabecalho, Cartao } from "@/components/ui";
import { numeroProposta } from "@/lib/propostas";
import { EditorProposta } from "../../editor-proposta";
import { salvarProposta } from "../../actions";
import { carregarProposta } from "../../carregar";
import { opcoesEditor } from "../../opcoes-editor";

export const metadata: Metadata = { title: "Editar proposta" };

export default async function EditarPropostaPage({ params }: PageProps<"/propostas/[id]/editar">) {
  await connection();
  const id = Number((await params).id);
  const dados = carregarProposta(id);
  if (!dados) notFound();
  const { proposta, itens } = dados;

  return (
    <div className="max-w-4xl">
      <Cabecalho
        titulo={`Editar proposta ${numeroProposta(id, proposta.criadoEm)}`}
        acoes={<BotaoLink href={`/propostas/${id}`} variante="secundario">Voltar</BotaoLink>}
      />
      <Cartao>
        <EditorProposta
          acao={salvarProposta.bind(null, id)}
          {...opcoesEditor()}
          inicial={{
            ...proposta,
            itens: itens.map(({ servicoId, descricao, quantidade, valorUnitario }) => ({
              servicoId,
              descricao,
              quantidade,
              valorUnitario,
            })),
          }}
        />
      </Cartao>
    </div>
  );
}
