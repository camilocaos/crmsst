"use client";

import { useState } from "react";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { ETAPAS } from "@/lib/constantes";
import type { EstadoForm } from "@/lib/form";
import type { Oportunidade } from "@/db/schema";

type OpcaoEmpresa = { id: number; nome: string };
type OpcaoContato = { id: number; nome: string; empresaId: number };

export function FormOportunidade({
  acao,
  empresas,
  contatos,
  oportunidade,
  empresaInicial,
}: {
  acao: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  empresas: OpcaoEmpresa[];
  contatos: OpcaoContato[];
  oportunidade?: Oportunidade;
  empresaInicial?: number;
}) {
  const [empresaId, setEmpresaId] = useState<number | "">(oportunidade?.empresaId ?? empresaInicial ?? "");
  const [etapa, setEtapa] = useState(oportunidade?.etapa ?? "prospeccao");
  const contatosDaEmpresa = contatos.filter((c) => c.empresaId === empresaId);

  return (
    <Formulario acao={acao} textoBotao={oportunidade ? "Salvar alterações" : "Criar oportunidade"}>
      <div className="grid gap-4 md:grid-cols-2">
        <Campo rotulo="Título *" className="md:col-span-2">
          <input
            name="titulo"
            required
            defaultValue={oportunidade?.titulo}
            placeholder="Ex.: PGR + PCMSO anual"
            className="campo"
          />
        </Campo>
        <Campo rotulo="Empresa *">
          <select
            name="empresaId"
            required
            value={empresaId}
            onChange={(e) => setEmpresaId(e.target.value ? Number(e.target.value) : "")}
            className="campo"
          >
            <option value="">Selecione</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Contato">
          <select name="contatoId" defaultValue={oportunidade?.contatoId ?? ""} key={empresaId} className="campo">
            <option value="">—</option>
            {contatosDaEmpresa.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Valor (R$)">
          <input
            name="valor"
            type="number"
            min={0}
            step="0.01"
            defaultValue={oportunidade?.valor ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Previsão de fechamento">
          <input
            name="previsaoFechamento"
            type="date"
            defaultValue={oportunidade?.previsaoFechamento ?? ""}
            className="campo"
          />
        </Campo>
        <Campo rotulo="Etapa">
          <select name="etapa" value={etapa} onChange={(e) => setEtapa(e.target.value)} className="campo">
            {ETAPAS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Probabilidade (%)">
          <input
            name="probabilidade"
            type="number"
            min={0}
            max={100}
            defaultValue={oportunidade?.probabilidade ?? ""}
            placeholder="Automática pela etapa"
            className="campo"
          />
        </Campo>
        {etapa === "perdido" && (
          <Campo rotulo="Motivo da perda" className="md:col-span-2">
            <input
              name="motivoPerda"
              defaultValue={oportunidade?.motivoPerda ?? ""}
              placeholder="Preço, concorrente, sem resposta..."
              className="campo"
            />
          </Campo>
        )}
        <Campo rotulo="Observações" className="md:col-span-2">
          <textarea name="observacoes" rows={3} defaultValue={oportunidade?.observacoes ?? ""} className="campo" />
        </Campo>
      </div>
    </Formulario>
  );
}
