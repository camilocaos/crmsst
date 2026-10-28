// Publica a versão atual como Release no GitHub. Quem estiver com o app aberto
// recebe a janelinha de atualização (o app confere ao abrir e a cada 2 horas).
//
// Uso:
//   1. Aumente "version" em desktop/package.json (ex.: 1.2.0 -> 1.3.0)
//   2. Escreva as novidades em NOVIDADES.md (é o texto que aparece em "Ver o que mudou")
//   3. npm run app:instalador
//   4. npm run app:publicar
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const versao = JSON.parse(fs.readFileSync(path.join(raiz, "desktop", "package.json"), "utf8")).version;
const tag = `v${versao}`;
const pasta = path.join(raiz, "instalador");
const setup = `CRM-SST-Setup-${versao}.exe`;
const arquivos = [setup, `${setup}.blockmap`, "latest.yml", "LEIA-ME.txt"].map((f) => path.join(pasta, f));

const falta = arquivos.filter((f) => !fs.existsSync(f));
if (falta.length) {
  console.error(`Faltam arquivos da versão ${versao}. Rode "npm run app:instalador" antes.\n  ${falta.join("\n  ")}`);
  process.exit(1);
}

const latest = fs.readFileSync(path.join(pasta, "latest.yml"), "utf8");
if (!latest.includes(`version: ${versao}`)) {
  console.error(`latest.yml não é da versão ${versao}. Rode "npm run app:instalador" de novo.`);
  process.exit(1);
}

const git = (...args) => execFileSync("git", args, { cwd: raiz, encoding: "utf8" }).trim();
if (git("status", "--porcelain")) {
  console.error("Há alterações sem commit. Faça commit (e push) antes de publicar.");
  process.exit(1);
}
git("push", "--quiet");

const notas = path.join(raiz, "NOVIDADES.md");
if (!fs.existsSync(notas)) {
  console.error("Escreva as novidades desta versão em NOVIDADES.md antes de publicar.");
  process.exit(1);
}

execFileSync(
  "gh",
  ["release", "create", tag, ...arquivos, "--title", `CRM SST ${versao}`, "--notes-file", notas, "--target", "main", "--latest"],
  { cwd: raiz, stdio: "inherit" },
);
console.log(`\n✔ Versão ${versao} publicada. Quem estiver usando o app recebe o aviso de atualização.`);
