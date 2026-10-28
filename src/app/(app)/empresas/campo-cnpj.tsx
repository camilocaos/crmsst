"use client";

import { useRef, useState, useTransition } from "react";
import { buscarCnpj } from "./actions";

type Aviso = { tipo: "ok" | "alerta" | "erro"; texto: string } | null;

function mascara(valor: string) {
  const n = valor.replace(/\D/g, "").slice(0, 14);
  return n
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/**
 * Campo de CNPJ que consulta a Receita e preenche os outros campos do formulário.
 * Só preenche campos vazios, para não apagar o que a pessoa já digitou.
 */
export function CampoCnpj({ valorInicial }: { valorInicial: string }) {
  const [valor, setValor] = useState(valorInicial);
  const [aviso, setAviso] = useState<Aviso>(null);
  const [buscando, iniciar] = useTransition();
  const ultimaBusca = useRef(valorInicial.replace(/\D/g, ""));
  const ref = useRef<HTMLInputElement>(null);

  function buscar(cnpj: string) {
    const n = cnpj.replace(/\D/g, "");
    if (n.length !== 14) return;
    ultimaBusca.current = n;
    setAviso(null);
    iniciar(async () => {
      const r = await buscarCnpj(n);
      if (!r.ok) {
        setAviso({ tipo: "erro", texto: r.erro });
        return;
      }
      const form = ref.current?.form;
      if (!form) return;
      const d = r.dados;
      const preenchidos: string[] = [];
      const preencher = (nome: string, valor: string, rotulo: string) => {
        const campo = form.elements.namedItem(nome) as HTMLInputElement | HTMLSelectElement | null;
        if (!campo || !valor || campo.value.trim()) return;
        if (campo instanceof HTMLSelectElement && ![...campo.options].some((o) => o.value === valor)) return;
        campo.value = valor;
        preenchidos.push(rotulo);
      };
      preencher("razaoSocial", d.razaoSocial, "razão social");
      preencher("nomeFantasia", d.nomeFantasia, "nome fantasia");
      preencher("cnae", d.cnae, "CNAE");
      preencher("segmento", d.segmento, "segmento");
      preencher("telefone", d.telefone, "telefone");
      preencher("email", d.email, "e-mail");
      preencher("endereco", d.endereco, "endereço");
      preencher("cidade", d.cidade, "cidade");
      preencher("uf", d.uf, "UF");

      const situacao = d.situacao && d.situacao.toUpperCase() !== "ATIVA" ? ` Atenção: situação na Receita "${d.situacao}".` : "";
      setAviso({
        tipo: situacao ? "alerta" : "ok",
        texto:
          (preenchidos.length
            ? `Preenchido pela Receita: ${preenchidos.join(", ")}.`
            : "Dados encontrados, mas os campos já estavam preenchidos.") +
          (d.cnaeDescricao ? ` Atividade: ${d.cnaeDescricao}.` : "") +
          situacao,
      });
    });
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          ref={ref}
          name="cnpj"
          value={valor}
          inputMode="numeric"
          placeholder="00.000.000/0000-00"
          onChange={(e) => {
            const novo = mascara(e.target.value);
            setValor(novo);
            const n = novo.replace(/\D/g, "");
            if (n.length === 14 && n !== ultimaBusca.current) buscar(n);
          }}
          className="campo"
        />
        <button
          type="button"
          onClick={() => buscar(valor)}
          disabled={buscando || valor.replace(/\D/g, "").length !== 14}
          className="inline-flex min-h-10 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          {buscando ? "Buscando..." : "Buscar"}
        </button>
      </div>
      {aviso && (
        <p
          role={aviso.tipo === "erro" ? "alert" : "status"}
          className={`mt-1.5 text-xs ${
            aviso.tipo === "ok" ? "text-sucesso" : aviso.tipo === "alerta" ? "text-atencao" : "text-erro"
          }`}
        >
          {aviso.texto}
        </p>
      )}
    </div>
  );
}
