// Gera build/icon.png (512x512) renderizando um SVG no Electron.
// Uso: npx electron scripts/gerar-icone.cjs
const { app, BrowserWindow } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#064e3b"/>
  <path d="M256 84 L392 140 V244 C392 336 334 400 256 428 C178 400 120 336 120 244 V140 Z" fill="#10b981"/>
  <path d="M196 262 L240 306 L322 214" fill="none" stroke="#ffffff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({ width: 512, height: 512, show: false, frame: false, transparent: true, useContentSize: true });
  await win.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`<body style="margin:0;background:transparent">${svg}</body>`)}`,
  );
  await new Promise((r) => setTimeout(r, 300));
  const imagem = await win.webContents.capturePage({ x: 0, y: 0, width: 512, height: 512 });
  const destino = path.join(__dirname, "..", "build", "icon.png");
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, imagem.resize({ width: 512, height: 512 }).toPNG());
  console.log("Ícone salvo em", destino);
  app.quit();
});
