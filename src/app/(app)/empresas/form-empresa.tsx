import { Campo } from "@/components/ui";
import { Formulario } from "@/components/formulario";
import { ORIGENS, SEGMENTOS, UFS } from "@/lib/constantes";
import { formatarCnpj } from "@/lib/formato";
import type { EstadoForm } from "@/lib/form";
import type { Empresa } from "@/db/schema";
import { CampoCnpj } from "./campo-cnpj";

export function FormEmpresa({
  acao,
  empresa,
}: {
  acao: (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;
  empresa?: Empresa;
}) {
  return (
    <Formulario acao={acao} textoBotao={empresa ? "Salvar alterações" : "Cadastrar empresa"}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2 md:max-w-md">
          <span className="rotulo">CNPJ</span>
          <CampoCnpj valorInicial={formatarCnpj(empresa?.cnpj)} empresaId={empresa?.id} />
        </div>
        <Campo rotulo="Razão social *">
          <input name="razaoSocial" required defaultValue={empresa?.razaoSocial} className="campo" />
        </Campo>
        <Campo rotulo="Nome fantasia">
          <input name="nomeFantasia" defaultValue={empresa?.nomeFantasia ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Segmento">
          <select name="segmento" defaultValue={empresa?.segmento ?? ""} className="campo">
            <option value="">Selecione</option>
            {SEGMENTOS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Campo>
        <div className="grid grid-cols-3 gap-3">
          <Campo rotulo="CNAE">
            <input name="cnae" defaultValue={empresa?.cnae ?? ""} placeholder="4120-4/00" className="campo" />
          </Campo>
          <Campo rotulo="Grau de risco">
            <select name="grauRisco" defaultValue={empresa?.grauRisco ?? ""} className="campo">
              <option value="">—</option>
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Funcionários">
            <input name="numFuncionarios" type="number" min={0} defaultValue={empresa?.numFuncionarios ?? ""} className="campo" />
          </Campo>
        </div>
        <Campo rotulo="Telefone">
          <input name="telefone" defaultValue={empresa?.telefone ?? ""} placeholder="(61) 99999-9999" className="campo" />
        </Campo>
        <Campo rotulo="E-mail">
          <input name="email" type="email" defaultValue={empresa?.email ?? ""} className="campo" />
        </Campo>
        <Campo rotulo="Endereço" className="md:col-span-2">
          <input name="endereco" defaultValue={empresa?.endereco ?? ""} className="campo" />
        </Campo>
        <div className="grid grid-cols-[1fr_6rem] gap-3">
          <Campo rotulo="Cidade">
            <input name="cidade" defaultValue={empresa?.cidade ?? ""} className="campo" />
          </Campo>
          <Campo rotulo="UF">
            <select name="uf" defaultValue={empresa?.uf ?? ""} className="campo">
              <option value="">—</option>
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
          </Campo>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Campo rotulo="Origem">
            <select name="origem" defaultValue={empresa?.origem ?? ""} className="campo">
              <option value="">Selecione</option>
              {ORIGENS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Campo>
          <Campo rotulo="Status">
            <select name="status" defaultValue={empresa?.status ?? "lead"} className="campo">
              <option value="lead">Lead</option>
              <option value="cliente">Cliente</option>
              <option value="inativo">Inativo</option>
            </select>
          </Campo>
        </div>
        <Campo rotulo="Observações" className="md:col-span-2">
          <textarea name="observacoes" rows={3} defaultValue={empresa?.observacoes ?? ""} className="campo" />
        </Campo>
      </div>
    </Formulario>
  );
}
