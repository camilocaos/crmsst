import "server-only";
import { grauRiscoPorCnae } from "./grau-risco";

/** Dados públicos da Receita Federal já no formato do cadastro de empresas. */
export type DadosCnpj = {
  razaoSocial: string;
  nomeFantasia: string;
  cnae: string;
  cnaeDescricao: string;
  /** Grau de risco da NR-04 (Anexo I) pela atividade principal. */
  grauRisco: number | null;
  segmento: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  uf: string;
  situacao: string;
};

type RespostaReceita = {
  razao_social?: string;
  nome_fantasia?: string;
  cnae_fiscal?: number | string;
  cnae_fiscal_descricao?: string;
  logradouro?: string;
  descricao_tipo_de_logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
  ddd_telefone_1?: string;
  email?: string | null;
  descricao_situacao_cadastral?: string;
};

// BrasilAPI e, se ela falhar, a Minha Receita (mesmo formato de resposta)
const FONTES = [
  (cnpj: string) => `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
  (cnpj: string) => `https://minhareceita.org/${cnpj}`,
];

export function cnpjValido(cnpj: string) {
  const n = cnpj.replace(/\D/g, "");
  if (n.length !== 14 || /^(\d)\1{13}$/.test(n)) return false;
  const digito = (base: string) => {
    let soma = 0;
    let peso = base.length - 7;
    for (const c of base) {
      soma += Number(c) * peso--;
      if (peso < 2) peso = 9;
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  return digito(n.slice(0, 12)) === Number(n[12]) && digito(n.slice(0, 13)) === Number(n[13]);
}

export async function consultarCnpj(cnpj: string): Promise<DadosCnpj | "nao-encontrado" | "indisponivel"> {
  const n = cnpj.replace(/\D/g, "");
  let naoEncontrado = false;
  for (const fonte of FONTES) {
    try {
      const resposta = await fetch(fonte(n), {
        headers: { accept: "application/json", "user-agent": "CRM-Comercial-SST" },
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      if (resposta.status === 404 || resposta.status === 400) {
        naoEncontrado = true;
        continue;
      }
      if (!resposta.ok) continue;
      return converter((await resposta.json()) as RespostaReceita);
    } catch {
      // tenta a próxima fonte
    }
  }
  return naoEncontrado ? "nao-encontrado" : "indisponivel";
}

function converter(r: RespostaReceita): DadosCnpj {
  const cnaeNum = String(r.cnae_fiscal ?? "").padStart(7, "0");
  const cnae = r.cnae_fiscal ? `${cnaeNum.slice(0, 4)}-${cnaeNum.slice(4, 5)}/${cnaeNum.slice(5)}` : "";
  const logradouro = [r.descricao_tipo_de_logradouro && !r.logradouro?.startsWith(r.descricao_tipo_de_logradouro) ? r.descricao_tipo_de_logradouro : "", r.logradouro]
    .filter(Boolean)
    .join(" ");
  const numero = r.numero && r.numero !== "S/N" ? r.numero : "";
  const cep = r.cep ? r.cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2") : "";
  // Nome fantasia e endereço ficam como a Receita manda (em maiúsculas) para não estragar siglas
  const endereco = [[logradouro, numero].filter(Boolean).join(", "), r.complemento ?? "", r.bairro ?? "", cep ? `CEP ${cep}` : ""]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" - ");

  return {
    razaoSocial: (r.razao_social ?? "").trim(),
    nomeFantasia: (r.nome_fantasia ?? "").trim(),
    cnae,
    cnaeDescricao: r.cnae_fiscal_descricao ?? "",
    grauRisco: grauRiscoPorCnae(cnae),
    segmento: segmentoPorCnae(cnaeNum),
    telefone: formatarTelefone(r.ddd_telefone_1 ?? ""),
    email: (r.email ?? "").toLowerCase(),
    endereco,
    cidade: titulo(r.municipio ?? ""),
    uf: (r.uf ?? "").toUpperCase(),
    situacao: r.descricao_situacao_cadastral ?? "",
  };
}

/** Segmento aproximado pela divisão do CNAE (2 primeiros dígitos). */
function segmentoPorCnae(cnae: string) {
  const d = Number(cnae.slice(0, 2));
  if (!d) return "";
  if (d >= 1 && d <= 3) return "Agronegócio";
  if (d >= 10 && d <= 11) return "Alimentação";
  if ((d >= 5 && d <= 9) || (d >= 12 && d <= 33)) return "Indústria";
  if (d >= 41 && d <= 43) return "Construção civil";
  if (d >= 45 && d <= 47) return "Comércio";
  if (d >= 49 && d <= 53) return "Transporte e logística";
  if (d >= 55 && d <= 56) return "Alimentação";
  if (d === 85) return "Educação";
  if (d >= 86 && d <= 88) return "Saúde";
  return "Serviços";
}

function formatarTelefone(bruto: string) {
  const n = bruto.replace(/\D/g, "");
  if (n.length === 11) return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
  if (n.length === 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return bruto;
}

const MINUSCULAS = new Set(["de", "da", "do", "das", "dos", "e", "em"]);
function titulo(texto: string) {
  return texto
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
