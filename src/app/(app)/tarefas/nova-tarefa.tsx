import { Formulario } from "@/components/formulario";
import { TIPOS_TAREFA } from "@/lib/constantes";
import { hoje } from "@/lib/formato";
import { criarTarefa } from "./actions";

/** Formulário rápido de tarefa. Com `empresaId` fixo, esconde o seletor de empresa. */
export function NovaTarefa({
  empresas,
  empresaId,
}: {
  empresas?: { id: number; nome: string }[];
  empresaId?: number;
}) {
  return (
    <Formulario acao={criarTarefa} textoBotao="Adicionar tarefa" limparAoSalvar>
      <div className="grid gap-3 md:grid-cols-6">
        <input
          name="titulo"
          required
          placeholder="Ex.: Ligar para confirmar visita técnica"
          className="campo md:col-span-6"
        />
        <select name="tipo" className="campo md:col-span-2" defaultValue="ligacao">
          {Object.entries(TIPOS_TAREFA).map(([id, nome]) => (
            <option key={id} value={id}>
              {nome}
            </option>
          ))}
        </select>
        <input name="vencimento" type="date" defaultValue={hoje()} className="campo md:col-span-2" />
        <select name="prioridade" className="campo md:col-span-2" defaultValue="media">
          <option value="baixa">Prioridade baixa</option>
          <option value="media">Prioridade média</option>
          <option value="alta">Prioridade alta</option>
        </select>
        {empresaId ? (
          <input type="hidden" name="empresaId" value={empresaId} />
        ) : (
          <select name="empresaId" className="campo md:col-span-6" defaultValue="">
            <option value="">Sem empresa</option>
            {empresas?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        )}
      </div>
    </Formulario>
  );
}
