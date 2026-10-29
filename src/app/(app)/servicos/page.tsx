import type { Metadata } from "next";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { servicos, type Servico } from "@/db/schema";
import { Cabecalho, Cartao, Selo, TituloCartao } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { formatarMoeda } from "@/lib/formato";
import { atualizarServico, criarServico } from "./actions";

export const metadata: Metadata = { title: "Serviços SST" };

const UNIDADES = ["por exame", "por colaborador", "por empresa", "por funcionário", "por funcionário/mês", "por participante", "por turma", "por mês", "por hora", "por visita", "por avaliação"];

export default async function ServicosPage() {
  await connection();
  const lista = db.select().from(servicos).orderBy(asc(servicos.categoria), asc(servicos.nome)).all();
  const categorias = [...new Set(lista.map((s) => s.categoria))];

  return (
    <>
      <Cabecalho
        titulo="Serviços"
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {categorias.map((cat) => (
            <Cartao key={cat}>
              <TituloCartao>{cat}</TituloCartao>
              <ul className="divide-y divide-slate-100">
                {lista
                  .filter((s) => s.categoria === cat)
                  .map((s) => (
                    <ItemServico key={s.id} servico={s} categorias={categorias} />
                  ))}
              </ul>
            </Cartao>
          ))}
        </div>
        <Cartao className="h-fit">
          <TituloCartao>Novo serviço</TituloCartao>
          <Formulario acao={criarServico} textoBotao="Adicionar" limparAoSalvar>
            <CamposServico categorias={categorias} />
          </Formulario>
        </Cartao>
      </div>
    </>
  );
}

function ItemServico({ servico: s, categorias }: { servico: Servico; categorias: string[] }) {
  return (
    <li className="py-3">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className={`text-sm font-medium ${s.ativo ? "text-slate-900" : "text-slate-400 line-through"}`}>{s.nome}</p>
            {s.descricao && <p className="text-xs text-slate-500">{s.descricao}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold tabular-nums">{formatarMoeda(s.precoBase)}</p>
            <p className="text-xs text-slate-500">{s.unidade}</p>
            {s.custo != null && <p className="text-[11px] text-slate-500">custo {formatarMoeda(s.custo)}</p>}
            <p className="mt-0.5 text-[11px] font-semibold text-slate-500">{s.area === "saude" ? "Saúde" : "Segurança"}{s.cobranca === "por_demanda" ? " · por demanda" : ""}</p>
            {!s.ativo && <Selo classe="bg-slate-100 text-slate-600">inativo</Selo>}
          </div>
        </summary>
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <Formulario acao={atualizarServico.bind(null, s.id)} textoBotao="Salvar">
            <CamposServico categorias={categorias} servico={s} />
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="ativo" defaultChecked={s.ativo} /> Ativo (aparece nas propostas)
            </label>
          </Formulario>
        </div>
      </details>
    </li>
  );
}

function CamposServico({ categorias, servico }: { categorias: string[]; servico?: Servico }) {
  const idLista = `categorias-${servico?.id ?? "novo"}`;
  return (
    <div className="space-y-3">
      <input name="nome" required defaultValue={servico?.nome} placeholder="Nome do serviço *" className="campo" />
      <input
        name="categoria"
        required
        list={idLista}
        defaultValue={servico?.categoria}
        placeholder="Categoria * (ex.: Treinamentos)"
        className="campo"
      />
      <datalist id={idLista}>
        {categorias.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <textarea name="descricao" rows={2} defaultValue={servico?.descricao ?? ""} placeholder="Descrição" className="campo" />
      <div className="grid grid-cols-2 gap-3">
        <input
          name="precoBase"
          type="number"
          min={0}
          step="0.01"
          defaultValue={servico?.precoBase ?? ""}
          placeholder="Preço (R$)"
          className="campo"
        />
        <select name="unidade" defaultValue={servico?.unidade ?? "por empresa"} className="campo">
          {UNIDADES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <input
        name="custo"
        type="number"
        min={0}
        step="0.01"
        defaultValue={servico?.custo ?? ""}
        placeholder="Custo do fornecedor (R$)"
        className="campo"
      />
      <div className="grid grid-cols-2 gap-3">
        <select name="area" defaultValue={servico?.area ?? "seguranca"} className="campo">
          <option value="seguranca">Segurança do Trabalho</option>
          <option value="saude">Saúde Ocupacional</option>
        </select>
        <select name="cobranca" defaultValue={servico?.cobranca ?? "fixo"} className="campo">
          <option value="fixo">Valor fixo (soma no total)</option>
          <option value="por_demanda">Por demanda (exame)</option>
        </select>
      </div>
    </div>
  );
}
