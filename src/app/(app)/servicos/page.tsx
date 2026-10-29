import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { servicos, type Servico } from "@/db/schema";
import { Cabecalho, Cartao, Selo, TituloCartao } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { formatarMoeda } from "@/lib/formato";
import { CATEGORIA_TREINAMENTOS } from "@/lib/propostas";
import { atualizarServico, criarServico } from "./actions";

export const metadata: Metadata = { title: "Serviços SST" };

const UNIDADES = ["por exame", "por colaborador", "por empresa", "por funcionário", "por funcionário/mês", "por participante", "por turma", "por mês", "por hora", "por visita", "por avaliação"];

const normalizar = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const semPreco = (s: Servico) => !s.precoBase && !s.precoReciclagem;

export default async function ServicosPage({ searchParams }: PageProps<"/servicos">) {
  await connection();
  const { q, cat } = await searchParams;
  const busca = typeof q === "string" ? q.trim() : "";
  const todos = db.select().from(servicos).orderBy(asc(servicos.categoria), asc(servicos.nome)).all();
  const categorias = [...new Set(todos.map((s) => s.categoria))];
  const SEM_PRECO = "sem-preco";
  // Sem busca, mostra uma categoria por vez (são centenas de serviços)
  const categoria = typeof cat === "string" && (categorias.includes(cat) || cat === SEM_PRECO) ? cat : busca ? "" : categorias[0];

  const termos = normalizar(busca).replace(/-/g, " ").split(/\s+/).filter(Boolean);
  const lista = todos.filter((s) => {
    if (categoria === SEM_PRECO ? !semPreco(s) : categoria && s.categoria !== categoria) return false;
    const chave = normalizar(`${s.nome} ${s.categoria}`).replace(/-/g, " ");
    return termos.every((t) => chave.includes(t));
  });
  const grupos = [...new Set(lista.map((s) => s.categoria))];
  const contagem = (c: string) => todos.filter((s) => s.categoria === c).length;
  const url = (c: string) => `/servicos?${new URLSearchParams({ ...(busca ? { q: busca } : {}), cat: c })}`;
  const chip = (ativo: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold transition ${ativo ? "bg-marca-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`;

  return (
    <>
      <Cabecalho titulo="Serviços" subtitulo={`${todos.length} no catálogo`} />
      <form className="mb-3 flex gap-2">
        {categoria && <input type="hidden" name="cat" value={categoria} />}
        <input name="q" defaultValue={busca} placeholder="Buscar serviço, treinamento ou exame..." className="campo max-w-md" />
        <button className="rounded-lg bg-marca-600 px-4 text-sm font-semibold text-white hover:bg-marca-700">Buscar</button>
      </form>
      <nav className="mb-5 flex flex-wrap gap-2">
        {busca && (
          <Link href={`/servicos?q=${encodeURIComponent(busca)}`} className={chip(!categoria)}>
            Todas
          </Link>
        )}
        {categorias.map((c) => (
          <Link key={c} href={url(c)} className={chip(categoria === c)}>
            {c} <span className="opacity-70">{contagem(c)}</span>
          </Link>
        ))}
        <Link href={url(SEM_PRECO)} className={chip(categoria === SEM_PRECO)}>
          Sem preço <span className="opacity-70">{todos.filter(semPreco).length}</span>
        </Link>
      </nav>
      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {grupos.length === 0 && <Cartao><p className="text-sm text-slate-500">Nada encontrado.</p></Cartao>}
          {grupos.map((g) => (
            <Cartao key={g}>
              <TituloCartao>{g}</TituloCartao>
              <ul className="divide-y divide-slate-100">
                {lista
                  .filter((s) => s.categoria === g)
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
            {s.categoria === CATEGORIA_TREINAMENTOS ? (
              <>
                <p className="text-sm tabular-nums">
                  <span className="text-xs text-slate-500">Inicial </span>
                  <span className="font-semibold">{s.precoBase ? formatarMoeda(s.precoBase) : "a definir"}</span>
                </p>
                <p className="text-sm tabular-nums">
                  <span className="text-xs text-slate-500">Reciclagem </span>
                  <span className="font-semibold">{s.precoReciclagem ? formatarMoeda(s.precoReciclagem) : "a definir"}</span>
                </p>
              </>
            ) : (
              <p className="text-sm font-semibold tabular-nums">{s.precoBase ? formatarMoeda(s.precoBase) : "a definir"}</p>
            )}
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
          defaultValue={servico?.precoBase || ""}
          placeholder={servico?.categoria === CATEGORIA_TREINAMENTOS ? "Preço inicial (R$)" : "Preço (R$)"}
          title="Preço (no treinamento, o do inicial)"
          className="campo"
        />
        <select name="unidade" defaultValue={servico?.unidade ?? "por empresa"} className="campo">
          {UNIDADES.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </div>
      <input
        name="precoReciclagem"
        type="number"
        min={0}
        step="0.01"
        defaultValue={servico?.precoReciclagem ?? ""}
        placeholder="Preço reciclagem (R$), para treinamentos"
        className="campo"
      />
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
