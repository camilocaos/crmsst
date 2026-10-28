import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function Cabecalho({
  titulo,
  subtitulo,
  acoes,
}: {
  titulo: string;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 pl-10 lg:pl-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-marca-900">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-slate-500">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  );
}

export function Cartao({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>
  );
}

export function TituloCartao({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-marca-900">{children}</h2>
      {acao}
    </div>
  );
}

const VARIANTES = {
  primario: "bg-marca-600 text-white hover:bg-marca-700",
  secundario: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  perigo: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  fantasma: "text-slate-600 hover:bg-slate-100",
};

type Variante = keyof typeof VARIANTES;

const baseBotao =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none";

export function Botao({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<"button"> & { variante?: Variante }) {
  return <button className={`${baseBotao} ${VARIANTES[variante]} ${className}`} {...props} />;
}

export function BotaoLink({
  variante = "primario",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: Variante }) {
  return <Link className={`${baseBotao} ${VARIANTES[variante]} ${className}`} {...props} />;
}

export function Selo({ children, classe }: { children: ReactNode; classe: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${classe}`}>
      {children}
    </span>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}

export function Campo({
  rotulo,
  children,
  className = "",
}: {
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="rotulo">{rotulo}</span>
      {children}
    </label>
  );
}

export function Tabela({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-slate-100 px-4 py-3 align-middle ${className}`}>{children}</td>;
}
