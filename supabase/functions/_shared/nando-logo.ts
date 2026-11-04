// Logo do condominio para os avisos do Nando.
// Recebe a imagem que o sindico mandou (PNG/JPG/WEBP), tira o fundo liso (branco ou de uma cor so),
// corta as sobras e descobre o "tom" da logo para escolher a placa certa atras dela.
// Regra de ouro: NUNCA muda as cores da logo (logo preta continua preta: ganha uma placa clara atras).
// A biblioteca e carregada so quando precisa: se falhar, o resto do Nando continua funcionando.

export type LogoPronta = {
  png: Uint8Array;           // logo final, fundo transparente, cortada
  largura: number;
  altura: number;
  fundo: "removido" | "ja_transparente" | "mantido";  // mantido = fundo complexo (foto, degradê): vai inteira numa placa
  tom: "escuro" | "claro" | "colorido";
  placa: "clara" | "escura";  // placa atras da logo no aviso (contraste)
  aviso?: string;            // o que pode ter ficado ruim (para o Nando conferir/avisar)
};

const lum = (r: number, g: number, b: number) => {
  const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contraste = (l1: number, l2: number) => (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

// ---- imagem RGBA em JS puro (pngjs + jpeg-js): roda no Supabase Edge (o imagescript do npm nao carrega la)
type Img = { width: number; height: number; bitmap: Uint8ClampedArray };
async function decodificar(bytes: Uint8Array): Promise<Img> {
  const ehPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const ehJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
  if (ehPng) {
    const { PNG } = (await import("npm:pngjs@7.0.0")) as any;
    const { Buffer } = await import("node:buffer");
    const p = PNG.sync.read(Buffer.from(bytes));
    return { width: p.width, height: p.height, bitmap: new Uint8ClampedArray(p.data.buffer, p.data.byteOffset, p.data.length) };
  }
  if (ehJpg) {
    const jpeg: any = (await import("npm:jpeg-js@0.4.4")).default;
    const j = jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 512 });
    return { width: j.width, height: j.height, bitmap: new Uint8ClampedArray(j.data.buffer, j.data.byteOffset, j.data.length) };
  }
  throw new Error("formato não suportado (mande a logo em PNG ou JPG)");
}
async function codificarPng(i: Img): Promise<Uint8Array> {
  const { PNG } = (await import("npm:pngjs@7.0.0")) as any;
  const { Buffer } = await import("node:buffer");
  const p = new PNG({ width: i.width, height: i.height });
  Buffer.from(i.bitmap.buffer, i.bitmap.byteOffset, i.bitmap.length).copy(p.data);
  return new Uint8Array(PNG.sync.write(p, { colorType: 6 }));
}
function novaImg(w: number, h: number, rgba = 0): Img {
  const b = new Uint8ClampedArray(w * h * 4);
  if (rgba) for (let i = 0; i < b.length; i += 4) { b[i] = rgba >>> 24; b[i + 1] = (rgba >>> 16) & 255; b[i + 2] = (rgba >>> 8) & 255; b[i + 3] = rgba & 255; }
  return { width: w, height: h, bitmap: b };
}
function recortar(i: Img, x0: number, y0: number, w: number, h: number): Img {
  const o = novaImg(w, h);
  for (let y = 0; y < h; y++) o.bitmap.set(i.bitmap.subarray(((y + y0) * i.width + x0) * 4, ((y + y0) * i.width + x0 + w) * 4), y * w * 4);
  return o;
}
// reducao por media de area (com alfa pre-multiplicado: nao escurece as bordas da logo)
function reduzir(i: Img, w: number, h: number): Img {
  if (w >= i.width && h >= i.height) return i;
  const o = novaImg(w, h), sx = i.width / w, sy = i.height / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const xa = Math.floor(x * sx), xb = Math.max(xa + 1, Math.floor((x + 1) * sx)), ya = Math.floor(y * sy), yb = Math.max(ya + 1, Math.floor((y + 1) * sy));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = ya; yy < yb; yy++) for (let xx = xa; xx < xb; xx++) { const k = (yy * i.width + xx) * 4, al = i.bitmap[k + 3]; r += i.bitmap[k] * al; g += i.bitmap[k + 1] * al; b += i.bitmap[k + 2] * al; a += al; n++; }
    const k = (y * w + x) * 4;
    if (a) { o.bitmap[k] = r / a; o.bitmap[k + 1] = g / a; o.bitmap[k + 2] = b / a; }
    o.bitmap[k + 3] = a / n;
  }
  return o;
}
function colar(base: Img, cima: Img, x0: number, y0: number) {
  for (let y = 0; y < cima.height; y++) for (let x = 0; x < cima.width; x++) {
    const X = x + x0, Y = y + y0; if (X < 0 || Y < 0 || X >= base.width || Y >= base.height) continue;
    const s = (y * cima.width + x) * 4, d = (Y * base.width + X) * 4, a = cima.bitmap[s + 3] / 255;
    for (let c = 0; c < 3; c++) base.bitmap[d + c] = cima.bitmap[s + c] * a + base.bitmap[d + c] * (1 - a);
    base.bitmap[d + 3] = Math.max(base.bitmap[d + 3], cima.bitmap[s + 3]);
  }
}

