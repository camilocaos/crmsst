import type { ReactNode } from "react";

/** Moldura centralizada das telas de login e troca de senha. */
export function TelaAcesso({ titulo, subtitulo, children }: { titulo: string; subtitulo?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo local pequeno */}
          <img src="/logo.png" alt="" width={64} height={64} className="h-16 w-16" />
          <p className="mt-3 text-xl font-semibold text-marca-900">CRM Comercial</p>
          <p className="text-sm text-slate-500">Saúde e Segurança do Trabalho</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h1 className="text-lg font-semibold text-marca-900">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">by camilocaos</p>
      </div>
    </main>
  );
}
