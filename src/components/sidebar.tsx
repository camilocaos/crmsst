"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CONFIGURACOES, MODULOS, NOVOS, type Modulo } from "@/lib/modulos";

export function Icone({ d, className = "h-4 w-4" }: { d: string; className?: string }) {
  return (
    <svg className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const GRUPOS = ["Vendas", "Rotina", "Cadastros"] as const;

export function Sidebar({ nomeUsuario, sair }: { nomeUsuario: string; sair: () => Promise<void> }) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [novoAberto, setNovoAberto] = useState(false);
  const menuNovo = useRef<HTMLDivElement>(null);

  const ativo = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const fechar = () => {
    setAberto(false);
    setNovoAberto(false);
  };

  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (!menuNovo.current?.contains(e.target as Node)) setNovoAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const item = (m: Modulo) => {
    const atual = ativo(m.href);
    return (
      <Link
        key={m.href}
        href={m.href}
        onClick={fechar}
        aria-current={atual ? "page" : undefined}
        className={`relative flex min-h-10 items-center gap-3 rounded-lg px-2.5 text-sm transition ${
          atual ? "bg-white/12 font-semibold text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
        }`}
      >
        {atual && <span className={`absolute inset-y-2 left-0 w-1 rounded-full ${m.barra}`} aria-hidden />}
        <span className={`flex h-7 w-7 items-center justify-center rounded-md ${m.menu}`}>
          <Icone d={m.icone} />
        </span>
        {m.nome}
      </Link>
    );
  };

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="nao-imprimir fixed left-3 top-3 z-30 rounded-lg bg-marca-900 p-2 text-white shadow lg:hidden"
        aria-label="Abrir menu"
      >
        <Icone d="M4 6h16M4 12h16M4 18h16" className="h-5 w-5" />
      </button>
      {aberto && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setAberto(false)} />}
      <aside
        className={`nao-imprimir fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-marca-900 text-white transition-transform lg:translate-x-0 ${
          aberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-3 px-5 pb-4 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo local pequeno, sem otimização */}
          <img src="/logo.png" alt="" width={36} height={36} className="h-9 w-9" />
          <div>
            <p className="text-sm font-semibold leading-tight">CRM Comercial</p>
            <p className="text-xs text-white/60">Saúde e Segurança do Trabalho</p>
          </div>
        </div>

        <div ref={menuNovo} className="relative px-3 pb-3">
          <button
            onClick={() => setNovoAberto((v) => !v)}
            aria-expanded={novoAberto}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#8DC63F] text-sm font-semibold text-marca-900 transition hover:bg-[#9fd255]"
          >
            <Icone d="M12 5v14M5 12h14" />
            Novo
          </button>
          {novoAberto && (
            <div className="absolute inset-x-3 top-full z-50 mt-1 overflow-hidden rounded-lg bg-white py-1 text-slate-800 shadow-xl">
              {NOVOS.map((n) => {
                const m = MODULOS.find((x) => x.href === n.modulo)!;
                return (
                  <Link key={n.href} href={n.href} onClick={fechar} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${m.selo}`}>
                      <Icone d={m.icone} />
                    </span>
                    {n.nome}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-3" aria-label="Principal">
          {GRUPOS.map((g) => (
            <div key={g}>
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">{g}</p>
              <div className="space-y-0.5">{MODULOS.filter((m) => m.grupo === g).map(item)}</div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8DC63F] text-sm font-semibold text-marca-900">
              {nomeUsuario.trim().charAt(0).toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{nomeUsuario}</p>
              <form action={sair}>
                <button className="text-xs text-white/60 hover:text-white">Sair</button>
              </form>
            </div>
            <Link
              href={CONFIGURACOES.href}
              onClick={fechar}
              title="Configurações"
              aria-label="Configurações"
              className={`rounded-lg p-2 transition ${ativo(CONFIGURACOES.href) ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Icone d={CONFIGURACOES.icone} className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