export async function prepararLogo(bytes: Uint8Array): Promise<LogoPronta> {
  let img = await decodificar(bytes);
  if (!img || !img.width) throw new Error("não consegui abrir a imagem");
  // trabalha em ate 1600 px (logo nao precisa mais que isso e o processamento fica rapido)
  if (Math.max(img.width, img.height) > 1600) { const k = 1600 / Math.max(img.width, img.height); img = reduzir(img, Math.round(img.width * k), Math.round(img.height * k)); }
  const W = img.width, H = img.height;
  const px = img.bitmap as Uint8ClampedArray; // RGBA
  const at = (x: number, y: number) => (y * W + x) * 4;

  // 1) borda: ja tem transparencia? fundo liso?
  const borda: number[] = [];
  for (let x = 0; x < W; x++) { borda.push(at(x, 0), at(x, H - 1)); }
  for (let y = 0; y < H; y++) { borda.push(at(0, y), at(W - 1, y)); }
  const transp = borda.filter((i) => px[i + 3] < 200).length / borda.length;
  let fundo: LogoPronta["fundo"] = "mantido";
  let corFundo: number[] | null = null;
  let aviso: string | undefined;

  if (transp > 0.5) {
    fundo = "ja_transparente";
  } else {
    // cor do fundo = mediana da borda (opaca)
    const op = borda.filter((i) => px[i + 3] >= 200);
    const med = (k: number) => { const v = op.map((i) => px[i + k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] || 0; };
    const bg = [med(0), med(1), med(2)];
    corFundo = bg;
    const dist = (i: number) => Math.hypot(px[i] - bg[0], px[i + 1] - bg[1], px[i + 2] - bg[2]);
    const lisa = op.filter((i) => dist(i) < 38).length / Math.max(1, op.length);
    if (lisa >= 0.82) {
      // 2) tira o fundo por "inundacao" a partir das bordas: so some o fundo que encosta na borda
      // (o branco DENTRO da logo, como o miolo de uma letra fechada que nao encosta na borda, so sai se for o mesmo fundo ligado por fora)
      const T1 = 34, T2 = 90; // ate T1 = fundo; entre T1 e T2 = borda suave (anti-serrilhado)
      const fora = new Uint8Array(W * H); // 1 = fundo
      const pilha: number[] = [];
      const tenta = (x: number, y: number) => { const k = y * W + x; if (fora[k]) return; if (dist(k * 4) <= T1) { fora[k] = 1; pilha.push(k); } };
      for (let x = 0; x < W; x++) { tenta(x, 0); tenta(x, H - 1); }
      for (let y = 0; y < H; y++) { tenta(0, y); tenta(W - 1, y); }
      while (pilha.length) {
        const k = pilha.pop()!; const x = k % W, y = (k / W) | 0;
        if (x > 0) tenta(x - 1, y); if (x < W - 1) tenta(x + 1, y); if (y > 0) tenta(x, y - 1); if (y < H - 1) tenta(x, y + 1);
      }
      // buracos internos do mesmo fundo (miolo do "O", do "A"...). So com fundo ESCURO/colorido: com fundo claro
      // o miolo fica branco, que e igual na placa clara, e assim nunca apaga um detalhe branco de dentro da logo
      const visto = new Uint8Array(W * H);
      const fundoClaro = lum(bg[0], bg[1], bg[2]) > 0.5;
      for (let k0 = 0; k0 < W * H && !fundoClaro; k0++) {
        if (fora[k0] || visto[k0] || dist(k0 * 4) > T1 * 0.6) continue;
        const reg: number[] = [k0]; visto[k0] = 1; const fila = [k0];
        while (fila.length) {
          const k = fila.pop()!; const x = k % W, y = (k / W) | 0;
          for (const n of [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, y > 0 ? k - W : -1, y < H - 1 ? k + W : -1]) {
            if (n < 0 || visto[n] || fora[n] || dist(n * 4) > T1 * 0.6) continue;
            visto[n] = 1; fila.push(n); reg.push(n);
          }
        }
        if (reg.length > W * H * 0.0004) for (const k of reg) fora[k] = 1;
      }
      // aplica: fundo some; vizinhos do fundo ganham alfa proporcional e perdem o "halo" da cor do fundo
      for (let k = 0; k < W * H; k++) {
        const i = k * 4;
        if (fora[k]) { px[i + 3] = 0; continue; }
        const x = k % W, y = (k / W) | 0;
        const viz = (x > 0 && fora[k - 1]) || (x < W - 1 && fora[k + 1]) || (y > 0 && fora[k - W]) || (y < H - 1 && fora[k + W]);
        if (!viz) continue;
        const d = dist(i);
        if (d >= T2) continue;
        const a = Math.max(0.15, Math.min(1, (d - T1) / (T2 - T1)));
        for (let c = 0; c < 3; c++) px[i + c] = Math.max(0, Math.min(255, Math.round((px[i + c] - bg[c] * (1 - a)) / a)));
        px[i + 3] = Math.round(px[i + 3] * a);
      }
      fundo = "removido";
    } else {
      aviso = "o fundo da imagem não é liso (foto, degradê ou várias cores): mantive a imagem inteira, com o fundo";
    }
  }

  // 2b) sujeira de print: alcas de selecao do programa de desenho, "x", cursor, pontinhos soltos.
  // Pedaco pequeno (menos de 2% do maior) de cor bem diferente da logo some; pingo do "i" (mesma cor) fica.
  if (fundo !== "mantido") {
    const comp = new Int32Array(W * H).fill(-1);
    const info: { n: number; r: number; g: number; b: number; t?: number }[] = [];
    for (let k0 = 0; k0 < W * H; k0++) {
      if (comp[k0] >= 0 || px[k0 * 4 + 3] <= 40) continue;
      const id = info.length; const reg: { n: number; r: number; g: number; b: number; t?: number } = { n: 0, r: 0, g: 0, b: 0 }; info.push(reg);
      const fila = [k0]; comp[k0] = id;
      while (fila.length) {
        const k = fila.pop()!; const x = k % W, y = (k / W) | 0, i = k * 4;
        reg.n++;
        // cor "de tinta": so os pixels bem diferentes do fundo (o miolo branco das letras nao entra na media)
        const fb = corFundo || [255, 255, 255];
        if (Math.hypot(px[i] - fb[0], px[i + 1] - fb[1], px[i + 2] - fb[2]) > 60) { reg.r += px[i]; reg.g += px[i + 1]; reg.b += px[i + 2]; reg.t = (reg.t || 0) + 1; }
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
          const n2 = Y * W + X; if (comp[n2] >= 0 || px[n2 * 4 + 3] <= 40) continue;
          comp[n2] = id; fila.push(n2);
        }
      }
    }
    if (info.length > 1) {
      const maior = info.reduce((a, c) => (c.n > a.n ? c : a));
      // cor da logo = media dos pedacos grandes (>= 2% do maior)
      let R = 0, G = 0, B = 0, N = 0;
      for (const c of info) if (c.n >= maior.n * 0.02) { R += c.r; G += c.g; B += c.b; N += c.t || 0; }
      N = Math.max(1, N); R /= N; G /= N; B /= N;
      const tira = info.map((c) => {
        if (c.n >= maior.n * 0.02) return false;
        if (c.n < 12) return true;
        if (!c.t) return true;   // pedacinho so de cinza claro/quase fundo: sujeira
        return Math.hypot(c.r / c.t - R, c.g / c.t - G, c.b / c.t - B) > 90;
      });
      let tirados = 0;
      for (let k = 0; k < W * H; k++) if (comp[k] >= 0 && tira[comp[k]]) { px[k * 4 + 3] = 0; tirados++; }
      if (tirados) aviso = (aviso ? aviso + "; " : "") + "tirei pedacinhos soltos que pareciam sujeira de print (alças de seleção, marcas) — confira se não sumiu nenhum detalhe da logo";
    }
  }

  // 3) corta as sobras (tudo que e transparente em volta) e deixa uma margem pequena
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[at(x, y) + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error("a imagem ficou vazia depois de tirar o fundo (a logo é da mesma cor do fundo?)");
  const m = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
  let out = recortar(img, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  if (out.width > 900 || out.height > 450) {
    const k = Math.min(900 / out.width, 450 / out.height);
    out = reduzir(out, Math.round(out.width * k), Math.round(out.height * k));
  }
  if (out.width < 60 && out.height < 60) aviso = (aviso ? aviso + "; " : "") + "a logo é muito pequena (pode ficar borrada); peça uma versão maior";

  // 4) tom da logo (so pixels visiveis) -> placa de contraste. Nunca recolore.
  const b = out.bitmap as Uint8ClampedArray;
  let n = 0, soma = 0, escuros = 0, claros = 0, sat = 0;
  for (let i = 0; i < b.length; i += 4) {
    if (b[i + 3] < 128) continue;
    const L = lum(b[i], b[i + 1], b[i + 2]);
    n++; soma += L; if (L < 0.12) escuros++; if (L > 0.7) claros++;
    const mx = Math.max(b[i], b[i + 1], b[i + 2]), mn = Math.min(b[i], b[i + 1], b[i + 2]);
    sat += mx > 60 ? (mx - mn) / mx : 0;
  }
  const Lm = n ? soma / n : 0.5, s = n ? sat / n : 0;
  const tom: LogoPronta["tom"] = s > 0.35 ? "colorido" : Lm < 0.25 ? "escuro" : Lm > 0.6 ? "claro" : "colorido";
  // placa clara (branco vidro) x placa escura (preto vidro): a que der mais contraste com a parte "principal" da logo
  const fracEsc = n ? escuros / n : 0, fracCla = n ? claros / n : 0;
  let placa: LogoPronta["placa"];
  if (fundo === "mantido") placa = "clara";                 // imagem com fundo proprio: moldura clara discreta
  else if (fracCla > 0.55 && fracEsc < 0.15) placa = "escura";
  else if (fracEsc > 0.3) placa = "clara";
  else placa = contraste(Lm, 0.92) >= contraste(Lm, 0.015) ? "clara" : "escura";

  const png = await codificarPng(out);
  return { png, largura: out.width, altura: out.height, fundo, tom, placa, aviso };
}

/** Imagem para o proprio Nando conferir: a logo sobre a placa que vai no aviso (e numa faixa xadrez para ver o recorte). */
export async function conferenciaLogo(l: LogoPronta): Promise<Uint8Array> {
  const logo = await decodificar(l.png);
  const pad = 24, W = logo.width + pad * 2, H = logo.height + pad * 2;
  const tela = novaImg(W * 2 + 20, H, 0x1a1a1aff);
  // esquerda: placa do aviso; direita: xadrez (mostra o que ficou transparente)
  const placa = novaImg(W, H, l.placa === "clara" ? 0xf2f2f2ff : 0x161616ff);
  colar(placa, logo, pad, pad); colar(tela, placa, 0, 0);
  const xad = novaImg(W, H, 0x888888ff);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (((x >> 4) + (y >> 4)) % 2) { const k = (y * W + x) * 4; xad.bitmap[k] = xad.bitmap[k + 1] = xad.bitmap[k + 2] = 0xcc; }
  colar(xad, logo, pad, pad); colar(tela, xad, W + 20, 0);
  return await codificarPng(tela);
}
