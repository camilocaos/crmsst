"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { exigirUsuario } from "@/lib/sessao";
import { servicos } from "@/db/schema";
import { checkbox, lerForm, numeroOpcional, textoObrigatorio, textoOpcional, type EstadoForm } from "@/lib/form";

const servicoSchema = z.object({
  nome: textoObrigatorio("Nome"),
  categoria: textoObrigatorio("Categoria"),
  descricao: textoOpcional,
  precoBase: numeroOpcional.transform((v) => v ?? 0),
  unidade: textoOpcional.transform((v) => v ?? "por empresa"),
  ativo: checkbox,
});

export async function criarServico(_: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  formData.set("ativo", "on");
  const r = lerForm(formData, servicoSchema);
  if (!r.valido) return { erro: r.erro };
  db.insert(servicos).values(r.dados).run();
  revalidatePath("/servicos");
  return { ok: true };
}

export async function atualizarServico(id: number, _: EstadoForm, formData: FormData): Promise<EstadoForm> {
  await exigirUsuario();
  const r = lerForm(formData, servicoSchema);
  if (!r.valido) return { erro: r.erro };
  db.update(servicos).set(r.dados).where(eq(servicos.id, id)).run();
  revalidatePath("/servicos");
  return { ok: true };
}
