import "server-only";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

// Abre o .docx no Word (sem janela, somente leitura, sem macros) e exporta em PDF.
const SCRIPT = `
$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3
try {
  $doc = $word.Documents.Open($env:CRM_DOCX, $false, $true, $false)
  $doc.ExportAsFixedFormat($env:CRM_PDF, 17)
  $doc.Close($false)
} finally {
  $word.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
}
`;

export class SemWordError extends Error {}

/** Converte um .docx em PDF usando o Microsoft Word do computador (Windows). */
export async function docxParaPdf(docx: Buffer): Promise<Buffer> {
  if (process.platform !== "win32") throw new SemWordError("A conversão para PDF usa o Microsoft Word e só funciona no Windows.");
  const pasta = path.join(os.tmpdir(), `crm-pdf-${randomUUID()}`);
  await fs.mkdir(pasta, { recursive: true });
  const entrada = path.join(pasta, "documento.docx");
  const saida = path.join(pasta, "documento.pdf");
  try {
    await fs.writeFile(entrada, docx);
    await new Promise<void>((ok, falha) =>
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", SCRIPT],
        { env: { ...process.env, CRM_DOCX: entrada, CRM_PDF: saida }, timeout: 120_000, windowsHide: true },
        (erro, _saida, stderr) => (erro ? falha(new SemWordError(stderr?.toString().trim() || erro.message)) : ok()),
      ),
    );
    return await fs.readFile(saida);
  } finally {
    await fs.rm(pasta, { recursive: true, force: true }).catch(() => {});
  }
}
