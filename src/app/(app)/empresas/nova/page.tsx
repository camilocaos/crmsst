import type { Metadata } from "next";
import { Cabecalho, Cartao } from "@/components/ui";
import { FormEmpresa } from "../form-empresa";
import { criarEmpresa } from "../actions";

export const metadata: Metadata = { title: "Nova empresa" };

export default function NovaEmpresaPage() {
  return (
    <div className="max-w-3xl">
      <Cabecalho titulo="Nova empresa" subtitulo="Cadastre um lead ou cliente." />
      <Cartao>
        <FormEmpresa acao={criarEmpresa} />
      </Cartao>
    </div>
  );
}
