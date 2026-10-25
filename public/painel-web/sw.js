/* Replica web do painel EXA.
 * A tela (ui/) e EXATAMENTE a mesma que roda nos NUCs; ela pede /cache/... como no elevador.
 * Aqui esses pedidos sao atendidos ao vivo:
 *   /cache/updates.json   -> a mesma programacao que o NUC do predio baixa (ExaSistema, via nando-painel)
 *   /cache/<arquivo>      -> o mesmo arquivo no S3 do predio (telas-clientes/<pasta_s3>/<arquivo>)
 *   /cache/cotacao.json   -> cotacoes ao vivo (AwesomeAPI)
 *   /cache/noticias.json  -> noticias do ExaSistema
 *   /cache/live(s).json   -> lista vazia (a tela usa as cameras padrao dela)
 */
const FN = "https://aakenoljsycyrcrchgxj.supabase.co/functions/v1/nando-painel";
const S3 = "https://telas-clientes.s3.sa-east-1.amazonaws.com";
const CFG = "/painel-web/__cfg";
const memo = new Map(); // predio -> { t, dados }

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

const resp = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function sessao() {
  try { const c = await caches.open("replica"); const r = await c.match(CFG); return r ? (await r.json()).sessao || "" : ""; } catch { return ""; }
}
async function predioDoCliente(clientId) {
  const c = clientId ? await self.clients.get(clientId) : null;
  try { return new URL(c ? c.url : "").searchParams.get("p") || ""; } catch { return ""; }
}
async function chamar(corpo) {
  const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...corpo, sessao: await sessao() }) });
  return { status: r.status, j: await r.json().catch(() => ({})) };
}
const voando = new Map(); // predio -> leitura em andamento (a tela pede o updates.json em 3 lugares ao mesmo tempo)
async function updates(predio) {
  const m = memo.get(predio);
  if (m && Date.now() - m.t < 15000) return m.dados;
  if (voando.has(predio)) return voando.get(predio);
  const pr = (async () => {
    const { status, j } = await chamar({ acao: "replica", arq: "updates", predio });
    if (status !== 200 || !j.updates) throw Object.assign(new Error(j.erro || "falhou"), { status });
    memo.set(predio, { t: Date.now(), dados: j.updates });
    // avisa a pagina de fora (nome do predio, hora da ultima leitura)
    self.clients.matchAll({ includeUncontrolled: true }).then((cs) => cs.forEach((c) => c.postMessage({ tipo: "replica-lida", predio, nome: j.predio, em: Date.now() })));
    return j.updates;
  })().finally(() => voando.delete(predio));
  voando.set(predio, pr);
  return pr;
}
async function cotacao() {
  const r = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,ARS-BRL,PYG-BRL", { cache: "no-store" });
  const d = await r.json();
  const awesomeapi = {};
  for (const [k, v] of Object.entries(d || {})) {
    const casas = Number(v.bid) < 0.1 ? 4 : 2;
    awesomeapi[k] = { code: v.code, codein: v.codein, nome: v.name, compra: Number(v.bid).toFixed(casas).replace(".", ","), variacao: Number(v.pctChange || 0).toFixed(2) };
  }
  return { cotacao: { awesomeapi } };
}
async function noticias() {
  const { j } = await chamar({ acao: "replica", arq: "noticias" });
  const jovempan = [], portal_cidade = [];
  for (const n of j.linhas || []) {
    const titulo = n.titulo || n.title || n.manchete;
    if (!titulo) continue;
    const link = n.link || n.url || "";
    const origem = String(n.origem || n.fonte || n.source || "").toLowerCase().includes("jovem") ? "jovempan" : "portal_cidade";
    const item = { titulo, categoria: n.categoria || n.category || "Notícias", origem, qr_code: "" };
    if (link) item.qr_code = "__qr__/" + encodeURIComponent(link); // vira QR abaixo
    (origem === "jovempan" ? jovempan : portal_cidade).push(item);
  }
  return { jovempan, portal_cidade };
}

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin) return;
  // QR das noticias (a tela monta "../../" + qr_code)
  const iq = u.pathname.indexOf("/__qr__/");
  if (iq >= 0) {
    const link = decodeURIComponent(u.pathname.slice(iq + 8));
    e.respondWith(Response.redirect("https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=" + encodeURIComponent(link), 302));
    return;
  }
  // arquivos fixos da tela que ficam fora do pacote ui/
  if (u.pathname.startsWith("/assets/") && !u.pathname.startsWith("/assets/index")) {
    // a tela usa /assets/no_notices.png (absoluto) e ../assets/ (relativo): os dois vem de /painel-web/assets/
    if (/\.(png|svg|jpg|mp4|webm)$/i.test(u.pathname)) { e.respondWith(fetch("/painel-web" + u.pathname)); return; }
  }
  // clima: a tela chama a API da EXA em http (o navegador bloqueia); a replica usa a mesma API por https
  if (u.pathname === "/painel-web/ui/scripts/clima.js") {
    e.respondWith(fetch(e.request.url, { cache: "no-store" }).then((r) => r.text()).then((t) => new Response(t.replace('"http://18.228.252.149:8000"', '"/__api"'), { headers: { "Content-Type": "text/javascript; charset=utf-8" } })));
    return;
  }
  if (u.pathname === "/__api/api/clima") {
    e.respondWith((async () => {
      const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "replica", arq: "clima", sessao: await sessao() }) });
      return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
    })());
    return;
  }
  if (!u.pathname.startsWith("/cache/")) return;
  const arq = decodeURIComponent(u.pathname.slice(7));
  e.respondWith((async () => {
    const predio = await predioDoCliente(e.clientId || e.resultingClientId);
    try {
      if (arq === "updates.json") return resp(await updates(predio));
      if (arq === "cotacao.json") return resp(await cotacao());
      if (arq === "noticias.json") return resp(await noticias());
      if (arq === "live.json" || arq === "lives.json") return resp({ lives: [] });
      // midia: o mesmo arquivo que o NUC baixou, direto do S3 do predio
      const d = await updates(predio);
      const pasta = String(d.pasta_s3 || "").replace(/^\/+|\/+$/g, "");
      const alvo = `${S3}/${pasta}/${arq.split("/").map(encodeURIComponent).join("/")}`;
      if (/\.(mp4|webm|mov|m4v)$/i.test(arq) || e.request.destination === "video") return Response.redirect(alvo, 302);
      // imagens, PDFs e avisos do Nando: o S3 nao libera o navegador, entao vem pelo nando-painel (e ficam guardados aqui;
      // os nomes dos arquivos mudam a cada aviso novo, entao o mesmo nome e sempre o mesmo arquivo)
      const caixa = await caches.open("replica-arquivos");
      const chave = `/painel-web/__arq/${pasta}/${arq}`;
      const guardado = await caixa.match(chave);
      if (guardado) return guardado;
      const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao: "replica", arq: "arquivo", predio, caminho: arq, sessao: await sessao() }) });
      const corpo = await r.blob();
      const pronto = new Response(corpo, { status: r.status, headers: { "Content-Type": r.headers.get("Content-Type") || "application/octet-stream" } });
      if (r.ok) await caixa.put(chave, pronto.clone());
      return pronto;
    } catch (err) {
      return resp({ erro: String(err && err.message || err) }, err && err.status || 502);
    }
  })());
});
