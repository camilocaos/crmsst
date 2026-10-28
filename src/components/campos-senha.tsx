import { Campo } from "@/components/ui";

export function CamposSenha() {
  return (
    <div className="space-y-4">
      <Campo rotulo="Senha atual">
        <input name="senhaAtual" type="password" required autoComplete="current-password" className="campo" />
      </Campo>
      <Campo rotulo="Nova senha (mínimo 6 caracteres)">
        <input name="novaSenha" type="password" required minLength={6} autoComplete="new-password" className="campo" />
      </Campo>
      <Campo rotulo="Confirme a nova senha">
        <input name="confirmacao" type="password" required minLength={6} autoComplete="new-password" className="campo" />
      </Campo>
    </div>
  );
}
