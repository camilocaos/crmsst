"use client";

export function BotaoImprimir() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg bg-marca-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-marca-700"
    >
      Imprimir / salvar PDF
    </button>
  );
}
