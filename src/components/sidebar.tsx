"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const ITENS = [
  { href: "/", nome: "Dashboard", icone: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/funil", nome: "Funil de vendas", icone: "M3 4h18l-7 8v6l-4 2v-8L3 4z" },
  { href: "/empresas", nome: "Empresas", icone: "M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M8 7h4M8 11h4M8 15h4M2 21h20" },
  { href: "/tarefas", nome: "Tarefas", icone: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { href: "/propostas", nome: "Propostas", icone: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zM14 3v6h6M8 13h8M8 17h5" },
  { href: "/servicos", nome: "Serviços SST", icone: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" },
];

const ICONE_ENGRENAGEM =
  "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z";

export function Sidebar({ nomeUsuario, sair }: { nomeUsuario: string; sair: () => Promise<void> }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="nao-imprimir fixed left-3 top-3 z-30 rounded-lg bg-marca-900 p-2 text-white shadow lg:hidden"
        aria-label="Abrir menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {aberto && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setAberto(false)} />
      )}
      <aside
        className={`nao-imprimir fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marca-900 text-white transition-transform lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo local pequeno, sem otimização */}
          <img src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold leading-tight">CRM Comercial</p>
            <p className="text-xs text-white/60">Saúde e Segurança do Trabalho</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3" aria-label="Principal">
          {ITENS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAberto(false)}
              aria-current={ativo(item.href) ? "page" : undefined}
              className={`flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm transition ${
                ativo(item.href)
                  ? "bg-marca-600 font-semibold text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={item.icone} />
              </svg>
              {item.nome}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white">
              {nomeUsuario.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{nomeUsuario}</p>
              <form action={sair}>
                <button className="text-xs text-white/60 hover:text-white">Sair</button>
              </form>
            </div>
            <Link
              href="/configuracoes"
              onClick={() => setAberto(false)}
              title="Configurações"
              aria-label="Configurações"
              className={`rounded-lg p-2 transition ${
                ativo("/configuracoes") ? "bg-marca-600 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d={ICONE_ENGRENAGEM} />
              </svg>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
