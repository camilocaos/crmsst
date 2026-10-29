import { carregarProposta } from "@/app/(app)/propostas/carregar";
import { gerarPropostaDocx } from "@/lib/documentos/proposta";
import { nomeArquivo, responderDocumento } from "@/lib/documentos/resposta";
import { numeroProposta } from "@/lib/propostas";
import { usuarioAtual } from "@/lib/sessao";

/** Baixa a proposta em Word (padrão) ou PDF (?formato=pdf). */
export async function GET(request: Request, ctx: RouteContext<"/api/documentos/proposta/[id]">) {
  const usuario = await usuarioAtual();
  if (!usuario || usuario.trocarSenha) return new Response("Faça login para baixar documentos.", { status: 401 });

  const dados = carregarProposta(Number((await ctx.params).id));
  if (!dados) return new Response("Proposta não encontrada.", { status: 404 });

  const docx = await gerarPropostaDocx(dados);
  const nome = nomeArquivo(`Proposta ${numeroProposta(dados.proposta.id, dados.proposta.criadoEm).replace("/", "-")} ${dados.empresa.nomeFantasia || dados.empresa.razaoSocial}`);
  return responderDocumento(docx, nome, new URL(request.url).searchParams.get("formato"));
}
