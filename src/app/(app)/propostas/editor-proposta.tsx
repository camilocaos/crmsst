"use client";

import { useState } from "react";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { STATUS_PROPOSTA } from "@/lib/constantes";
import { formatarMoeda } from "@/lib/formato";
import { CATEGORIA_MEDICOES, NATUREZAS, NOME_DESLOCAMENTO, calcularTotais } from "@/lib/propostas";
import type { EstadoForm } from "@/lib/form";

type Area = "seguranca" | "saude";
type Cobranca = "fixo" | "por_demanda";

type ServicoOpcao = {
  id: number;
  nome: string;
  categoria: string;
  precoBase: number;
  unidade: string;
  descricao: string | null;
  area: Area;
  cobranca: Cobranca;
};

export type ItemEditor = {
  servicoId: number | null;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  area: Area;
  cobranca: Cobranca;
  natureza: string | null;
  periodo: string | null;
  detalhe: string | null;
  incluso: boolean;
  opcional: boolean;
};
type Item = ItemEditor & { chave: number };

export type DadosEditor = {
  empresaId: number | null;
  oportunidadeId: number | null;
  status: "rascunho" | "enviada" | "aceita" | "recusada";
  validade: string | null;
  desconto: number;
  condicoesPagamento: string | null;
  prazoEntrega: string | null;
  mostrarMedicoes: boolean;
  observacoes: string | null;
  itens: ItemEditor[];
};

let proximaChave = 1;
const comChave = (i: ItemEditor): Item => ({ ...i, chave: proximaChave++ });

/** Item novo a partir do catálogo, já com as regras da CUIDI. */
function itemDoServico(s: ServicoOpcao): ItemEditor {
  const demanda = s.cobranca === "por_demanda";
  return {
    servicoId: s.id,
    descricao: s.nome,
    quantidade: 1,
    valorUnitario: s.precoBase,
    area: s.area,
    cobranca: s.cobranca,
    natureza: !demanda && s.categoria === "Programas e laudos" ? "Elaboração" : null,
    periodo: null,
    detalhe: s.descricao,
    incluso: false,
    opcional: !demanda && s.nome.startsWith("AET"), // AET normalmente depende da AEP
  };
}

