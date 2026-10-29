"use client";

import { useState } from "react";
import { Campo } from "@/components/ui";
import { OPCOES_PAGAMENTO, datasParcelas, type Pagamento } from "@/lib/pagamento";

const dataBr = (iso: string) => iso.split("-").reverse().join("/");

/** Forma de pagamento com opções prontas; no boleto parcelado pede quantidade e 1º vencimento. */
export function CamposPagamento({
  inicial,
}: {
  inicial: { pagamento: Pagamento | null; parcelas: number | null; vencimentoData: string | null; formaPagamento: string | null; vencimento: string | null };
}) {
  const [pagamento, setPagamento] = useState<Pagamento | "">(inicial.pagamento ?? "");
  // Texto livre enquanto digita; o número válido (2 a 24) é calculado à parte
  const [parcelasTexto, setParcelasTexto] = useState(String(inicial.parcelas ?? 2));
  const parcelas = Math.max(2, Math.min(24, Math.trunc(Number(parcelasTexto)) || 2));
  const [data, setData] = useState(inicial.vencimentoData ?? "");
  const previa = pagamento === "boleto_parcelado" && data ? datasParcelas(data, parcelas).map(dataBr) : [];

  return (
    <>
      <Campo rotulo="Forma de pagamento">
        <select name="pagamento" value={pagamento} onChange={(e) => setPagamento(e.target.value as Pagamento | "")} className="campo">
          <option value="">Selecione</option>
          {Object.entries(OPCOES_PAGAMENTO).map(([v, nome]) => (
            <option key={v} value={v}>
              {nome}
            </option>
          ))}
        </select>
      </Campo>

      {(pagamento === "pix" || pagamento === "boleto_vista") && (
        <Campo rotulo="Vencimento">
          <input name="vencimentoData" type="date" value={data} onChange={(e) => setData(e.target.value)} className="campo" />
        </Campo>
      )}

      {pagamento === "boleto_parcelado" && (
        <div className="grid grid-cols-[6rem_1fr] gap-3">
          <Campo rotulo="Parcelas">
            <input name="parcelas" type="number" min={2} max={24} required value={parcelasTexto} onChange={(e) => setParcelasTexto(e.target.value)} className="campo" />
          </Campo>
          <Campo rotulo="1º vencimento">
            <input name="vencimentoData" type="date" required value={data} onChange={(e) => setData(e.target.value)} className="campo" />
          </Campo>
        </div>
      )}

      {pagamento === "outro" && (
        <>
          <Campo rotulo="Como será o pagamento">
            <input name="formaPagamento" defaultValue={inicial.formaPagamento ?? ""} className="campo" />
          </Campo>
          <Campo rotulo="Vencimento / parcelas">
            <input name="vencimento" defaultValue={inicial.vencimento ?? ""} className="campo" />
          </Campo>
        </>
      )}

      {previa.length > 0 && (
        <p className="text-xs text-slate-600 md:col-span-2">Vencimentos: {previa.join(" · ")}</p>
      )}
    </>
  );
}
