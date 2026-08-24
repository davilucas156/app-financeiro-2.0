import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Gera os ícones do app (spec 07).
 *
 * ## Por que um script e não um arquivo binário solto
 *
 * Um PNG comitado sem procedência é impossível de revisar e de ajustar: ninguém
 * sabe de onde veio a cor, e mexer nele exige abrir um editor. Aqui o desenho é
 * código, as cores saem dos mesmos tokens de `globals.css`, e regerar é
 * `node scripts/gerar-icones.mjs`.
 *
 * ## Por que não `next/og`
 *
 * `ImageResponse` geraria os ícones em rota (`/icon`), com URL versionada por
 * hash. O `manifest.ts` precisa apontar para caminhos **estáveis**, e um
 * ícone de tela inicial que muda de URL a cada build é um ícone que o celular
 * pode ter de rebaixar. Arquivo estático em `public/` não tem esse problema.
 *
 * ## O desenho
 *
 * Seis potes, num grid 3×2, nas cores dos potes de `globals.css`, sobre o fundo
 * do app. É o nome do produto desenhado: "Painel Financeiro 6 Potes". A 48px
 * continua legível porque são seis blocos de cor, e não um símbolo com detalhe.
 */

const FUNDO = [0x06, 0x06, 0x08]; // --color-bg

/** Seis dos potes, na ordem do painel. Fonte: `globals.css`. */
const POTES = [
  [0xff, 0x50, 0x00], // --color-pote-fix  🏠
  [0x00, 0xe5, 0xa0], // --color-pote-lib  📈
  [0x3d, 0x8e, 0xff], // --color-pote-laz  🎮
  [0xff, 0xc9, 0x4d], // --color-pote-met  ★
  [0x00, 0xc8, 0xd4], // --color-pote-tra  🚗
  [0xe0, 0x40, 0xa0], // --color-pote-con  📚
];

/**
 * `larguraDoGrid` é fração do lado, e é o que separa o ícone normal do
 * maskable: o Android recorta o maskable num círculo de 80% do lado, então o
 * desenho tem de caber bem dentro dele. Um maskable desenhado como o normal sai
 * com os potes das pontas cortados.
 */
function desenhar(lado, larguraDoGrid) {
  const px = Buffer.alloc(lado * lado * 4);

  for (let i = 0; i < lado * lado; i++) {
    px[i * 4] = FUNDO[0];
    px[i * 4 + 1] = FUNDO[1];
    px[i * 4 + 2] = FUNDO[2];
    px[i * 4 + 3] = 255;
  }

  const larguraTotal = lado * larguraDoGrid;
  const vao = larguraTotal * 0.11;
  const celula = (larguraTotal - vao * 2) / 3;
  const alturaTotal = celula * 2 + vao;
  const esquerda = (lado - larguraTotal) / 2;
  const topo = (lado - alturaTotal) / 2;
  const raio = celula * 0.26; // ~ --radius-pote proporcional

  POTES.forEach((cor, n) => {
    const x0 = esquerda + (n % 3) * (celula + vao);
    const y0 = topo + Math.floor(n / 3) * (celula + vao);
    retanguloArredondado(px, lado, x0, y0, celula, celula, raio, cor);
  });

  return px;
}

/**
 * Antisserrilhado por amostragem: cada pixel de borda vira 16 amostras.
 *
 * Sem isto, o canto arredondado sai em degrau e o ícone parece de 2004 a 48px —
 * que é o tamanho em que ele mais vai ser visto.
 */
function retanguloArredondado(px, lado, x0, y0, largura, altura, raio, cor) {
  const dentro = (x, y) => {
    const dx = Math.max(x0 + raio - x, 0, x - (x0 + largura - raio));
    const dy = Math.max(y0 + raio - y, 0, y - (y0 + altura - raio));

    if (x < x0 || x > x0 + largura || y < y0 || y > y0 + altura) return false;
    return dx * dx + dy * dy <= raio * raio;
  };

  for (let y = Math.floor(y0); y < Math.ceil(y0 + altura); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x0 + largura); x++) {
      if (x < 0 || y < 0 || x >= lado || y >= lado) continue;

      let dentroDe = 0;
      for (let sy = 0; sy < 4; sy++) {
        for (let sx = 0; sx < 4; sx++) {
          if (dentro(x + (sx + 0.5) / 4, y + (sy + 0.5) / 4)) dentroDe++;
        }
      }
      if (dentroDe === 0) continue;

      const a = dentroDe / 16;
      const i = (y * lado + x) * 4;
      for (let c = 0; c < 3; c++) {
        px[i + c] = Math.round(px[i + c] * (1 - a) + cor[c] * a);
      }
    }
  }
}

// ── PNG mínimo: assinatura, IHDR, IDAT, IEND ──────────────────────────────

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function bloco(tipo, dados) {
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const soma = Buffer.alloc(4);
  soma.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, soma]);
}

function png(px, lado) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lado, 0);
  ihdr.writeUInt32BE(lado, 4);
  ihdr[8] = 8; // 8 bits por canal
  ihdr[9] = 6; // RGBA
  // 10, 11, 12 ficam em zero: deflate, filtro padrão, sem entrelaçamento.

  // Uma linha de filtro `0` antes de cada scanline — o formato exige.
  const cru = Buffer.alloc(lado * (lado * 4 + 1));
  for (let y = 0; y < lado; y++) {
    cru[y * (lado * 4 + 1)] = 0;
    px.copy(cru, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    bloco("IHDR", ihdr),
    bloco("IDAT", deflateSync(cru, { level: 9 })),
    bloco("IEND", Buffer.alloc(0)),
  ]);
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const arquivos = [
  ["public/icone-192.png", 192, 0.78],
  ["public/icone-512.png", 512, 0.78],
  // Maskable: o Android recorta num círculo de 80% do lado.
  ["public/icone-maskable-512.png", 512, 0.56],
  // iOS arredonda por conta própria e não entende `maskable`.
  ["src/app/apple-icon.png", 180, 0.72],
];

for (const [caminho, lado, grid] of arquivos) {
  const destino = join(raiz, caminho);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, png(desenhar(lado, grid), lado));
  console.log(`${caminho} · ${lado}×${lado}`);
}
