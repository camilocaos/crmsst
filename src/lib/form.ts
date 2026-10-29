import { z } from "zod";

/** `link` aparece junto do erro (ex.: abrir o cadastro que já existe). */
export type EstadoForm = { erro?: string; ok?: boolean; link?: { href: string; texto: string } } | undefined;

/** Converte FormData em objeto, trocando "" por null, e valida com zod. */
export function lerForm<T extends z.ZodType>(
  formData: FormData,
  schema: T,
): { valido: false; erro: string } | { valido: true; dados: z.output<T> } {
  const bruto: Record<string, unknown> = {};
  for (const [chave, valor] of formData.entries()) {
    if (chave.startsWith("$ACTION")) continue;
    const texto = typeof valor === "string" ? valor.trim() : valor;
    bruto[chave] = texto === "" ? null : texto;
  }
  const resultado = schema.safeParse(bruto);
  if (!resultado.success) {
    const primeiro = resultado.error.issues[0];
    const campo = primeiro?.path.join(".");
    return { valido: false, erro: campo ? `${campo}: ${primeiro.message}` : "Dados inválidos" };
  }
  return { valido: true, dados: resultado.data };
}

// Pedaços reaproveitados nos schemas
export const textoOpcional = z.string().nullish().transform((v) => v ?? null);
export const textoObrigatorio = (nome: string) =>
  z.string({ error: `${nome} é obrigatório` }).min(1, `${nome} é obrigatório`);
export const numeroOpcional = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((v, ctx) => {
    if (v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\./g, "").replace(",", "."));
    if (Number.isNaN(n)) {
      ctx.addIssue({ code: "custom", message: "número inválido" });
      return z.NEVER;
    }
    return n;
  });
export const idOpcional = numeroOpcional.transform((v) => (v ? Math.trunc(v) : null));
export const nomeUsuarioSchema = z
  .string({ error: "Usuário é obrigatório" })
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, "use de 3 a 30 letras minúsculas, números, ponto, hífen ou _");

export const checkbox = z
  .string()
  .nullish()
  .transform((v) => v === "on" || v === "true" || v === "1");
