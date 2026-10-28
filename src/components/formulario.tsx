"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { EstadoForm } from "@/lib/form";

type Acao = (estado: EstadoForm, formData: FormData) => Promise<EstadoForm>;

/**
 * Form ligado a uma Server Action. Mostra o erro devolvido pela action
 * e, se `limparAoSalvar`, zera os campos quando a action responde { ok: true }.
 */
export function Formulario({
  acao,
  children,
  textoBotao = "Salvar",
  limparAoSalvar = false,
  className = "",
  rodape,
  larguraTotal = false,
  mensagemSucesso,
}: {
  acao: Acao;
  children: ReactNode;
  textoBotao?: string;
  limparAoSalvar?: boolean;
  className?: string;
  rodape?: ReactNode;
  /** Botão de enviar ocupando a largura toda (telas de login). */
  larguraTotal?: boolean;
  /** Texto exibido quando a action responde { ok: true }. */
  mensagemSucesso?: string;
}) {
  const [estado, formAction] = useActionState(acao, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok && limparAoSalvar) ref.current?.reset();
  }, [estado, limparAoSalvar]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {estado?.erro && (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{estado.erro}</p>
      )}
      {estado?.ok && mensagemSucesso && (
        <p role="status" className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{mensagemSucesso}</p>
      )}
      <div className={`mt-4 flex items-center gap-3 ${larguraTotal ? "flex-col" : ""}`}>
        <BotaoEnviar className={larguraTotal ? "w-full py-2.5" : ""}>{textoBotao}</BotaoEnviar>
        {rodape}
      </div>
    </form>
  );
}

export function BotaoEnviar({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-marca-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-marca-700 disabled:opacity-60 ${className}`}
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}

/** Botão que confirma antes de enviar (excluir etc.). */
export function BotaoConfirmar({
  acao,
  mensagem,
  children,
  className = "",
}: {
  acao: () => Promise<void>;
  mensagem: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={acao}
      onSubmit={(e) => {
        if (!confirm(mensagem)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-erro transition hover:bg-rose-50 ${className}`}
      >
        {children}
      </button>
    </form>
  );
}
