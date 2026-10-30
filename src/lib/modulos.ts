/**
 * Áreas do sistema: nome, ícone e cor. O menu lateral e o título de cada
 * tela usam daqui, para cada área ter sempre a mesma cor.
 * (Classes escritas por extenso para o Tailwind encontrar.)
 */
export type Modulo = {
  href: string;
  nome: string;
  grupo: "Vendas" | "Rotina" | "Cadastros";
  icone: string;
  /** Ícone no menu escuro */
  menu: string;
  /** Barrinha do item ativo no menu */
  barra: string;
  /** Selo do título da tela (fundo claro) */
  selo: string;
};

export const MODULOS: Modulo[] = [
  {
    href: "/",
    nome: "Dashboard",
    grupo: "Vendas",
    icone: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
    menu: "bg-sky-500 text-white",
    barra: "bg-sky-400",
    selo: "bg-sky-100 text-sky-700",
  },
  {
    href: "/funil",
    nome: "Funil de vendas",
    grupo: "Vendas",
    icone: "M3 4h18l-7 8v6l-4 2v-8L3 4z",
    menu: "bg-violet-500 text-white",
    barra: "bg-violet-400",
    selo: "bg-violet-100 text-violet-700",
  },
  {
    href: "/propostas",
    nome: "Propostas",
    grupo: "Vendas",
    icone: "M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6zM14 3v6h6M8 13h8M8 17h5",
    menu: "bg-emerald-500 text-white",
    barra: "bg-emerald-400",
    selo: "bg-emerald-100 text-emerald-700",
  },
  {
    href: "/contratos",
    nome: "Contratos",
    grupo: "Vendas",
    icone: "M9 12h6M9 16h6M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zM14 3v5h5",
    menu: "bg-indigo-500 text-white",
    barra: "bg-indigo-400",
    selo: "bg-indigo-100 text-indigo-700",
  },
  {
    href: "/tarefas",
    nome: "Tarefas",
    grupo: "Rotina",
    icone: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h11",
    menu: "bg-amber-500 text-white",
    barra: "bg-amber-400",
    selo: "bg-amber-100 text-amber-700",
  },
  {
    href: "/empresas",
    nome: "Empresas",
    grupo: "Cadastros",
    icone: "M4 21V5a2 2 0 012-2h8a2 2 0 012 2v16M16 9h2a2 2 0 012 2v10M8 7h4M8 11h4M8 15h4M2 21h20",
    menu: "bg-cyan-500 text-white",
    barra: "bg-cyan-400",
    selo: "bg-cyan-100 text-cyan-700",
  },
  {
    href: "/servicos",
    nome: "Serviços",
    grupo: "Cadastros",
    icone: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z",
    menu: "bg-rose-500 text-white",
    barra: "bg-rose-400",
    selo: "bg-rose-100 text-rose-700",
  },
];

export const CONFIGURACOES: Modulo = {
  href: "/configuracoes",
  nome: "Configurações",
  grupo: "Cadastros",
  icone:
    "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z",
  menu: "bg-white/10 text-white/80",
  barra: "bg-white",
  selo: "bg-slate-200 text-slate-700",
};

/** Área da tela atual (a mais específica que combina com o endereço). */
export function moduloDe(pathname: string): Modulo | undefined {
  if (pathname === "/") return MODULOS[0];
  return [...MODULOS, CONFIGURACOES].filter((m) => m.href !== "/" && pathname.startsWith(m.href)).sort((a, b) => b.href.length - a.href.length)[0];
}

/** Atalhos do botão "+ Novo". */
export const NOVOS = [
  { href: "/empresas/nova", nome: "Empresa", modulo: "/empresas" },
  { href: "/funil/nova", nome: "Oportunidade", modulo: "/funil" },
  { href: "/propostas/nova", nome: "Proposta", modulo: "/propostas" },
  { href: "/contratos/novo", nome: "Contrato", modulo: "/contratos" },
  { href: "/tarefas", nome: "Tarefa", modulo: "/tarefas" },
];
