// Hook do electron-builder: copia o node_modules do servidor Next.js para dentro do app.
// (o electron-builder sempre ignora pastas node_modules em extraResources)
const fs = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(contexto) {
  const origem = path.join(contexto.packager.projectDir, ".next", "standalone", "node_modules");
  const destino = path.join(contexto.appOutDir, "resources", "server", "node_modules");
  fs.cpSync(origem, destino, { recursive: true });
  const sqlite = path.join(destino, "better-sqlite3", "prebuilds", "win32-x64.node");
  if (!fs.existsSync(sqlite)) throw new Error(`SQLite não encontrado em ${sqlite}`);
  console.log("  • node_modules do servidor copiado para", destino);
};
