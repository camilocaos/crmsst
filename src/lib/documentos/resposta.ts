import "server-only";
import { docxParaPdf, SemWordError } from "./pdf";

const TIPO_DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Nome de arquivo sem acentos nem caracteres proibidos no Windows. */
export function nomeArquivo(base: string) {
  return base
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s.-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

/** Devolve o documento em Word ou PDF, como download. */
export async function responderDocumento(docx: Buffer, nome: string, formato: string | null) {
  if (formato === "pdf") {
    try {
      const pdf = await docxParaPdf(docx);
      return new Response(new Uint8Array(pdf), {
        headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="${nome}.pdf"` },
      });
    } catch (erro) {
      const motivo = erro instanceof SemWordError ? "" : ` (${(erro as Error).message})`;
      return new Response(
        `Não foi possível gerar o PDF: é preciso ter o Microsoft Word instalado neste computador${motivo}. Baixe a versão em Word e use "Salvar como PDF".`,
        { status: 501, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }
  }
  return new Response(new Uint8Array(docx), {
    headers: { "content-type": TIPO_DOCX, "content-disposition": `attachment; filename="${nome}.docx"` },
  });
}
