import { timingSafeEqual } from "node:crypto";
import path from "node:path";
import { db } from "@/db";

/**
 * Gera uma cópia consistente do banco. Só o app desktop chama esta rota:
 * ele manda o token secreto que passou ao servidor ao iniciar (CRM_TOKEN).
 */
export async function POST(request: Request) {
  const esperado = process.env.CRM_TOKEN;
  const recebido = request.headers.get("x-crm-token") ?? "";
  if (!esperado || recebido.length !== esperado.length || !timingSafeEqual(Buffer.from(recebido), Buffer.from(esperado))) {
    return Response.json({ erro: "não autorizado" }, { status: 403 });
  }

  const { destino } = (await request.json().catch(() => ({}))) as { destino?: unknown };
  if (typeof destino !== "string" || !path.isAbsolute(destino) || !destino.toLowerCase().endsWith(".db")) {
    return Response.json({ erro: "destino inválido" }, { status: 400 });
  }

  await db.$client.backup(destino);
  return Response.json({ ok: true });
}
