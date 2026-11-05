/**
 * Publicador das notícias EXA — versão NUVEM (GitHub Actions, 05/11/2026).
 * Não usa o site nem senha: grava direto no sistema com a chave de serviço, pelo mesmo caminho que o site usa.
 *   1) limpa vídeos antigos não-principais do pedido (libera espaço)
 *   2) sobe o mp4 no Storage (bucket "videos") e cria videos + pedido_videos (aprovado)
 *   3) manda o arquivo às telas (upload-video-to-external-api)
 *   4) define como principal (RPC safe_set_base_video) e sincroniza o master (exa2-agenda-sync)
 *   5) remove os vídeos antigos (telas + pedido + arquivo)
 * Uso: node publish-video.mjs <arquivo.mp4> <titulo> <pedido_id>
 * Ambiente: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. NOTICIAS_PUBLICAR=0 → só testa (não grava nada).
 * Saída: 0 ok · 1 falha no envio (nada mudou nas telas) · 2 principal não confirmado (antigos mantidos)
 */
import { readFileSync, statSync, existsSync } from "fs";
import { basename, resolve } from "path";
import { execSync } from "child_process";

const SUPA = (process.env.SUPABASE_URL || "https://aakenoljsycyrcrchgxj.supabase.co").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [, , arqArg, titulo, PEDIDO] = process.argv;
const PUBLICAR = process.env.NOTICIAS_PUBLICAR !== "0";
const log = m => console.log(`[publish] ${m}`);
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!arqArg || !titulo || !PEDIDO) { log("Uso: node publish-video.mjs <arquivo.mp4> <titulo> <pedido_id>"); process.exit(1); }
const arquivo = resolve(arqArg);
if (!existsSync(arquivo)) { log(`Arquivo não encontrado: ${arquivo}`); process.exit(1); }
if (!KEY) { log("Falta SUPABASE_SERVICE_ROLE_KEY no ambiente."); process.exit(1); }

