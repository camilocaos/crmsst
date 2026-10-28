import type { ReactNode } from "react";

/** Moldura centralizada das telas de login e troca de senha. */
export function TelaAcesso({ titulo, subtitulo, children }: { titulo: string; subtitulo?: ReactNode; children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-marca-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center text-emerald-50">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-marca-500 shadow-lg">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none">
              <path d="M12 3l8 3.3v5.2c0 4.4-3.3 7.8-8 9.5-4.7-1.7-8-5.1-8-9.5V6.3L12 3z" fill="white" fillOpacity={0.25} />
              <path d="M8.5 12.2l2.3 2.3 4.7-4.8" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="mt-3 text-lg font-semibold">CRM Comercial SST</p>
          <p className="text-xs text-emerald-200/70">Saúde e Segurança do Trabalho</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-slate-900">{titulo}</h1>
          {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
          <div className="mt-5">{children}</div>
        </div>
        <p className="mt-6 text-center text-xs text-emerald-200/50">by camilocaos</p>
      </div>
    </main>
  );
}
