/**
 * Registro de status dos vídeos EXA DOOH (usado pelos geradores e pelo verificador).
 * Arquivo: output/status.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const OUTPUT_DIR = join(__dirname, "output");
export const STATUS_FILE = join(OUTPUT_DIR, "status.json");
export const HIST_DIR = join(OUTPUT_DIR, "historico");

export function lerStatus() {
  try { return JSON.parse(readFileSync(STATUS_FILE, "utf-8")); } catch { return {}; }
}

export function salvarStatus(chave, dados) {
  const s = lerStatus();
  s[chave] = { ...(s[chave] || {}), ...dados };
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(STATUS_FILE, JSON.stringify(s, null, 2), "utf-8");
}

/** "18/10 17h05" */
export function carimbo(d = new Date()) {
  const dm = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${dm} ${hh}h${mm}`;
}

/** "2026-10-18_17-05" */
export function carimboArquivo(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

/** Copia o mp4 para output/historico/<nome>_<data>_<hora>.mp4 e apaga cópias com mais de 7 dias. */
export function arquivarVideo(mp4Path, nome) {
  try {
    if (!existsSync(HIST_DIR)) mkdirSync(HIST_DIR, { recursive: true });
    const destino = join(HIST_DIR, `${nome}_${carimboArquivo()}.mp4`);
    copyFileSync(mp4Path, destino);
    const limite = Date.now() - 7 * 24 * 3600 * 1000;
    for (const f of readdirSync(HIST_DIR)) {
      const p = join(HIST_DIR, f);
      try { if (statSync(p).mtimeMs < limite) unlinkSync(p); } catch {}
    }
    return destino;
  } catch { return null; }
}
