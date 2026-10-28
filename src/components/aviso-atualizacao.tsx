"use client";

import { useEffect, useState } from "react";

type Estado =
  | { etapa: "nenhuma" }
  | { etapa: "disponivel"; versao: string; notas?: string }
  | { etapa: "baixando"; versao: string; notas?: string; progresso?: number }
  | { etapa: "pronta"; versao: string; notas?: string }
  | { etapa: "erro"; versao: string; mensagem?: string };

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

/** Janelinha no canto da tela avisando que há versão nova do app desktop. */
export function AvisoAtualizacao() {
  const [estado, setEstado] = useState<Estado>({ etapa: "nenhuma" });
  const [verNotas, setVerNotas] = useState(false);

  useEffect(() => {
    const p = ponte();
    if (!p) return; // no navegador não existe atualização do app
    p.estado().then((e) => e && setEstado(e)).catch(() => {});
    return p.aoMudar(setEstado);
  }, []);

  if (estado.etapa === "nenhuma") return null;

  const notas = "notas" in estado ? estado.notas?.trim() : "";

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Atualização do CRM"
      className="nao-imprimir fixed bottom-4 right-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-marca-50 text-marca-700" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          {estado.etapa === "disponivel" && (
            <>
              <p className="text-sm font-semibold text-marca-900">Nova versão disponível: {estado.versao}</p>
              <p className="mt-0.5 text-xs text-slate-500">Atualize para receber as novidades do sistema. Seus dados continuam.</p>
            </>
          )}
          {estado.etapa === "baixando" && (
            <>
              <p className="text-sm font-semibold text-marca-900">Baixando a versão {estado.versao}...</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={estado.progresso ?? 0} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-marca-600 transition-all" style={{ width: `${estado.progresso ?? 0}%` }} />
              </div>
              <p className="mt-1 text-xs text-slate-500">{estado.progresso ?? 0}% · pode continuar usando o CRM</p>
            </>
          )}
          {estado.etapa === "pronta" && (
            <>
              <p className="text-sm font-semibold text-marca-900">Versão {estado.versao} pronta</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Clique em reiniciar: o CRM fecha, atualiza sozinho em alguns segundos e abre de novo.
              </p>
            </>
          )}
          {estado.etapa === "erro" && (
            <>
              <p className="text-sm font-semibold text-erro">Não deu para atualizar</p>
              <p className="mt-0.5 text-xs text-slate-500">{estado.mensagem}</p>
            </>
          )}

          {notas && estado.etapa !== "baixando" && (
            <div className="mt-2">
              <button onClick={() => setVerNotas((v) => !v)} className="text-xs font-semibold text-marca-700 hover:underline">
                {verNotas ? "Esconder novidades" : "Ver o que mudou"}
              </button>
              {verNotas && (
                <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                  {notas}
                </p>
              )}
            </div>
          )}

          {estado.etapa !== "baixando" && (
            <div className="mt-3 flex flex-wrap gap-2">
              {(estado.etapa === "disponivel" || estado.etapa === "erro") && (
                <button onClick={() => ponte()?.baixar()} className={`${botao} bg-marca-600 text-white hover:bg-marca-700`}>
                  {estado.etapa === "erro" ? "Tentar de novo" : "Atualizar"}
                </button>
              )}
              {estado.etapa === "pronta" && (
                <button onClick={() => ponte()?.instalar()} className={`${botao} bg-marca-600 text-white hover:bg-marca-700`}>
                  Reiniciar e atualizar
                </button>
              )}
              <button
                onClick={() => ponte()?.dispensar()}
                className={`${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
              >
                Agora não
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
