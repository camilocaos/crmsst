// Processo principal do app desktop (Electron).
// Sobe o servidor Next.js interno numa porta livre e abre a janela do CRM.
const { app, BrowserWindow, Menu, dialog, shell, utilityProcess } = require("electron");
const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const path = require("node:path");

const DEV_URL = process.env.CRM_DEV_URL; // ex.: http://localhost:3000 (modo desenvolvimento)
const PASTA_DADOS = process.env.CRM_DATA_DIR || path.join(app.getPath("documents"), "CRM SST");
const ARQUIVO_DB = path.join(PASTA_DADOS, "crm.db");
const PASTA_BACKUPS = path.join(PASTA_DADOS, "backups");
const BACKUPS_MANTIDOS = 30;
// Segredo da sessão: só este processo consegue chamar a rota de backup do servidor
const TOKEN = process.env.CRM_TOKEN || crypto.randomBytes(24).toString("hex");

let janela = null;
let servidor = null;
let urlServidor = null;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (janela) {
      if (janela.isMinimized()) janela.restore();
      janela.focus();
    }
  });
  app.whenReady().then(iniciar);
}

async function iniciar() {
  fs.mkdirSync(PASTA_BACKUPS, { recursive: true });
  criarMenu();
  const splash = mostrarSplash();

  try {
    const url = DEV_URL || (await subirServidor());
    urlServidor = url;
    await esperarServidor(url);
    abrirJanela(url);
    backupDiario().catch((erro) => console.error("Backup diário falhou:", erro));
  } catch (erro) {
    dialog.showErrorBox(
      "Não foi possível abrir o CRM",
      `${erro.message}\n\nDetalhes em: ${path.join(PASTA_DADOS, "logs", "servidor.log")}`,
    );
    app.quit();
  } finally {
    splash.destroy();
  }
}

function mostrarSplash() {
  const splash = new BrowserWindow({ width: 360, height: 200, frame: false, resizable: false, show: true, backgroundColor: "#064e3b" });
  const html = `<body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#064e3b;color:#ecfdf5;font-family:Segoe UI,sans-serif">
    <div style="width:56px;height:56px;border-radius:12px;background:#10b981;display:flex;align-items:center;justify-content:center;font-weight:700;color:white">SST</div>
    <p style="margin-top:16px">Abrindo o CRM...</p></body>`;
  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return splash;
}

function portaLivre() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.unref();
    s.on("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function subirServidor() {
  const pastaServidor = path.join(process.resourcesPath, "server");
  const porta = await portaLivre();
  const pastaLogs = path.join(PASTA_DADOS, "logs");
  fs.mkdirSync(pastaLogs, { recursive: true });
  const log = fs.createWriteStream(path.join(pastaLogs, "servidor.log"), { flags: "w" });

  servidor = utilityProcess.fork(path.join(pastaServidor, "server.js"), [], {
    cwd: pastaServidor,
    stdio: "pipe",
    serviceName: "CRM SST - servidor",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(porta),
      HOSTNAME: "127.0.0.1",
      CRM_DB_PATH: ARQUIVO_DB,
      CRM_TOKEN: TOKEN,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  servidor.stdout?.pipe(log);
  servidor.stderr?.pipe(log);
  servidor.on("exit", (codigo) => {
    servidor = null;
    if (codigo !== 0 && !app.isQuitting) {
      dialog.showErrorBox("O CRM parou", `O servidor interno fechou (código ${codigo}). Abra o app novamente.`);
      app.quit();
    }
  });
  return `http://127.0.0.1:${porta}`;
}

function esperarServidor(url, limiteMs = 60000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const tentar = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - inicio > limiteMs) reject(new Error("O servidor interno demorou demais para iniciar."));
        else setTimeout(tentar, 300);
      });
    };
    tentar();
  });
}

