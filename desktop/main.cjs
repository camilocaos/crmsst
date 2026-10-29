// Processo principal do app desktop (Electron).
// Sobe o servidor Next.js interno numa porta livre e abre a janela do CRM.
const { app, BrowserWindow, Menu, dialog, ipcMain, shell, utilityProcess } = require("electron");
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
const ICONE = path.join(__dirname, "icone.png");
// Segredo da sessão: só este processo consegue chamar a rota de backup do servidor
const TOKEN = process.env.CRM_TOKEN || crypto.randomBytes(24).toString("hex");

let janela = null;
let servidor = null;
let urlServidor = null;

// ---------- Atualização automática (GitHub Releases) ----------
const VERIFICAR_A_CADA_MS = 2 * 60 * 60 * 1000; // a cada 2 horas, além de ao abrir
/** Estado que a janelinha de atualização mostra. Fica aqui para sobreviver a recarregamentos da página. */
let atualizacao = { etapa: "nenhuma" }; // nenhuma | baixando | pronta | erro
let dispensada = false; // "Depois": some até o app ser aberto de novo

function enviarAtualizacao() {
  janela?.webContents.send("crm:atualizacao", dispensada ? { etapa: "nenhuma" } : atualizacao);
}

function textoDasNotas(notas) {
  const texto = Array.isArray(notas) ? notas.map((n) => n.note ?? "").join("\n") : String(notas ?? "");
  return texto
    .replace(/<\/(p|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function configurarAtualizador() {
  // Em desenvolvimento não há o que atualizar (a não ser num teste com CRM_UPDATE_URL)
  if (!app.isPackaged && !process.env.CRM_UPDATE_URL) return;
  const { autoUpdater } = require("electron-updater");
  // Baixa sozinho em segundo plano, enquanto a pessoa usa o CRM; depois é só reiniciar.
  autoUpdater.autoDownload = true;
  // Só instala quando a pessoa clica. Se baixou e fechou, o aviso volta pronto na próxima abertura.
  autoUpdater.autoInstallOnAppQuit = false;
  const modoTeste = Boolean(process.env.CRM_UPDATE_URL);
  if (modoTeste) autoUpdater.setFeedURL({ provider: "generic", url: process.env.CRM_UPDATE_URL });

  autoUpdater.on("update-available", (info) => {
    if (atualizacao.etapa === "baixando" || atualizacao.etapa === "pronta") return;
    // O download já começa sozinho (autoDownload)
    atualizacao = { etapa: "baixando", versao: info.version, notas: textoDasNotas(info.releaseNotes), progresso: 0 };
    enviarAtualizacao();
  });
  autoUpdater.on("download-progress", (p) => {
    atualizacao = { ...atualizacao, etapa: "baixando", progresso: Math.round(p.percent) };
    enviarAtualizacao();
  });
  autoUpdater.on("update-downloaded", (info) => {
    const notas = atualizacao.notas || textoDasNotas(info.releaseNotes);
    atualizacao = { ...atualizacao, etapa: "pronta", versao: info.version, notas, progresso: 100 };
    dispensada = false;
    enviarAtualizacao();
  });
  autoUpdater.on("error", (erro) => {
    console.error("Atualização:", erro?.message);
    // Sem internet ao procurar: fica quieto. Só avisa se o download tinha começado.
    if (atualizacao.etapa === "baixando") {
      atualizacao = { ...atualizacao, etapa: "erro", mensagem: "Não foi possível baixar a atualização. Tente de novo mais tarde." };
      enviarAtualizacao();
    }
  });

  ipcMain.handle("crm:atualizacao-estado", (evento) => (daJanela(evento) ? (dispensada ? { etapa: "nenhuma" } : atualizacao) : null));
  ipcMain.handle("crm:atualizacao-baixar", (evento) => {
    if (!daJanela(evento) || atualizacao.etapa !== "erro") return; // "Tentar de novo"
    atualizacao = { ...atualizacao, etapa: "baixando", progresso: 0 };
    enviarAtualizacao();
    autoUpdater.downloadUpdate().catch(() => {});
  });
  ipcMain.handle("crm:atualizacao-dispensar", (evento) => {
    if (!daJanela(evento)) return;
    dispensada = true;
    enviarAtualizacao();
  });
  ipcMain.handle("crm:atualizacao-instalar", (evento) => {
    if (!daJanela(evento) || atualizacao.etapa !== "pronta") return;
    if (modoTeste) {
      // em teste nunca instala de verdade no computador
      atualizacao = { ...atualizacao, etapa: "erro", mensagem: "Modo de teste: a instalação foi simulada." };
      enviarAtualizacao();
      return;
    }
    // Fecha tudo antes, para o instalador não encontrar o app aberto
    app.isQuitting = true;
    servidor?.kill();
    for (const w of BrowserWindow.getAllWindows()) w.destroy();
    // Mostra só a barra de progresso do instalador (sem assistente) e abre o app de novo ao terminar
    setImmediate(() => autoUpdater.quitAndInstall(false, true));
  });

  // O download automático devolve uma promessa à parte; sem internet, só ignora
  const verificar = () => autoUpdater.checkForUpdates().then((r) => r?.downloadPromise?.catch(() => {})).catch(() => {});
  setTimeout(verificar, 5000);
  setInterval(verificar, VERIFICAR_A_CADA_MS);
}

/** Só a página do próprio CRM pode chamar a ponte (nunca um site externo). */
function daJanela(evento) {
  return Boolean(urlServidor && evento.senderFrame?.url.startsWith(urlServidor));
}

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
  Menu.setApplicationMenu(null); // sem barra "Arquivo | Editar | Exibir | Ajuda"
  registrarPonte();
  const splash = mostrarSplash();

  // Tem versão nova? Atualiza já na tela de abertura (como o G HUB) e o app abre atualizado
  if (await atualizarAoAbrir(splash)) return;

  try {
    const url = DEV_URL || (await subirServidor());
    urlServidor = url;
    await esperarServidor(url);
    configurarAtualizador(); // antes da janela, para a página já achar os handlers
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
  const splash = new BrowserWindow({ width: 420, height: 240, frame: false, resizable: false, show: true, icon: ICONE, backgroundColor: "#10334A" });
  const logo = `data:image/png;base64,${fs.readFileSync(ICONE).toString("base64")}`;
  const html = `<body style="margin:0;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#10334A;color:#fff;font-family:'Segoe UI',system-ui,sans-serif;font-size:14px">
    <img src="${logo}" width="56" height="56" alt="">
    <p id="texto" style="margin:16px 0 0;color:#C9D8E3;text-align:center;padding:0 24px">Abrindo o CRM...</p>
    <div id="barra" style="display:none;width:280px;margin-top:18px">
      <div style="height:6px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden"><div id="cheio" style="height:100%;width:0;background:#4FB3E8;transition:width .3s"></div></div>
      <p id="pct" style="margin:6px 0 0;font-size:12px;color:#C9D8E3;text-align:right">0%</p>
    </div></body>`;
  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return splash;
}

/** Troca o texto da tela de abertura e mostra a barra de progresso (progresso = null esconde a barra). */
function atualizarSplash(splash, texto, progresso = null) {
  if (splash.isDestroyed()) return;
  const js = `(() => {
    document.getElementById("texto").textContent = ${JSON.stringify(texto)};
    const p = ${progresso === null ? "null" : Math.round(progresso)};
    document.getElementById("barra").style.display = p === null ? "none" : "block";
    if (p !== null) { document.getElementById("cheio").style.width = p + "%"; document.getElementById("pct").textContent = p + "%"; }
  })()`;
  const rodar = () => splash.webContents.executeJavaScript(js).catch(() => {});
  if (splash.webContents.isLoading()) splash.webContents.once("did-finish-load", rodar);
  else rodar();
}

/**
 * Ao abrir o app: se tem versão nova, baixa e instala na própria tela de abertura.
 * Sem internet ou se der erro, abre o CRM normalmente. Devolve true se está instalando.
 */
async function atualizarAoAbrir(splash) {
  if (!app.isPackaged && !process.env.CRM_UPDATE_URL) return false;
  const modoTeste = Boolean(process.env.CRM_UPDATE_URL);
  let autoUpdater;
  try {
    ({ autoUpdater } = require("electron-updater"));
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    if (modoTeste) autoUpdater.setFeedURL({ provider: "generic", url: process.env.CRM_UPDATE_URL });
    const limite = new Promise((resolve) => setTimeout(() => resolve(null), 6000));
    const r = await Promise.race([autoUpdater.checkForUpdates().catch(() => null), limite]);
    if (!r?.isUpdateAvailable) return false;

    const versao = r.updateInfo.version;
    atualizarSplash(splash, `Aguarde enquanto atualizamos o CRM para a versão ${versao}...`, 0);
    const progresso = (p) => atualizarSplash(splash, `Aguarde enquanto atualizamos o CRM para a versão ${versao}...`, p.percent);
    autoUpdater.on("download-progress", progresso);
    try {
      await autoUpdater.downloadUpdate();
    } finally {
      autoUpdater.removeListener("download-progress", progresso);
    }

    if (modoTeste) {
      atualizarSplash(splash, "Modo de teste: a instalação foi simulada. Abrindo o CRM...", 100);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      atualizarSplash(splash, "Abrindo o CRM...");
      return false;
    }
    atualizarSplash(splash, "Instalando...", 100);
    app.isQuitting = true;
    setTimeout(() => {
      for (const w of BrowserWindow.getAllWindows()) w.destroy();
      autoUpdater.quitAndInstall(false, true); // barra de progresso do instalador e abre o app de novo
    }, 800);
    return true;
  } catch (erro) {
    console.error("Atualização ao abrir:", erro?.message);
    atualizarSplash(splash, "Abrindo o CRM...");
    return false;
  }
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
    title: "CRM Comercial",
    icon: ICONE,
    backgroundColor: "#F4F8FB",
    show: false,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, preload: path.join(__dirname, "preload.cjs") },
  });
  registrarAtalhos(janela.webContents);
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

/** Funções que a tela de Configurações chama pelo preload (sem barra de menu). */
function registrarPonte() {
  ipcMain.handle("crm:info", (evento) => {
    if (!daJanela(evento)) return null;
    return { versao: app.getVersion(), pastaDados: PASTA_DADOS };
  });

  ipcMain.handle("crm:abrir-pasta", async (evento) => {
    if (!daJanela(evento)) return false;
    return (await shell.openPath(PASTA_DADOS)) === "";
  });

  ipcMain.handle("crm:salvar-backup", async (evento) => {
    if (!daJanela(evento)) return { ok: false };
    const { canceled, filePath } = await dialog.showSaveDialog(janela, {
      title: "Salvar backup do CRM",
      defaultPath: path.join(app.getPath("documents"), `backup-crm-${dataHoje()}.db`),
      filters: [{ name: "Banco do CRM", extensions: ["db"] }],
    });
    if (canceled || !filePath) return { ok: false, cancelado: true };
    const destino = filePath.toLowerCase().endsWith(".db") ? filePath : `${filePath}.db`;
    return { ok: await gerarBackup(destino), caminho: destino };
  });
}

/** Atalhos que antes vinham do menu: zoom, recarregar, tela cheia (e DevTools no modo dev). */
function registrarAtalhos(webContents) {
  webContents.on("before-input-event", (evento, entrada) => {
    if (entrada.type !== "keyDown") return;
    const ctrl = entrada.control || entrada.meta;
    const tecla = entrada.key;
    let tratado = true;
    if (ctrl && (tecla === "=" || tecla === "+")) webContents.setZoomLevel(webContents.getZoomLevel() + 0.5);
    else if (ctrl && tecla === "-") webContents.setZoomLevel(webContents.getZoomLevel() - 0.5);
    else if (ctrl && tecla === "0") webContents.setZoomLevel(0);
    else if (tecla === "F5" || (ctrl && tecla.toLowerCase() === "r")) webContents.reload();
    else if (tecla === "F11") janela?.setFullScreen(!janela.isFullScreen());
    else if (tecla === "F12" && (DEV_URL || !app.isPackaged)) webContents.toggleDevTools();
    else tratado = false;
    if (tratado) evento.preventDefault();
  });

  // Botão direito: recortar / copiar / colar em campos e textos selecionados
  webContents.on("context-menu", (_evento, p) => {
    const itens = [];
    if (p.isEditable) {
      itens.push(
        { label: "Recortar", role: "cut", enabled: p.editFlags.canCut },
        { label: "Copiar", role: "copy", enabled: p.editFlags.canCopy },
        { label: "Colar", role: "paste", enabled: p.editFlags.canPaste },
        { type: "separator" },
        { label: "Selecionar tudo", role: "selectAll" },
      );
    } else if (p.selectionText.trim()) {
      itens.push({ label: "Copiar", role: "copy" });
    }
    if (itens.length) Menu.buildFromTemplate(itens).popup({ window: janela });
  });
}

app.on("before-quit", () => {
  app.isQuitting = true;
  servidor?.kill();
});
app.on("window-all-closed", () => app.quit());
