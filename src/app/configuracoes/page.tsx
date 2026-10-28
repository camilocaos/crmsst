import type { Metadata } from "next";
import { connection } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Cabecalho, Campo, Cartao } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { lerConfig, salvarConfig } from "@/lib/config";
import { lerForm, numeroOpcional, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";

export const metadata: Metadata = { title: "Configurações" };

async function salvar(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  "use server";
  const r = lerForm(
    formData,
    z.object({
      nomeEmpresa: textoObrigatorio("Nome da empresa"),
      metaMensal: numeroOpcional,
      validadePropostaDias: numeroOpcional,
      condicoesPagamento: textoOpcional,
    }),
  );
  if (!r.valido) return { erro: r.erro };
  salvarConfig({
    nome_empresa: r.dados.nomeEmpresa,
    meta_mensal: String(r.dados.metaMensal ?? 0),
    validade_proposta_dias: String(Math.max(1, Math.trunc(r.dados.validadePropostaDias ?? 15))),
    condicoes_pagamento: r.dados.condicoesPagamento ?? "",
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export default async function ConfiguracoesPage() {
  await connection();
  const config = lerConfig();
  return (
    <div className="max-w-2xl">
      <Cabecalho titulo="Configurações" subtitulo="Dados usados nas propostas e no dashboard." />
      <Cartao>
        <Formulario acao={salvar}>
          <div className="grid gap-4 md:grid-cols-2">
            <Campo rotulo="Nome da sua empresa (aparece nas propostas)" className="md:col-span-2">
              <input name="nomeEmpresa" required defaultValue={config.nomeEmpresa} className="campo" />
            </Campo>
            <Campo rotulo="Meta de vendas mensal (R$)">
              <input name="metaMensal" type="number" min={0} step="100" defaultValue={config.metaMensal} className="campo" />
            </Campo>
            <Campo rotulo="Validade padrão das propostas (dias)">
              <input
                name="validadePropostaDias"
                type="number"
                min={1}
                defaultValue={config.validadePropostaDias}
                className="campo"
              />
            </Campo>
            <Campo rotulo="Condições de pagamento padrão" className="md:col-span-2">
              <textarea name="condicoesPagamento" rows={3} defaultValue={config.condicoesPagamento} className="campo" />
            </Campo>
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}