function abrirJanela(url) {
  janela = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "CRM SST",
    backgroundColor: "#f4f6f8",
    show: false,
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  janela.maximize();
  janela.once("ready-to-show", () => janela.show());
  janela.loadURL(url);

  // Links externos (WhatsApp, e-mail, sites) abrem no navegador padrão
  const interno = (alvo) => alvo.startsWith(url);
  janela.webContents.setWindowOpenHandler(({ url: alvo }) => {
    if (!interno(alvo)) shell.openExternal(alvo);
    return { action: "deny" };
  });
  janela.webContents.on("will-navigate", (evento, alvo) => {
    if (!interno(alvo)) {
      evento.preventDefault();
      shell.openExternal(alvo);
    }
  });
  janela.on("closed", () => (janela = null));
}

function dataHoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pede ao servidor uma cópia consistente do banco (inclui o que está no arquivo -wal). */
async function gerarBackup(destino) {
  const resposta = await fetch(`${urlServidor}/api/backup`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-crm-token": TOKEN },
    body: JSON.stringify({ destino }),
  }).catch(() => null);
  return Boolean(resposta?.ok);
}

/** Um backup por dia na pasta de dados; mantém só os últimos. */
async function backupDiario() {
  const destino = path.join(PASTA_BACKUPS, `crm-${dataHoje()}.db`);
  if (!fs.existsSync(destino)) await gerarBackup(destino);
  const antigos = fs
    .readdirSync(PASTA_BACKUPS)
    .filter((f) => /^crm-\d{4}-\d{2}-\d{2}\.db$/.test(f))
    .sort()
    .slice(0, -BACKUPS_MANTIDOS);
  for (const f of antigos) fs.rmSync(path.join(PASTA_BACKUPS, f), { force: true });
}

async function salvarBackupComo() {
  const { canceled, filePath } = await dialog.showSaveDialog(janela, {
    title: "Salvar backup do CRM",
    defaultPath: path.join(app.getPath("documents"), `backup-crm-${dataHoje()}.db`),
    filters: [{ name: "Banco do CRM", extensions: ["db"] }],
  });
  if (canceled || !filePath) return;
  if (await gerarBackup(filePath)) {
    dialog.showMessageBox(janela, { type: "info", message: "Backup salvo com sucesso.", detail: filePath });
  } else {
    dialog.showErrorBox("Erro no backup", "Não foi possível salvar o backup.");
  }
}

function criarMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: "Arquivo",
      submenu: [
        { label: "Abrir pasta de dados", click: () => shell.openPath(PASTA_DADOS) },
        { label: "Salvar backup como...", click: salvarBackupComo },
        { type: "separator" },
        { label: "Sair", role: "quit" },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { label: "Desfazer", role: "undo" },
        { label: "Refazer", role: "redo" },
        { type: "separator" },
        { label: "Recortar", role: "cut" },
        { label: "Copiar", role: "copy" },
        { label: "Colar", role: "paste" },
        { label: "Selecionar tudo", role: "selectAll" },
      ],
    },
    {
      label: "Exibir",
      submenu: [
        { label: "Recarregar", role: "reload" },
        { type: "separator" },
        { label: "Aumentar zoom", role: "zoomIn" },
        { label: "Diminuir zoom", role: "zoomOut" },
        { label: "Zoom normal", role: "resetZoom" },
        { type: "separator" },
        { label: "Tela cheia", role: "togglefullscreen" },
        ...(DEV_URL || !app.isPackaged ? [{ label: "Ferramentas do desenvolvedor", role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "Ajuda",
      submenu: [
        {
          label: "Sobre o CRM SST",
          click: () =>
            dialog.showMessageBox(janela, {
              type: "info",
              title: "CRM SST",
              message: `CRM SST ${app.getVersion()}`,
              detail: `by camilocaos\n\nDados em: ${PASTA_DADOS}`,
            }),
        },
        { label: "Código no GitHub", click: () => shell.openExternal("https://github.com/camilocaos/crmsst") },
      ],
    },
  ]);
  Menu.setApplicationMenu(menu);
}

app.on("before-quit", () => {
  app.isQuitting = true;
  servidor?.kill();
});
app.on("window-all-closed", () => app.quit());
