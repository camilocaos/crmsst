// Gera o instalador do Windows em ./instalador
// Uso: npm run app:instalador
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const raiz = process.cwd();
const standalone = path.join(raiz, ".next", "standalone");
const rodar = (cmd) => execSync(cmd, { stdio: "inherit", cwd: raiz });
const copiar = (de, para) => fs.cpSync(path.join(raiz, de), path.join(standalone, para), { recursive: true });

console.log("\n▶ 1/3 Build do Next.js");
fs.rmSync(path.join(raiz, ".next"), { recursive: true, force: true });
rodar("npx next build");

console.log("\n▶ 2/3 Montando o servidor interno");
if (!fs.existsSync(path.join(standalone, "server.js"))) {
  throw new Error("server.js não encontrado em .next/standalone");
}
copiar(".next/static", ".next/static");
copiar("public", "public");
copiar("drizzle", "drizzle");
copiar("documentos", "documentos"); // timbrados e logos das propostas e contratos
// O better-sqlite3 carrega o binário dinamicamente; garante o pacote inteiro
copiar("node_modules/better-sqlite3", "node_modules/better-sqlite3");
// Nunca levar bancos de dados locais para o instalador
fs.rmSync(path.join(standalone, "data"), { recursive: true, force: true });
fs.rmSync(path.join(standalone, ".env"), { force: true });

console.log("\n▶ 3/3 Gerando o instalador");
if (process.argv.includes("--teste")) {
  // Só o app aberto (sem instalador), para testar o atualizador com CRM_UPDATE_URL
  rodar("npx electron-builder --win dir --x64 --publish never -c.directories.output=instalador-teste");
  process.exit(0);
}
fs.rmSync(path.join(raiz, "instalador"), { recursive: true, force: true });
rodar("npx electron-builder --win nsis --x64 --publish never");

// Deixa na pasta só o que vai para a equipe (instalador + instruções)
// e o que o atualizador automático precisa (latest.yml + .blockmap)
const pasta = path.join(raiz, "instalador");
const setup = fs.readdirSync(pasta).find((f) => f.endsWith(".exe"));
const manter = new Set([setup, `${setup}.blockmap`, "latest.yml"]);
for (const item of fs.readdirSync(pasta)) {
  if (!manter.has(item)) fs.rmSync(path.join(pasta, item), { recursive: true, force: true });
}
const versao = JSON.parse(fs.readFileSync(path.join(raiz, "desktop", "package.json"), "utf8")).version;
fs.writeFileSync(
  path.join(pasta, "LEIA-ME.txt"),
  `CRM SST ${versao} - instalação
==============================

1. Dê dois cliques em ${setup}.
2. Se aparecer "O Windows protegeu o computador", clique em
   "Mais informações" e depois em "Executar assim mesmo".
   (Isso acontece porque o app ainda não tem assinatura digital paga.)
3. O CRM instala sozinho e abre. O atalho "CRM SST" fica na Área de Trabalho
   e no menu Iniciar.

Onde ficam os dados
-------------------
Tudo fica em: Documentos\\CRM SST
  - crm.db ........ banco de dados (empresas, funil, tarefas, propostas)
  - backups\\ ...... uma cópia automática por dia (guarda os últimos 30)
  - logs\\ ......... registro técnico, útil se algo der errado

No app: Configurações (engrenagem no menu lateral) > "Dados e backup".

Cada computador tem os próprios dados. Para levar seus dados para outro PC,
feche o app e copie o arquivo crm.db para a pasta Documentos\\CRM SST do outro PC.

Atualizações
------------
Quando sair uma versão nova, o app baixa sozinho e avisa no meio da tela.
Clique em "Reiniciar agora", ou em "Depois": aí atualiza na próxima vez que abrir.
Os dados em Documentos\\CRM SST não são apagados, nem ao desinstalar.

(Quem tem a versão 1.1.0 ou anterior precisa instalar esta versão manualmente
uma vez; a partir dela as atualizações chegam sozinhas.)`.replace(/\n/g, "\r\n"),
);

console.log(`\n✔ Pronto: instalador/${setup} + LEIA-ME.txt (+ latest.yml e .blockmap para o atualizador)`);
