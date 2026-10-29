import { carregarContrato } from "@/app/(app)/contratos/carregar";
import { gerarContratoDocx } from "@/lib/documentos/contrato";
import { nomeArquivo, responderDocumento } from "@/lib/documentos/resposta";
import { usuarioAtual } from "@/lib/sessao";

/** Baixa o contrato em Word (padrão) ou PDF (?formato=pdf). */
export async function GET(request: Request, ctx: RouteContext<"/api/documentos/contrato/[id]">) {
  const usuario = await usuarioAtual();
  if (!usuario || usuario.trocarSenha) return new Response("Faça login para baixar documentos.", { status: 401 });

  const dados = carregarContrato(Number((await ctx.params).id));
  if (!dados) return new Response("Contrato não encontrado.", { status: 404 });

  const docx = await gerarContratoDocx(dados);
  const unidade = dados.contrato.area === "saude" ? "Saude" : "Seguranca";
  const nome = nomeArquivo(`Contrato ${unidade} ${dados.empresa.nomeFantasia || dados.empresa.razaoSocial}`);
  return responderDocumento(docx, nome, new URL(request.url).searchParams.get("formato"));
}
