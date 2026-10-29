import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Formulario } from "@/components/formulario";
import { TelaAcesso } from "@/components/tela-acesso";
import { exigirUsuario } from "@/lib/sessao";
import { sair, trocarSenhaPrimeiroAcesso } from "../login/actions";
import { CamposSenha } from "@/components/campos-senha";

export const metadata: Metadata = { title: "Trocar senha" };

export default async function TrocarSenhaPage() {
  const usuario = await exigirUsuario({ permitirTrocaPendente: true });
  if (!usuario.trocarSenha) redirect("/");

  return (
    <TelaAcesso
      titulo="Crie sua senha"
      subtitulo={`Olá, ${usuario.nome}! Crie uma nova senha para continuar.`}
    >
      <Formulario
        acao={trocarSenhaPrimeiroAcesso}
        textoBotao="Salvar e entrar"
        larguraTotal
        rodape={
          <button formAction={sair} formNoValidate className="text-sm text-slate-500 hover:text-slate-800">
            Sair
          </button>
        }
      >
        <CamposSenha />
      </Formulario>
    </TelaAcesso>
  );
}
