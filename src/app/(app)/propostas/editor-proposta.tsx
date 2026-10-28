"use client";

import { useState } from "react";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { STATUS_PROPOSTA } from "@/lib/constantes";
import { formatarMoeda } from "@/lib/formato";
import { calcularTotais } from "@/lib/propostas";
import type { EstadoForm } from "@/lib/form";

type ServicoOpcao = { id: number; nome: string; categoria: string; precoBase: number; unidade: string; descricao: string | null };
type Item = { chave: number; servicoId: number | null; descricao: string; quantidade: number; valorUnitario: number };

export type DadosEditor = {
  empresaId: number | null;
  oportunidadeId: number | null;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  validade: string | null;
  desconto: number;
  condicoesPagamento: string | null;
  observacoes: string | null;
  itens: Omit<Item, "chave">[];
};

let proximaChave = 1;
const comChave = (i: Omit<Item, "chave">): Item => ({ ...i, chave: proximaChave++ });

export function EditorProposta({
  acao,
  inicial,
  empresas,
  oportunidades,
  servicos,
}: {
  acao: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  inicial: DadosEditor;
  empresas: { id: number; nome: string }[];
  oportunidades: { id: number; titulo: string; empresaId: number }[];
  servicos: ServicoOpcao[];
}) {
  const [empresaId, setEmpresaId] = useState<number | "">(inicial.empresaId ?? "");
  const [itens, setItens] = useState<Item[]>(() => inicial.itens.map(comChave));
  const [desconto, setDesconto] = useState(inicial.desconto);
  const [servicoEscolhido, setServicoEscolhido] = useState("");

  const opsDaEmpresa = oportunidades.filter((o) => o.empresaId === empresaId);
  const { subtotal, valorDesconto, total } = calcularTotais(itens, desconto);
  const categorias = [...new Set(servicos.map((s) => s.categoria))];

  function adicionarServico(id: string) {
    const s = servicos.find((x) => x.id === Number(id));
    if (!s) return;
    setItens((atual) => [
      ...atual,
      comChave({ servicoId: s.id, descricao: `${s.nome} (${s.unidade})`, quantidade: 1, valorUnitario: s.precoBase }),
    ]);
    setServicoEscolhido("");
  }

  function alterar(chave: number, campo: keyof Item, valor: string) {
    setItens((atual) =>
      atual.map((i) =>
        i.chave === chave ? { ...i, [campo]: campo === "descricao" ? valor : Number(valor) || 0 } : i,
      ),
    );
  }

  return (
    <Formulario acao={acao} textoBotao="Salvar proposta">
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          itens.map((i) => ({
            servicoId: i.servicoId,
            descricao: i.descricao,
            quantidade: i.quantidade,
            valorUnitario: i.valorUnitario,
          })),
        )}
      />
      <div className="grid gap-4 md:grid-cols-2">
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
        <Campo rotulo="Oportunidade ligada">
          <select name="oportunidadeId" defaultValue={inicial.oportunidadeId ?? ""} key={empresaId} className="campo">
            <option value="">—</option>
            {opsDaEmpresa.map((o) => (
              <option key={o.id} value={o.id}>
                {o.titulo}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800">Itens da proposta</h3>
          <div className="flex gap-2">
            <select
              value={servicoEscolhido}
              onChange={(e) => adicionarServico(e.target.value)}
              className="campo w-auto max-w-xs"
            >
              <option value="">+ Adicionar serviço do catálogo</option>
              {categorias.map((c) => (
                <optgroup key={c} label={c}>
                  {servicos
                    .filter((s) => s.categoria === c)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} — {formatarMoeda(s.precoBase)}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              onClick={() =>
                setItens((a) => [...a, comChave({ servicoId: null, descricao: "", quantidade: 1, valorUnitario: 0 })])
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              + Item livre
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Descrição</th>
                <th className="w-24 px-3 py-2 text-right font-medium">Qtd.</th>
                <th className="w-36 px-3 py-2 text-right font-medium">Valor unit.</th>
                <th className="w-32 px-3 py-2 text-right font-medium">Total</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {itens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    Escolha serviços do catálogo acima para montar a proposta.
                  </td>
                </tr>
              )}
              {itens.map((i) => (
                <tr key={i.chave} className="border-t border-slate-100">
                  <td className="px-2 py-1.5">
                    <input
                      value={i.descricao}
                      onChange={(e) => alterar(i.chave, "descricao", e.target.value)}
                      placeholder="Descrição"
                      className="campo"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={i.quantidade}
                      onChange={(e) => alterar(i.chave, "quantidade", e.target.value)}
                      className="campo text-right"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={i.valorUnitario}
                      onChange={(e) => alterar(i.chave, "valorUnitario", e.target.value)}
                      className="campo text-right"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {formatarMoeda(i.quantidade * i.valorUnitario)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => setItens((a) => a.filter((x) => x.chave !== i.chave))}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Remover item"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col items-end gap-1 text-sm">
          <p className="text-slate-600">
            Subtotal: <span className="font-medium tabular-nums text-slate-900">{formatarMoeda(subtotal)}</span>
          </p>
          <label className="flex items-center gap-2 text-slate-600">
            Desconto (%)
            <input
              name="desconto"
              type="number"
              min={0}
              max={100}
              step="0.5"
              value={desconto}
              onChange={(e) => setDesconto(Number(e.target.value) || 0)}
              className="campo w-24 text-right"
            />
            <span className="w-28 text-right tabular-nums">− {formatarMoeda(valorDesconto)}</span>
          </label>
          <p className="text-base font-semibold text-slate-900">
            Total: <span className="tabular-nums">{formatarMoeda(total)}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Campo rotulo="Status">
          <select name="status" defaultValue={inicial.status} className="campo">
            {Object.entries(STATUS_PROPOSTA).map(([id, s]) => (
              <option key={id} value={id}>
                {s.nome}
              </option>
            ))}
          </select>
        </Campo>
        <Campo rotulo="Válida até">
          <input name="validade" type="date" defaultValue={inicial.validade ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Condições de pagamento" className="md:col-span-2">
          <textarea name="condicoesPagamento" rows={2} defaultValue={inicial.condicoesPagamento ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Observações (aparecem na proposta)" className="md:col-span-2">
          <textarea
            name="observacoes"
            rows={3}
            defaultValue={inicial.observacoes ?? ""}
            placeholder="Ex.: Prazo de entrega do PGR em até 20 dias após a visita técnica."
            className="campo"
          />
        </Campo>
      </div>
    </Formulario>
  );
}
