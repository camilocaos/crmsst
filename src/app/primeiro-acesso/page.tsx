import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { TelaAcesso } from "@/components/tela-acesso";
import { semUsuarios } from "@/lib/sessao";
import { criarPrimeiroAdmin } from "../login/actions";

export const metadata: Metadata = { title: "Primeiro acesso" };

export default async function PrimeiroAcessoPage() {
  await connection();
  if (!semUsuarios()) redirect("/login");

  return (
    <TelaAcesso
      titulo="Bem-vindo ao CRM"
      subtitulo="Este é o primeiro acesso neste computador. Crie o seu usuário de administrador: só você vai saber a senha."
    >
      <Formulario acao={criarPrimeiroAdmin} textoBotao="Criar acesso e entrar" larguraTotal>
        <div className="space-y-4">
          <Campo rotulo="Seu nome">
            <input name="nome" required autoFocus className="campo" />
          </Campo>
          <Campo rotulo="Usuário (para entrar)">
            <input name="usuario" required autoCapitalize="none" autoComplete="username" placeholder="ex.: maria.silva" className="campo" />
          </Campo>
          <Campo rotulo="Senha (mínimo 6 caracteres)">
            <input name="senha" type="password" required minLength={6} autoComplete="new-password" className="campo" />
          </Campo>
          <Campo rotulo="Confirme a senha">
            <input name="confirmacao" type="password" required minLength={6} autoComplete="new-password" className="campo" />
          </Campo>
        </div>
      </Formulario>
    </TelaAcesso>
  );
}
