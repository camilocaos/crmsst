"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { exigirUsuario } from "@/lib/sessao";
import { tarefas } from "@/db/schema";
import { TIPOS_TAREFA } from "@/lib/constantes";
import { hoje, somarDias } from "@/lib/formato";
import { idOpcional, lerForm, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";

const tipos = Object.keys(TIPOS_TAREFA) as [keyof typeof TIPOS_TAREFA, ...(keyof typeof TIPOS_TAREFA)[]];

const tarefaSchema = z.object({
  titulo: textoObrigatorio("Título"),
  tipo: z.enum(tipos).default("ligacao"),
  prioridade: z.enum(["baixa", "media", "alta"]).default("media"),
  vencimento: textoOpcional,
  descricao: textoOpcional,
  empresaId: idOpcional,
  oportunidadeId: idOpcional,
});

export async function criarTarefa(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, tarefaSchema);
  if (!r.valido) return { erro: r.erro };
  db.insert(tarefas).values(r.dados).run();
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function alternarTarefa(id: number) {
  await exigirUsuario();
  const t = db.select({ concluida: tarefas.concluida }).from(tarefas).where(eq(tarefas.id, id)).get();
  if (!t) return;
  db.update(tarefas).set({ concluida: !t.concluida }).where(eq(tarefas.id, id)).run();
  revalidatePath("/", "layout");
}

/** Joga o vencimento para amanhã (ou +1 dia a partir do vencimento, se for futuro). */
export async function adiarTarefa(id: number) {
  await exigirUsuario();
  const t = db.select({ vencimento: tarefas.vencimento }).from(tarefas).where(eq(tarefas.id, id)).get();
  if (!t) return;
  const base = t.vencimento && t.vencimento > hoje() ? t.vencimento : hoje();
  db.update(tarefas).set({ vencimento: somarDias(base, 1) }).where(eq(tarefas.id, id)).run();
  revalidatePath("/", "layout");
}

export async function excluirTarefa(id: number) {
  await exigirUsuario();
  db.delete(tarefas).where(eq(tarefas.id, id)).run();
  revalidatePath("/", "layout");
}
