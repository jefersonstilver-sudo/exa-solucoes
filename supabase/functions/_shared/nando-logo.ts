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

export async function prepararLogo(bytes: Uint8Array): Promise<LogoPronta> {
  const IS: any = await import("npm:imagescript@1.3.0");
  let img: any = await IS.decode(bytes);
  if (!img || !img.width) throw new Error("não consegui abrir a imagem");
  // trabalha em ate 1600 px (logo nao precisa mais que isso e o processamento fica rapido)
  if (Math.max(img.width, img.height) > 1600) img = img.resize(img.width >= img.height ? 1600 : IS.Image.RESIZE_AUTO, img.width >= img.height ? IS.Image.RESIZE_AUTO : 1600);
  const W = img.width, H = img.height;
  const px = img.bitmap as Uint8ClampedArray; // RGBA
  const at = (x: number, y: number) => (y * W + x) * 4;

  // 1) borda: ja tem transparencia? fundo liso?
  const borda: number[] = [];
  for (let x = 0; x < W; x++) { borda.push(at(x, 0), at(x, H - 1)); }
  for (let y = 0; y < H; y++) { borda.push(at(0, y), at(W - 1, y)); }
  const transp = borda.filter((i) => px[i + 3] < 200).length / borda.length;
  let fundo: LogoPronta["fundo"] = "mantido";
  let aviso: string | undefined;

  if (transp > 0.5) {
    fundo = "ja_transparente";
  } else {
    // cor do fundo = mediana da borda (opaca)
    const op = borda.filter((i) => px[i + 3] >= 200);
    const med = (k: number) => { const v = op.map((i) => px[i + k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)] || 0; };
    const bg = [med(0), med(1), med(2)];
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

  // 3) corta as sobras (tudo que e transparente em volta) e deixa uma margem pequena
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (px[at(x, y) + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) throw new Error("a imagem ficou vazia depois de tirar o fundo (a logo é da mesma cor do fundo?)");
  const m = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
  x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(W - 1, x1 + m); y1 = Math.min(H - 1, y1 + m);
  let out: any = img.crop(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  if (out.width > 900 || out.height > 450) {
    const k = Math.min(900 / out.width, 450 / out.height);
    out = out.resize(Math.round(out.width * k), Math.round(out.height * k));
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

  const png = await out.encode(1);
  return { png, largura: out.width, altura: out.height, fundo, tom, placa, aviso };
}

/** Imagem para o proprio Nando conferir: a logo sobre a placa que vai no aviso (e numa faixa xadrez para ver o recorte). */
export async function conferenciaLogo(l: LogoPronta): Promise<Uint8Array> {
  const IS: any = await import("npm:imagescript@1.3.0");
  const logo = await IS.decode(l.png);
  const pad = 24, W = logo.width + pad * 2, H = logo.height + pad * 2;
  const tela = new IS.Image(W * 2 + 20, H);
  tela.fill(0x1a1a1aff);
  // esquerda: placa do aviso
  const placa = new IS.Image(W, H); placa.fill(l.placa === "clara" ? 0xf2f2f2ff : 0x161616ff);
  placa.composite(logo, pad, pad); tela.composite(placa, 0, 0);
  // direita: xadrez (mostra o que ficou transparente)
  const xad = new IS.Image(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) xad.setPixelAt(x + 1, y + 1, ((x >> 4) + (y >> 4)) % 2 ? 0xccccccff : 0x888888ff);
  xad.composite(logo, pad, pad); tela.composite(xad, W + 20, 0);
  return await tela.encode(1);
}
