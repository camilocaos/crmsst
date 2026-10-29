import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { TelaAcesso } from "@/components/tela-acesso";
import { semUsuarios, usuarioAtual } from "@/lib/sessao";
import { entrar } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  await connection(); // lê o banco na hora do acesso, nunca no build
  if (semUsuarios()) redirect("/primeiro-acesso");
  if (await usuarioAtual()) redirect("/");
  return (
    <TelaAcesso titulo="Entrar">
      <Formulario acao={entrar} textoBotao="Entrar" larguraTotal>
        <div className="space-y-4">
          <Campo rotulo="Usuário">
            <input name="usuario" required autoFocus autoComplete="username" autoCapitalize="none" className="campo" />
          </Campo>
          <Campo rotulo="Senha">
            <input name="senha" type="password" required autoComplete="current-password" className="campo" />
          </Campo>
        </div>
      </Formulario>
    </TelaAcesso>
  );
}
