// Abre o app desktop em modo desenvolvimento (com recarregamento do Next.js).
// Uso: npm run app:dev
import { spawn } from "node:child_process";
import crypto from "node:crypto";
import http from "node:http";
import path from "node:path";

const raiz = process.cwd();
const URL_DEV = "http://localhost:3000";
const env = {
  ...process.env,
  CRM_TOKEN: crypto.randomBytes(24).toString("hex"),
  CRM_DATA_DIR: path.join(raiz, "data"),
  CRM_DB_PATH: path.join(raiz, "data", "crm.db"),
  CRM_DEV_URL: URL_DEV,
};

const bin = (pacote, arquivo) => path.join(raiz, "node_modules", pacote, ...arquivo);
const next = spawn(process.execPath, [bin("next", ["dist", "bin", "next"]), "dev"], { stdio: "inherit", env });

function quandoPronto(cb) {
  http.get(URL_DEV, (r) => (r.resume(), cb())).on("error", () => setTimeout(() => quandoPronto(cb), 500));
}

quandoPronto(() => {
  const electron = spawn(process.execPath, [bin("electron", ["cli.js"]), "desktop"], { stdio: "inherit", env });
  electron.on("exit", () => {
    next.kill();
    process.exit(0);
  });
});