const H = (extra = {}) => ({ apikey: KEY, Authorization: `Bearer ${KEY}`, ...extra });
async function rest(path, { method = "GET", body, prefer, headers = {}, raw = false, timeout = 60000 } = {}) {
  const r = await fetch(SUPA + path, {
    method, signal: AbortSignal.timeout(timeout),
    headers: H({ ...(raw ? {} : { "Content-Type": "application/json" }), ...(prefer ? { Prefer: prefer } : {}), ...headers }),
    body: raw ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch {}
  return { ok: r.ok, status: r.status, json: j, texto: t.slice(0, 300) };
}
const funcao = (nome, body, extra = {}, timeout = 300000) => rest(`/functions/v1/${nome}`, { method: "POST", body, headers: extra, timeout });

function sonda(f) {
  try {
    const o = JSON.parse(execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration -of json "${f}"`, { encoding: "utf-8" }));
    return { w: o.streams?.[0]?.width || 1080, h: o.streams?.[0]?.height || 890, d: Math.round(Number(o.format?.duration || 50)) };
  } catch { return { w: 1080, h: 890, d: 50 }; }
}

async function videosDoPedido() {
  const r = await rest(`/rest/v1/pedido_videos?pedido_id=eq.${PEDIDO}&select=id,slot_position,is_base_video,approval_status,video_id,created_at,videos(nome,url)&order=slot_position`);
  if (!r.ok || !Array.isArray(r.json)) throw new Error(`não li os vídeos do pedido (HTTP ${r.status} ${r.texto})`);
  return r.json.map(v => ({ ...v, nome: v.videos?.nome || "", url: v.videos?.url || "" }));
}

async function remover(v) {
  const ext = await funcao("delete-video-from-external-api", { video_id: v.video_id, pedido_id: PEDIDO }, {}, 180000);
  const del = await rest(`/rest/v1/pedido_videos?id=eq.${v.id}`, { method: "DELETE", prefer: "return=minimal" });
  const caminho = (v.url.split("/storage/v1/object/public/videos/")[1] || "").split("?")[0];
  if (del.ok && caminho) await rest(`/storage/v1/object/videos/${caminho}`, { method: "DELETE" }).catch(() => {});
  log(`  remover "${v.nome}" (vídeo ${v.slot_position}): ${del.ok ? "OK" : "FALHOU"} (telas ${ext.status}, banco ${del.status})`);
  return del.ok;
}
async function limpar(manterId) {
  let n = 0;
  // LIMPAR_SO (regex): só remove vídeos cujo nome bate (ex.: Cine "cine|cinema" — os do hotel ficam)
  const so = process.env.LIMPAR_SO ? new RegExp(process.env.LIMPAR_SO, "i") : null;
  for (const v of await videosDoPedido()) if (!v.is_base_video && v.id !== manterId && (!so || so.test(v.nome))) { if (await remover(v)) n++; }
  return n;
}

async function main() {
  log(`=== Publicador EXA (nuvem) === ${titulo} → pedido ${PEDIDO}${PUBLICAR ? "" : " [TESTE: não publica]"}`);
  const ped = await rest(`/rest/v1/pedidos?id=eq.${PEDIDO}&select=id,client_id,client_name,is_master,status`);
  const pedido = ped.json?.[0];
  if (!pedido) { log(`ERRO: pedido não encontrado (HTTP ${ped.status} ${ped.texto})`); process.exit(1); }
  const antes = await videosDoPedido();
  log(`Pedido "${pedido.client_name}" (${pedido.status}) · vídeos: ${antes.map(v => `${v.slot_position}:${v.nome}${v.is_base_video ? "★" : ""}`).join(" | ") || "nenhum"}`);
  if (!PUBLICAR) { log("Teste: conexão com o sistema OK. Nada foi alterado."); return; }

  // 1) limpeza antes (libera espaço; o principal atual segue no ar)
  try { log(`Limpeza antes do envio: ${await limpar(null)} vídeo(s) antigo(s) removido(s).`); }
  catch (e) { log(`Aviso: limpeza antes falhou (${e.message}) — sigo.`); }

  // 2) arquivo no Storage + registros
  const meta = sonda(arquivo), tamanho = statSync(arquivo).size;
  const nomeArq = `${Date.now()}_${basename(arquivo).replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const caminho = `${pedido.client_id}/${nomeArq}`;
  const up = await rest(`/storage/v1/object/videos/${caminho}`, { method: "POST", raw: true, body: readFileSync(arquivo), headers: { "Content-Type": "video/mp4", "x-upsert": "false", "cache-control": "3600" }, timeout: 300000 });
  if (!up.ok) { log(`ERRO: upload no Storage falhou (HTTP ${up.status} ${up.texto}). Nada mudou nas telas.`); process.exit(1); }
  const url = `${SUPA}/storage/v1/object/public/videos/${caminho}`;
  log(`Arquivo no Storage (${(tamanho / 1048576).toFixed(1)} MB, ${meta.w}x${meta.h}, ${meta.d}s).`);

  const vid = await rest(`/rest/v1/videos`, { method: "POST", prefer: "return=representation", body: {
    client_id: pedido.client_id, nome: titulo, url, origem: "cliente", status: "ativo", duracao: meta.d,
    orientacao: meta.w >= meta.h ? "horizontal" : "vertical", largura: meta.w, altura: meta.h,
    tamanho_arquivo: tamanho, formato: "mp4", tem_audio: false } });
  const videoId = vid.json?.[0]?.id;
  if (!videoId) { log(`ERRO: não criei o registro do vídeo (HTTP ${vid.status} ${vid.texto}).`); await rest(`/storage/v1/object/videos/${caminho}`, { method: "DELETE" }); process.exit(1); }

  const ocupados = new Set((await videosDoPedido()).map(v => v.slot_position));
  const slot = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].find(s => !ocupados.has(s));
  if (!slot) { log("ERRO: pedido com 10 vídeos e nenhum pôde ser removido. Nada mudou nas telas."); process.exit(1); }
  const agora = new Date().toISOString();
  const pv = await rest(`/rest/v1/pedido_videos`, { method: "POST", prefer: "return=representation", body: {
    pedido_id: PEDIDO, video_id: videoId, slot_position: slot, approval_status: "approved", approved_at: agora,
    selected_for_display: false, is_active: false, updated_at: agora } });
  const novoId = pv.json?.[0]?.id;
  if (!novoId) { log(`ERRO: não vinculei o vídeo ao pedido (HTTP ${pv.status} ${pv.texto}).`); process.exit(1); }
  log(`Vídeo no pedido: "${titulo}" (vídeo ${slot}, aprovado).`);

  // 3) arquivo para as telas
  const aws = await funcao("upload-video-to-external-api", { pedido_video_id: novoId });
  log(`Envio do arquivo às telas: HTTP ${aws.status} ${aws.json?.success === false ? "(" + String(aws.json?.error || "").slice(0, 120) + ")" : ""}`);

  // 4) principal + master nas telas
  const rpc = await rest(`/rest/v1/rpc/safe_set_base_video`, { method: "POST", body: { p_slot_id: novoId } });
  if (!rpc.ok || rpc.json?.success !== true) { log(`ERRO: o sistema recusou definir o principal (HTTP ${rpc.status} ${rpc.texto}). Antigos mantidos.`); process.exit(2); }
  const tok = (await rest(`/rest/v1/exa2_config?chave=eq.cron_token&select=valor`)).json?.[0]?.valor;
  let corr = [];
  for (let t = 1; t <= 3; t++) {
    const s = await funcao("exa2-agenda-sync", { pedido_id: PEDIDO }, tok ? { "x-exa2-cron": tok } : {});
    corr = (s.json?.correcoes || []).filter(c => c.tipo === "master" || c.tipo === "arquivo");
    log(`Sincronização com as telas (tentativa ${t}): HTTP ${s.status}${corr.length ? ` · ${corr.map(c => c.tipo + (c.ok === false ? " FALHOU" : " ok")).join(", ")}` : " · nada pendente"}`);
    if (s.ok && !corr.some(c => c.ok === false)) break;
    await sleep(20000);
  }
  const conf = (await videosDoPedido()).find(v => v.id === novoId);
  if (!conf?.is_base_video) { log("ERRO: o principal não ficou gravado. Antigos mantidos."); process.exit(2); }

  // 5) limpeza final
  let removidos = 0;
  try { removidos = await limpar(novoId); } catch (e) { log(`Aviso: limpeza final falhou (${e.message}); a próxima rodada limpa.`); }
  log(`=== PUBLICACAO CONCLUIDA === principal: "${titulo}" · removidos: ${removidos}`);
}

main().catch(e => { log(`ERRO: ${e.message}`); process.exit(1); });
