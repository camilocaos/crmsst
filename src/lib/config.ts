import "server-only";
import { db } from "@/db";
import { configuracoes } from "@/db/schema";
import { MARGEM_MEDICOES_PADRAO } from "@/lib/propostas";

export type Config = {
  nomeEmpresa: string;
  cnpjEmpresa: string;
  telefoneEmpresa: string;
  emailEmpresa: string;
  enderecoEmpresa: string;
  metaMensal: number;
  validadePropostaDias: number;
  condicoesPagamento: string;
  /** R$ somados ao custo do fornecedor em cada medição. */
  margemMedicoes: number;
};

export function lerConfig(): Config {
  const mapa = new Map(db.select().from(configuracoes).all().map((c) => [c.chave, c.valor]));
  return {
    nomeEmpresa: mapa.get("nome_empresa") ?? "Minha Empresa de SST",
    cnpjEmpresa: mapa.get("empresa_cnpj") ?? "",
    telefoneEmpresa: mapa.get("empresa_telefone") ?? "",
    emailEmpresa: mapa.get("empresa_email") ?? "",
    enderecoEmpresa: mapa.get("empresa_endereco") ?? "",
    metaMensal: Number(mapa.get("meta_mensal") ?? 0) || 0,
    validadePropostaDias: Number(mapa.get("validade_proposta_dias") ?? 15) || 15,
    condicoesPagamento: mapa.get("condicoes_pagamento") ?? "",
    margemMedicoes: mapa.has("margem_medicoes") ? Number(mapa.get("margem_medicoes")) || 0 : MARGEM_MEDICOES_PADRAO,
  };
}

export function salvarConfig(valores: Record<string, string>) {
  db.transaction((tx) => {
    for (const [chave, valor] of Object.entries(valores)) {
      tx.insert(configuracoes)
        .values({ chave, valor })
        .onConflictDoUpdate({ target: configuracoes.chave, set: { valor } })
        .run();
    }
  });
}
