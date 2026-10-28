// Sobe o `next dev` apontando para o banco de demonstração (data/crm-demo.db).
import { spawn } from "node:child_process";
import path from "node:path";

const env = { ...process.env, CRM_DB_PATH: path.join(process.cwd(), "data", "crm-demo.db") };
const next = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const filho = spawn(process.execPath, [next, "dev", ...process.argv.slice(2)], { stdio: "inherit", env });
filho.on("exit", (codigo) => process.exit(codigo ?? 0));
