export const ETAPAS = [
  { id: "prospeccao", nome: "Prospecção", probabilidade: 10, cor: "bg-slate-400" },
  { id: "qualificacao", nome: "Qualificação", probabilidade: 25, cor: "bg-sky-500" },
  { id: "visita_tecnica", nome: "Visita técnica", probabilidade: 40, cor: "bg-indigo-500" },
  { id: "proposta", nome: "Proposta enviada", probabilidade: 60, cor: "bg-violet-500" },
  { id: "negociacao", nome: "Negociação", probabilidade: 80, cor: "bg-amber-500" },
  { id: "ganho", nome: "Ganho", probabilidade: 100, cor: "bg-emerald-500" },
  { id: "perdido", nome: "Perdido", probabilidade: 0, cor: "bg-rose-500" },
] as const;

export type EtapaId = (typeof ETAPAS)[number]["id"];
export const ETAPAS_ABERTAS: EtapaId[] = ["prospeccao", "qualificacao", "visita_tecnica", "proposta", "negociacao"];

export function nomeEtapa(id: string) {
  return ETAPAS.find((e) => e.id === id)?.nome ?? id;
}

export const STATUS_EMPRESA = {
  lead: { nome: "Lead", classe: "bg-sky-100 text-sky-800" },
  cliente: { nome: "Cliente", classe: "bg-emerald-100 text-emerald-800" },
  inativo: { nome: "Inativo", classe: "bg-slate-200 text-slate-700" },
} as const;

export const TIPOS_TAREFA = {
  ligacao: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  reuniao: "Reunião",
  visita: "Visita técnica",
  outro: "Outro",
} as const;

export const PRIORIDADES = {
  baixa: { nome: "Baixa", classe: "bg-slate-100 text-slate-700" },
  media: { nome: "Média", classe: "bg-amber-100 text-amber-800" },
  alta: { nome: "Alta", classe: "bg-rose-100 text-rose-800" },
} as const;

export const STATUS_PROPOSTA = {
  rascunho: { nome: "Rascunho", classe: "bg-slate-100 text-slate-700" },
  enviada: { nome: "Enviada", classe: "bg-sky-100 text-sky-800" },
  aceita: { nome: "Aceita", classe: "bg-emerald-100 text-emerald-800" },
  recusada: { nome: "Recusada", classe: "bg-rose-100 text-rose-800" },
} as const;

export const STATUS_CONTRATO = {
  rascunho: { nome: "Rascunho", classe: "bg-slate-100 text-slate-700" },
  enviado: { nome: "Enviado", classe: "bg-sky-100 text-sky-800" },
  assinado: { nome: "Assinado", classe: "bg-emerald-100 text-emerald-800" },
  cancelado: { nome: "Cancelado", classe: "bg-rose-100 text-rose-800" },
} as const;

export const AREAS = {
  seguranca: { nome: "Segurança do Trabalho", curto: "Segurança", classe: "bg-[#EAF4DC] text-[#3F6212]" },
  saude: { nome: "Saúde Ocupacional", curto: "Saúde", classe: "bg-[#E1F4F5] text-[#0E6E70]" },
} as const;

export const ORIGENS =["Indicação", "Site", "Instagram", "WhatsApp", "Google", "Prospecção ativa", "Evento", "Outro"];

export const SEGMENTOS = [
  "Construção civil",
  "Indústria",
  "Comércio",
  "Serviços",
  "Saúde",
  "Transporte e logística",
  "Agronegócio",
  "Alimentação",
  "Educação",
  "Outro",
];

export const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
