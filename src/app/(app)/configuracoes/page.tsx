import type { Metadata } from "next";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { Cabecalho, Campo, Cartao, Selo, TituloCartao } from "@/components/ui";
import { BotaoConfirmar, Formulario } from "@/components/formulario";
import { CamposSenha } from "@/components/campos-senha";
import { lerConfig } from "@/lib/config";
import { formatarData } from "@/lib/formato";
import { exigirUsuario } from "@/lib/sessao";
import { trocarSenha } from "@/app/login/actions";
import { criarUsuario, excluirUsuario, redefinirSenha, salvarEmpresa, salvarPerfil } from "./actions";
import { AbaDados } from "./aba-dados";

export const metadata: Metadata = { title: "Configurações" };

const ABAS = [
  { id: "empresa", nome: "Empresa e propostas" },
  { id: "conta", nome: "Minha conta" },
  { id: "usuarios", nome: "Usuários" },
  { id: "dados", nome: "Dados e backup" },
] as const;

export default async function ConfiguracoesPage({ searchParams }: PageProps<"/configuracoes">) {
  const eu = await exigirUsuario();
  const { aba } = await searchParams;
  const abaAtual = ABAS.find((a) => a.id === aba)?.id ?? "empresa";

  return (
    <div className="max-w-3xl">
      <Cabecalho titulo="Configurações" />
      <nav className="mb-6 flex w-fit flex-wrap gap-1 rounded-lg bg-slate-200/60 p-1 text-sm">
        {ABAS.map((a) => (
          <Link
            key={a.id}
            href={`/configuracoes?aba=${a.id}`}
            className={`rounded-md px-3 py-1.5 ${
              abaAtual === a.id ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {a.nome}
          </Link>
        ))}
      </nav>

      {abaAtual === "empresa" && <AbaEmpresa />}
      {abaAtual === "conta" && <AbaConta nome={eu.nome} usuario={eu.usuario} />}
      {abaAtual === "usuarios" && <AbaUsuarios meuId={eu.id} />}
      {abaAtual === "dados" && <AbaDados />}
    </div>
  );
}

function AbaEmpresa() {
  const config = lerConfig();
  return (
    <Cartao>
      <Formulario acao={salvarEmpresa} mensagemSucesso="Configurações salvas.">
        <h2 className="text-sm font-semibold text-slate-800">Sua empresa</h2>
        <p className="mb-4 text-xs text-slate-500">Esses dados aparecem no cabeçalho das propostas.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Campo rotulo="Nome da empresa *" className="md:col-span-2">
            <input name="nomeEmpresa" required defaultValue={config.nomeEmpresa} className="campo" />
          </Campo>
          <Campo rotulo="CNPJ">
            <input name="cnpjEmpresa" defaultValue={config.cnpjEmpresa} placeholder="00.000.000/0000-00" className="campo" />
          </Campo>
          <Campo rotulo="Telefone / WhatsApp">
            <input name="telefoneEmpresa" defaultValue={config.telefoneEmpresa} className="campo" />
          </Campo>
          <Campo rotulo="E-mail">
            <input name="emailEmpresa" type="email" defaultValue={config.emailEmpresa} className="campo" />
          </Campo>
          <Campo rotulo="Endereço">
            <input name="enderecoEmpresa" defaultValue={config.enderecoEmpresa} className="campo" />
          </Campo>
        </div>

        <h2 className="mt-8 text-sm font-semibold text-slate-800">Vendas e propostas</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Campo rotulo="Meta de vendas mensal (R$)">
            <input name="metaMensal" type="number" min={0} step="100" defaultValue={config.metaMensal} className="campo" />
          </Campo>
          <Campo rotulo="Validade padrão das propostas (dias)">
            <input name="validadePropostaDias" type="number" min={1} defaultValue={config.validadePropostaDias} className="campo" />
          </Campo>
          <Campo rotulo="Condições de pagamento padrão" className="md:col-span-2">
            <textarea name="condicoesPagamento" rows={3} defaultValue={config.condicoesPagamento} className="campo" />
          </Campo>
          <Campo rotulo="Margem sobre as medições (R$ por medição)">
            <input name="margemMedicoes" type="number" min={0} step="10" defaultValue={config.margemMedicoes} className="campo" />
          </Campo>
          <p className="self-end pb-2 text-xs text-slate-500">
            Somada ao custo do fornecedor em cada avaliação quantitativa. A taxa de deslocamento não tem margem.
          </p>
        </div>
      </Formulario>
    </Cartao>
  );
}

function AbaConta({ nome, usuario }: { nome: string; usuario: string }) {
  return (
    <div className="space-y-6">
      <Cartao>
        <TituloCartao>Perfil</TituloCartao>
        <Formulario acao={salvarPerfil} mensagemSucesso="Perfil atualizado.">
          <div className="grid gap-4 md:grid-cols-2">
            <Campo rotulo="Nome (aparece no menu)">
              <input name="nome" required defaultValue={nome} className="campo" />
            </Campo>
            <Campo rotulo="Usuário (para entrar)">
              <input name="usuario" required defaultValue={usuario} autoCapitalize="none" className="campo" />
            </Campo>
          </div>
        </Formulario>
      </Cartao>
      <Cartao>
        <TituloCartao>Trocar senha</TituloCartao>
        <Formulario acao={trocarSenha} textoBotao="Trocar senha" limparAoSalvar mensagemSucesso="Senha alterada.">
          <div className="max-w-sm">
            <CamposSenha />
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}

function AbaUsuarios({ meuId }: { meuId: number }) {
  const lista = db.select().from(usuarios).orderBy(asc(usuarios.nome)).all();
  return (
    <div className="space-y-6">
      <Cartao>
        <TituloCartao>Quem pode entrar neste computador</TituloCartao>
        <ul className="divide-y divide-slate-100">
          {lista.map((u) => (
            <li key={u.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {u.nome} {u.id === meuId && <Selo classe="bg-marca-100 text-marca-700">você</Selo>}{" "}
                    {u.trocarSenha && <Selo classe="bg-amber-100 text-amber-800">troca de senha pendente</Selo>}
                  </p>
                  <p className="text-xs text-slate-500">
                    @{u.usuario} · desde {formatarData(u.criadoEm)}
                  </p>
                </div>
                {u.id !== meuId && (
                  <BotaoConfirmar
                    acao={excluirUsuario.bind(null, u.id)}
                    mensagem={`Remover o acesso de ${u.nome}? Os dados do CRM continuam.`}
                    className="px-2.5 py-1 text-xs"
                  >
                    Remover
                  </BotaoConfirmar>
                )}
              </div>
              {u.id !== meuId && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-marca-700">Redefinir senha</summary>
                  <Formulario acao={redefinirSenha.bind(null, u.id)} textoBotao="Redefinir" limparAoSalvar mensagemSucesso="Senha redefinida. A pessoa vai precisar trocá-la ao entrar." className="mt-2">
                    <input name="senha" type="password" required minLength={6} placeholder="Senha provisória" className="campo max-w-xs" />
                  </Formulario>
                </details>
              )}
            </li>
          ))}
        </ul>
      </Cartao>
      <Cartao>
        <TituloCartao>Novo usuário</TituloCartao>
        <p className="-mt-2 mb-4 text-xs text-slate-500">
          A pessoa entra com a senha provisória e o app pede para ela criar a própria senha.
        </p>
        <Formulario acao={criarUsuario} textoBotao="Criar usuário" limparAoSalvar mensagemSucesso="Usuário criado.">
          <div className="grid gap-4 md:grid-cols-3">
            <Campo rotulo="Nome">
              <input name="nome" required className="campo" />
            </Campo>
            <Campo rotulo="Usuário">
              <input name="usuario" required autoCapitalize="none" placeholder="ex.: maria.silva" className="campo" />
            </Campo>
            <Campo rotulo="Senha provisória">
              <input name="senha" type="password" required minLength={6} autoComplete="new-password" className="campo" />
            </Campo>
          </div>
        </Formulario>
      </Cartao>
    </div>
  );
}
