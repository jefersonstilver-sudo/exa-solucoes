/**
 * EXA · motor comum de gravação e publicação (Notícias Brasil, Curiosidades)
 * canvas (window.renderAt) → frames JPG → MP4 (ffmpeg) → publish-video.mjs
 */
import puppeteer from "puppeteer";
import { existsSync, mkdirSync, readdirSync, unlinkSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { LARGURA, ALTURA } from "./exa-noticias-layout.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = join(__dirname, "output");
const FRAMES_DIR = join(OUTPUT_DIR, "_frames");
const FPS = 30;
const FFMPEG_WINGET = "C:/Users/jefer/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe";
const FFMPEG = existsSync(FFMPEG_WINGET) ? FFMPEG_WINGET : "ffmpeg";
export const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

export function criarLog(tag) {
  return msg => {
    const line = `[${new Date().toLocaleString("pt-BR")}] [${tag}] ${msg}`;
    console.log(line);
    try { appendFileSync(join(__dirname, "daily-dooh.log"), line + "\n", "utf-8"); } catch {}
  };
}

/** Chrome com 4 tentativas (a falha "Code: 3236495362" das 16h) e, na última, o Chrome instalado. */
export async function abrirNavegador(log, extra = []) {
  const args = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-first-run", "--no-default-browser-check", ...extra];
  for (let t = 1; t <= 4; t++) {
    try {
      const opts = { headless: "new", args, protocolTimeout: 120000 };
      if (t === 4) opts.channel = "chrome";
      return await puppeteer.launch(opts);
    } catch (e) {
      log(`  Chrome não abriu (tentativa ${t}/4): ${String(e.message).split("\n")[0]}`);
      if (t === 4) throw e;
      await sleep(20000 * t);
    }
  }
}

/** Baixa uma lista de URLs de imagem; devolve Buffers (null quando falha). */
export async function baixarImagens(log, urls) {
  const browser = await abrirNavegador(log);
  const page = await browser.newPage(); await page.setUserAgent(UA);
  const out = [];
  for (let i = 0; i < urls.length; i++) {
    try { const r = await page.goto(urls[i], { waitUntil: "load", timeout: 20000 }); const b = await r.buffer(); out.push(b.length > 1000 ? b : null); log(`  Imagem ${i + 1}: ${b.length} bytes`); }
    catch (e) { log(`  Imagem ${i + 1} FALHOU: ${e.message}`); out.push(null); }
  }
  await browser.close();
  return out;
}

function limparFrames() {
  if (!existsSync(FRAMES_DIR)) { mkdirSync(FRAMES_DIR, { recursive: true }); return; }
  for (const f of readdirSync(FRAMES_DIR)) if (f.endsWith(".png") || f.endsWith(".jpg")) unlinkSync(join(FRAMES_DIR, f));
}

export async function gravar(log, htmlFile, mp4File, duracao) {
  const total = Math.round(FPS * duracao);
  log(`Gravando ${mp4File} (${duracao}s, ${total} frames, ${LARGURA}x${ALTURA})...`);
  limparFrames();
  const browser = await abrirNavegador(log, ["--allow-file-access-from-files"]);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: LARGURA, height: ALTURA });
    await page.evaluateOnNewDocument(() => { window.__NO_PLAY = true; });
    await page.goto(`file:///${htmlFile.replace(/\\/g, "/").replace(/^\/+/, "")}`, { waitUntil: "load", timeout: 60000 });
    await page.waitForFunction("window.__ready === true", { timeout: 60000 });
    await page.addStyleTag({ content: `html,body{background:#000}canvas{position:fixed;left:0;top:0;width:${LARGURA}px!important;height:${ALTURA}px!important;max-width:none!important;max-height:none!important}` });
    const canvas = await page.$("#cv");
    for (let i = 0; i < total; i++) {
      await page.evaluate(t => window.renderAt(t), i / FPS);
      await canvas.screenshot({ path: join(FRAMES_DIR, `frame-${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
      if (i % 150 === 0) log(`  Frame ${i}/${total} (${Math.round(i / total * 100)}%)`);
    }
  } finally { await browser.close(); }
  log("Encodando MP4...");
  // 05/11/2026: quadros JPEG vêm em faixa "cheia" e o ffmpeg gerava yuvj420p (trava os NUCs GeminiLake). Força faixa de TV.
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/frame-%05d.jpg" -vf "scale=${LARGURA}:${ALTURA}:in_range=full:out_range=tv,format=yuv420p" -color_range tv -c:v libx264 -preset fast -crf 19 -pix_fmt yuv420p -movflags +faststart -an "${mp4File}"`,
    { stdio: "inherit", timeout: 600000 });
  log(`Vídeo salvo: ${mp4File}`);
}

export async function gravarComRetentativa(log, html, mp4, dur) {
  for (let t = 1; t <= 3; t++) {
    try { await gravar(log, html, mp4, dur); return; }
    catch (err) { log(`ERRO na gravação (tentativa ${t}/3): ${err.message}`); await sleep(15000); }
  }
  throw new Error("Gravação falhou 3 vezes");
}

export function publicarVideo(log, videoPath, titulo, orderId) {
  log(`Publicando: ${titulo}`);
  try {
    const output = execSync(`node "publish-video.mjs" "${videoPath}" "${titulo}" "${orderId}"`, {
      cwd: __dirname,
      encoding: "utf-8",
      timeout: 900000,
      maxBuffer: 10 * 1024 * 1024,
    });
    if (output) for (const line of output.trimEnd().split(/\r?\n/)) log(`[PUBLICADOR] ${line}`);
    return true;
  } catch (err) {
    const output = [err.stdout, err.stderr].filter(Boolean).join("\n");
    if (output) for (const line of output.trimEnd().split(/\r?\n/)) log(`[PUBLICADOR] ${line}`);
    log(`Erro publicação (status=${err.status ?? "indisponível"}, signal=${err.signal ?? "nenhum"}, timeout=${err.killed ? "sim" : "não"}): ${err.message}`);
    return false;
  }
}