const botaoSec = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50";

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

  const opsDaEmpresa = oportunidades.filter((o) => o.empresaId === empresaId);
  const { subtotal, valorDesconto, total } = calcularTotais(itens, desconto);
  const daSeguranca = itens.filter((i) => i.cobranca === "fixo");
  const exames = itens.filter((i) => i.cobranca === "por_demanda");
  const servicosFixos = servicos.filter((s) => s.cobranca === "fixo");
  const servicosExames = servicos.filter((s) => s.cobranca === "por_demanda");

  const adicionar = (novos: ItemEditor[]) => setItens((a) => [...a, ...novos.map(comChave)]);
  const alterar = (chave: number, mudanca: Partial<ItemEditor>) =>
    setItens((a) => a.map((i) => (i.chave === chave ? { ...i, ...mudanca } : i)));
  const remover = (chave: number) => setItens((a) => a.filter((i) => i.chave !== chave));

  function adicionarTabelaClinica() {
    const ja = new Set(exames.map((e) => e.servicoId));
    adicionar(servicosExames.filter((s) => !ja.has(s.id)).map(itemDoServico));
    document.getElementById("exames-por-demanda")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /** Medição contratada leva junto a taxa de deslocamento do fornecedor (uma vez só). */
  function adicionarServico(s: ServicoOpcao) {
    const novos = [itemDoServico(s)];
    const deslocamento = servicosFixos.find((x) => x.nome === NOME_DESLOCAMENTO);
    const jaTem = itens.some((i) => i.descricao === NOME_DESLOCAMENTO);
    if (s.categoria === CATEGORIA_MEDICOES && s.nome !== NOME_DESLOCAMENTO && deslocamento && !jaTem) novos.push(itemDoServico(deslocamento));
    adicionar(novos);
  }

  return (
    <Formulario acao={acao} textoBotao="Salvar proposta">
      <input type="hidden" name="itens" value={JSON.stringify(itens.map(({ chave: _c, ...i }) => i))} />

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

      {/* ---------- Segurança do Trabalho ---------- */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="border-l-4 border-[#8DC63F] pl-2 text-sm font-semibold text-marca-900">Serviços de Segurança do Trabalho</h3>
            <p className="mt-0.5 pl-3 text-xs text-slate-500">Programas, laudos, treinamentos, eSocial e medições contratadas. Somam no total.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SeletorServico
              servicos={servicosFixos}
              aoEscolher={adicionarServico}
              rotulo="+ Serviço do catálogo"
              extra={servicosExames.length ? { grupo: "Saúde Ocupacional", rotulo: "Realização dos exames ocupacionais — tabela da clínica, por demanda", aoEscolher: adicionarTabelaClinica } : undefined}
            />
            <button
              type="button"
              className={botaoSec}
              onClick={() =>
                adicionar([{ servicoId: null, descricao: "", quantidade: 1, valorUnitario: 0, area: "seguranca", cobranca: "fixo", natureza: null, periodo: null, detalhe: null, incluso: false, opcional: false }])
              }
            >
              + Item livre
            </button>
          </div>
        </div>

        {daSeguranca.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum serviço de Segurança. Adicione pelo catálogo acima.
          </p>
        ) : (
          <ul className="space-y-3">
            {daSeguranca.map((i) => (
              <li key={i.chave} className="rounded-lg border border-slate-200 p-3">
                <div className="grid gap-2 md:grid-cols-[1fr_9rem_5rem_8rem_7rem_2rem] md:items-center">
                  <input value={i.descricao} onChange={(e) => alterar(i.chave, { descricao: e.target.value })} placeholder="Serviço" className="campo font-semibold" />
                  <select value={i.natureza ?? ""} onChange={(e) => alterar(i.chave, { natureza: e.target.value || null })} className="campo" title="Natureza">
                    <option value="">Natureza —</option>
                    {NATUREZAS.map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                  <input type="number" min={0} step="any" value={i.quantidade} onChange={(e) => alterar(i.chave, { quantidade: Number(e.target.value) || 0 })} className="campo text-right" title="Quantidade" />
                  <input type="number" min={0} step="0.01" value={i.valorUnitario} onChange={(e) => alterar(i.chave, { valorUnitario: Number(e.target.value) || 0 })} className="campo text-right" title="Valor unitário" />
                  <span className={`text-right text-sm font-semibold tabular-nums ${i.incluso || i.opcional ? "text-slate-400" : ""}`}>
                    {i.incluso ? "Incluso" : i.opcional ? "Opcional" : formatarMoeda(i.quantidade * i.valorUnitario)}
                  </span>
                  <button type="button" onClick={() => remover(i.chave)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remover">
                    ✕
                  </button>
                </div>
                <div className="mt-2 grid gap-2 md:grid-cols-[1fr_16rem]">
                  <textarea
                    rows={2}
                    value={i.detalhe ?? ""}
                    onChange={(e) => alterar(i.chave, { detalhe: e.target.value || null })}
                    placeholder="O que é entregue (aparece na proposta e no contrato)"
                    className="campo text-xs"
                  />
                  <div className="space-y-2">
                    <input
                      value={i.periodo ?? ""}
                      onChange={(e) => alterar(i.chave, { periodo: e.target.value || null })}
                      placeholder="Período (ex.: outubro e novembro de 2026)"
                      className="campo text-xs"
                    />
                    <div className="flex gap-4 text-xs text-slate-600">
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" checked={i.incluso} onChange={(e) => alterar(i.chave, { incluso: e.target.checked, opcional: e.target.checked ? false : i.opcional })} />
                        Incluso
                      </label>
                      <label className="flex items-center gap-1.5" title="Fora do total, ex.: AET que depende do resultado da AEP">
                        <input type="checkbox" checked={i.opcional} onChange={(e) => alterar(i.chave, { opcional: e.target.checked, incluso: e.target.checked ? false : i.incluso })} />
                        Opcional
                      </label>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-col items-end gap-1 text-sm">
          <p className="text-slate-600">
            Subtotal: <span className="font-semibold tabular-nums text-slate-900">{formatarMoeda(subtotal)}</span>
          </p>
          <label className="flex items-center gap-2 text-slate-600">
            Desconto (%)
            <input name="desconto" type="number" min={0} max={100} step="0.5" value={desconto} onChange={(e) => setDesconto(Number(e.target.value) || 0)} className="campo w-24 text-right" />
            <span className="w-28 text-right tabular-nums">− {formatarMoeda(valorDesconto)}</span>
          </label>
          <p className="text-base font-semibold text-marca-900">
            Total da proposta: <span className="tabular-nums">{formatarMoeda(total)}</span>
          </p>
        </div>
      </section>

      {/* ---------- Saúde Ocupacional: exames por demanda ---------- */}
      <section id="exames-por-demanda" className="mt-8 scroll-mt-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="border-l-4 border-[#1FB5B8] pl-2 text-sm font-semibold text-marca-900">Realização dos exames ocupacionais (Saúde Ocupacional)</h3>
            <p className="mt-0.5 pl-3 text-xs text-slate-500">Valor por exame realizado. Nunca entram no total, nem como pacote ou incluso.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SeletorServico servicos={servicosExames} aoEscolher={(s) => adicionar([itemDoServico(s)])} rotulo="+ Exame" />
            <button type="button" onClick={adicionarTabelaClinica} className={botaoSec}>
              + Tabela da clínica inteira
            </button>
          </div>
        </div>
        {exames.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
            Nenhum exame nesta proposta.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {exames.map((i) => (
              <li key={i.chave} className="grid grid-cols-[1fr_8rem_2rem] items-center gap-2 px-3 py-2">
                <input value={i.descricao} onChange={(e) => alterar(i.chave, { descricao: e.target.value })} className="campo" />
                <input type="number" min={0} step="0.01" value={i.valorUnitario} onChange={(e) => alterar(i.chave, { valorUnitario: Number(e.target.value) || 0 })} className="campo text-right" title="Valor por exame" />
                <button type="button" onClick={() => remover(i.chave)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remover">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Condições ---------- */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
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
        <Campo rotulo="Forma de pagamento">
          <textarea name="condicoesPagamento" rows={2} defaultValue={inicial.condicoesPagamento ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Prazo de entrega">
          <textarea
            name="prazoEntrega"
            rows={2}
            defaultValue={inicial.prazoEntrega ?? ""}
            placeholder="Ex.: até 15 dias úteis após o recebimento completo das informações"
            className="campo"
          />
        </Campo>
        <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
          <input type="checkbox" name="mostrarMedicoes" defaultChecked={inicial.mostrarMedicoes} />
          Mostrar a tabela de referência das avaliações quantitativas (medições não contratadas)
        </label>
        <Campo rotulo="Observações (aparecem na proposta)" className="md:col-span-2">
          <textarea name="observacoes" rows={3} defaultValue={inicial.observacoes ?? ""} className="campo" />
        </Campo>
      </div>
    </Formulario>
  );
}

function SeletorServico({
  servicos,
  aoEscolher,
  rotulo,
  extra,
}: {
  servicos: ServicoOpcao[];
  aoEscolher: (s: ServicoOpcao) => void;
  rotulo: string;
  /** Opção especial no fim da lista (ex.: a tabela de exames inteira). */
  extra?: { grupo: string; rotulo: string; aoEscolher: () => void };
}) {
  const categorias = [...new Set(servicos.map((s) => s.categoria))];
  return (
    <select
      value=""
      onChange={(e) => {
        if (e.target.value === "extra") return extra?.aoEscolher();
        const s = servicos.find((x) => x.id === Number(e.target.value));
        if (s) aoEscolher(s);
      }}
      className="campo w-auto max-w-xs"
    >
      <option value="">{rotulo}</option>
      {categorias.map((c) => (
        <optgroup key={c} label={c}>
          {servicos
            .filter((s) => s.categoria === c)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome} — {formatarMoeda(s.precoBase)} {s.unidade}
              </option>
            ))}
        </optgroup>
      ))}
      {extra && (
        <optgroup label={extra.grupo}>
          <option value="extra">{extra.rotulo}</option>
        </optgroup>
      )}
    </select>
  );
}
