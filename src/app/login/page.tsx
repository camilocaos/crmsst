import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { TelaAcesso } from "@/components/tela-acesso";
import { usuarioAtual } from "@/lib/sessao";
import { entrar } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (await usuarioAtual()) redirect("/");
  return (
    <TelaAcesso titulo="Entrar" subtitulo="Use seu usuário e senha para acessar o CRM.">
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
