// Gera os ícones do app a partir de marca/icone-original.png:
// tira o fundo branco de fora do quadrado azul (com borda suave) e exporta os tamanhos.
// Uso: npm run app:icone
const { app, nativeImage } = require("electron");
const fs = require("node:fs");
const path = require("node:path");

const raiz = path.join(__dirname, "..");
const AZUL = { r: 0, g: 127, b: 174 }; // #007FAE

app.whenReady().then(() => {
  const original = nativeImage.createFromPath(path.join(raiz, "marca", "icone-original.png"));
  const { width: w, height: h } = original.getSize();
  const px = Buffer.from(original.toBitmap()); // BGRA
  const idx = (x, y) => (y * w + x) * 4;
  const claro = (i) => px[i + 2] > 40; // vermelho alto = branco/borda (o azul tem R≈0)

  // Preenche a partir dos cantos: só o branco de FORA do quadrado (as mãos ficam isoladas pelo azul)
  const fora = new Uint8Array(w * h);
  const pilha = [[0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]];
  while (pilha.length) {
    const [x, y] = pilha.pop();
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    const p = y * w + x;
    if (fora[p] || !claro(p * 4)) continue;
    fora[p] = 1;
    pilha.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Fundo vira transparente; a borda antisserrilhada vira azul com alfa proporcional
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = idx(x, y);
      if (fora[y * w + x]) {
        let alfa = Math.max(0, Math.min(255, 255 - px[i + 2]));
        if (alfa < 8) alfa = 0; // ruído do fundo branco
        // o bitmap do Electron usa alfa pré-multiplicado: cor = cor × alfa
        const k = alfa / 255;
        px[i] = Math.round(AZUL.b * k); px[i + 1] = Math.round(AZUL.g * k); px[i + 2] = Math.round(AZUL.r * k); px[i + 3] = alfa;
        if (alfa < 16) continue;
      }
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }

  const limpo = nativeImage.createFromBitmap(px, { width: w, height: h });
  const lado = Math.max(maxX - minX, maxY - minY) + 1;
  const recorte = limpo.crop({ x: minX, y: minY, width: lado, height: lado });

  const salvar = (arquivo, tamanho) => {
    const destino = path.join(raiz, arquivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.writeFileSync(destino, recorte.resize({ width: tamanho, height: tamanho, quality: "best" }).toPNG());
    console.log(`  ${arquivo} (${tamanho}px)`);
  };
  salvar("build/icon.png", 1024); // instalador e executável (o electron-builder gera o .ico)
  salvar("desktop/icone.png", 256); // ícone da janela
  salvar("src/app/icon.png", 256); // favicon
  salvar("public/logo.png", 128); // logo dentro da interface
  app.quit();
});
