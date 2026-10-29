"use client";

import { useEffect, useState } from "react";

type CrmDesktop = {
  info: () => Promise<{ versao: string; pastaDados: string } | null>;
  abrirPastaDados: () => Promise<boolean>;
  salvarBackup: () => Promise<{ ok: boolean; cancelado?: boolean; caminho?: string }>;
};

declare global {
  interface Window {
    crmDesktop?: CrmDesktop;
  }
}

const botao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60";

/** Aba "Dados e backup": só funciona dentro do app desktop (usa a ponte do preload). */
export function AbaDados() {
  const [info, setInfo] = useState<{ versao: string; pastaDados: string } | null | undefined>(undefined);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const ponte = window.crmDesktop;
    (ponte ? ponte.info() : Promise.resolve(null)).then(setInfo).catch(() => setInfo(null));
  }, []);

  if (info === undefined) return null;

  if (!info) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        Disponível no app para Windows.
      </div>
    );
  }

  async function salvar() {
    setMensagem(null);
    setSalvando(true);
    const r = await window.crmDesktop!.salvarBackup();
    setSalvando(false);
    if (r.cancelado) return;
    setMensagem(
      r.ok
        ? { tipo: "ok", texto: `Backup salvo em ${r.caminho}` }
        : { tipo: "erro", texto: "Não foi possível salvar o backup." },
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-marca-900">Dados e backup</h2>
        <p className="mt-1 text-sm text-slate-600">
          Backup automático diário (últimos 30 dias).
        </p>
        <p className="mt-3 break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">{info.pastaDados}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => window.crmDesktop!.abrirPastaDados()}
            className={`${botao} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
          >
            Abrir pasta de dados
          </button>
          <button onClick={salvar} disabled={salvando} className={`${botao} bg-marca-600 text-white hover:bg-marca-700`}>
            {salvando ? "Salvando..." : "Salvar backup agora..."}
          </button>
        </div>
        {mensagem && (
          <p
            role={mensagem.tipo === "ok" ? "status" : "alert"}
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              mensagem.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-700"
            }`}
          >
            {mensagem.texto}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-marca-900">Sobre</h2>
        <p className="mt-1 text-sm text-slate-600">
          CRM Comercial {info.versao} · by camilocaos ·{" "}
          <a href="https://github.com/camilocaos/crmsst" target="_blank" className="font-medium text-marca-700 hover:underline">
            código no GitHub
          </a>
        </p>
        <p className="mt-3 text-xs text-slate-500">
          Atalhos: Ctrl + / Ctrl − zoom · Ctrl 0 tamanho normal · F5 recarregar · F11 tela cheia
        </p>
      </div>
    </div>
  );
}
