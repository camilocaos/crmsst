"use client";

import { useEffect, useState } from "react";

type Estado =
  | { etapa: "nenhuma" }
  | { etapa: "baixando"; versao: string; notas?: string; progresso?: number }
  | { etapa: "pronta"; versao: string; notas?: string }
  | { etapa: "erro"; versao: string; notas?: string; mensagem?: string };

type PonteAtualizacao = {
  estado: () => Promise<Estado | null>;
  baixar: () => Promise<void>;
  dispensar: () => Promise<void>;
  instalar: () => Promise<void>;
  aoMudar: (cb: (e: Estado) => void) => () => void;
};

const ponte = (): PonteAtualizacao | undefined =>
  (window as unknown as { crmDesktop?: { atualizacao?: PonteAtualizacao } }).crmDesktop?.atualizacao;

const botao = "inline-flex min-h-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition";
const primario = `${botao} bg-marca-600 text-white hover:bg-marca-700`;
const secundario = `${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`;

/**
 * Aviso de versão nova do app desktop. Aparece no meio da tela: a atualização baixa
 * sozinha enquanto a pessoa usa o CRM e, quando fica pronta, é só reiniciar.
 * Dá para esconder (vira um botãozinho no canto) ou deixar para depois.
 */
export function AvisoAtualizacao() {
  const [estado, setEstado] = useState<Estado>({ etapa: "nenhuma" });
  // Janela minimizada no canto; volta a abrir sozinha quando a etapa muda
  const [minimizadaEm, setMinimizadaEm] = useState<string | null>(null);
  const [reiniciando, setReiniciando] = useState(false);

  useEffect(() => {
    const p = ponte();
    if (!p) return; // no navegador não existe atualização do app
    p.estado().then((e) => e && setEstado(e)).catch(() => {});
    return p.aoMudar(setEstado);
  }, []);

  if (estado.etapa === "nenhuma") return null;

  const notas = estado.notas?.trim();
  const progresso = estado.etapa === "baixando" ? (estado.progresso ?? 0) : 100;

  if (minimizadaEm === estado.etapa) {
    return (
      <button
        onClick={() => setMinimizadaEm(null)}
        className="nao-imprimir fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-marca-800 shadow-lg hover:bg-slate-50"
      >
        <IconeDownload />
        {estado.etapa === "baixando" ? `Baixando a versão ${estado.versao}... ${progresso}%` : `Versão ${estado.versao}: ver atualização`}
      </button>
    );
  }

  function reiniciar() {
    setReiniciando(true);
    ponte()?.instalar();
  }

  return (
    <div className="nao-imprimir fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[1px]">
      <div role="dialog" aria-modal="true" aria-labelledby="titulo-atualizacao" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-marca-50 text-marca-700" aria-hidden>
            <IconeDownload grande />
          </span>
          <div>
            <h2 id="titulo-atualizacao" className="text-base font-semibold text-marca-900">
              {estado.etapa === "erro"
                ? "Não deu para atualizar"
                : estado.etapa === "pronta"
                  ? `Versão ${estado.versao} pronta`
                  : `Nova versão: ${estado.versao}`}
            </h2>
            <p className="text-sm text-slate-500">
              {estado.etapa === "baixando" && "Baixando..."}
              {estado.etapa === "pronta" && reiniciando && "Reiniciando..."}
              {estado.etapa === "erro" && estado.mensagem}
            </p>
          </div>
        </div>

        {estado.etapa !== "erro" && (
          <div className="mt-5">
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progresso} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-full rounded-full transition-all ${estado.etapa === "pronta" ? "bg-sucesso" : "bg-marca-600"}`} style={{ width: `${progresso}%` }} />
            </div>
            {estado.etapa === "baixando" && <p className="mt-1 text-right text-xs tabular-nums text-slate-500">{progresso}%</p>}
          </div>
        )}

        {notas && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Atualizações - versão {estado.versao}</p>
            <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{notas}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {estado.etapa === "baixando" && (
            <button onClick={() => setMinimizadaEm("baixando")} className={primario}>
              Continuar usando
            </button>
          )}
          {estado.etapa === "pronta" && (
            <>
              <button onClick={() => ponte()?.dispensar()} disabled={reiniciando} className={secundario}>
                Depois
              </button>
              <button onClick={reiniciar} disabled={reiniciando} className={primario}>
                {reiniciando ? "Reiniciando..." : "Reiniciar agora"}
              </button>
            </>
          )}
          {estado.etapa === "erro" && (
            <>
              <button onClick={() => ponte()?.dispensar()} className={secundario}>
                Agora não
              </button>
              <button onClick={() => ponte()?.baixar()} className={primario}>
                Tentar de novo
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconeDownload({ grande = false }: { grande?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={grande ? "h-6 w-6" : "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
    </svg>
  );
}
