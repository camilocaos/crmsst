import type { Metadata } from "next";
import { connection } from "next/server";
import { BotaoLink, Cabecalho, Cartao, Vazio } from "@/components/ui";
import { FormOportunidade } from "../form-oportunidade";
import { criarOportunidade } from "../actions";
import { opcoesEmpresasEContatos } from "../opcoes";

export const metadata: Metadata = { title: "Nova oportunidade" };

export default async function NovaOportunidadePage({ searchParams }: PageProps<"/funil/nova">) {
  await connection();
  const { empresa } = await searchParams;
  const opcoes = opcoesEmpresasEContatos();

  return (
    <div className="max-w-3xl">
      <Cabecalho
        titulo="Nova oportunidade"
        acoes={<BotaoLink href="/funil" variante="secundario">Voltar</BotaoLink>}
      />
      {opcoes.empresas.length === 0 ? (
        <Vazio>
          Cadastre uma empresa antes de criar oportunidades.{" "}
          <BotaoLink href="/empresas/nova" variante="fantasma">Cadastrar empresa</BotaoLink>
        </Vazio>
      ) : (
        <Cartao>
          <FormOportunidade
            acao={criarOportunidade}
            {...opcoes}
            empresaInicial={typeof empresa === "string" ? Number(empresa) : undefined}
          />
        </Cartao>
      )}
    </div>
  );
}
