/**
 * Cine Cataratas - VERTICAL 15s (1080x1920) - LAYOUT V2 "Estreias em sequencia"
 * Layout escolhido pelo Cine em 04/11/2026 (substitui o layout antigo de generate-vertical.mjs).
 *
 *  0.0-1.3   "N ESTREIAS nesta semana"
 *  1.3-10.5  uma estreia por vez em tela cheia (cartaz, nome, horarios, sala), cortina diagonal
 * 10.5-12.9  "Tambem em cartaz +K filmes" (grade 3x2)
 * 12.9-15.0  logo + "Escolha o seu filme agora" + QR grande
 *  QR rastreado (exa-qr?c=CINE1) no canto de 1.3 s ate o fim: mais de 13 s na tela.
 *
 * A pagina expoe window.__seek(segundos); o record-vertical.mjs chama essa funcao quadro a quadro.
 */

import { writeFileSync, readFileSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "output");
const LOGO_PATH = join(__dirname, "logo-cinecataratas.png");
const QR_PATH = join(__dirname, "qr-cine.png"); // QR rastreado CINE1 (destino trocado no admin "QRs dos videos")
const FONTS = join(__dirname, "fonts-v2");

const b64 = (p, mime) => {
  try { return `data:${mime};base64,${readFileSync(p).toString("base64")}`; } catch { return ""; }
};

function fontFaces() {
  const f = (file, fam, w, style = "normal") => {
    const src = b64(join(FONTS, file), "font/woff2");
    return src ? `@font-face{font-family:'${fam}';src:url(${src}) format('woff2');font-weight:${w};font-style:${style};}` : "";
  };
  return [
    f("inter-latin-500-normal.woff2", "InterV2", 500),
    f("inter-latin-600-normal.woff2", "InterV2", 600),
    f("inter-latin-800-normal.woff2", "InterV2", 800),
    f("inter-latin-900-normal.woff2", "InterV2", 900),
    f("playfair-display-latin-400-italic.woff2", "PlayV2", 400, "italic"),
    f("jetbrains-mono-latin-700-normal.woff2", "MonoV2", 700),
  ].join("\n");
}

// periodo quinta -> quinta (mesma regra do resto da automacao)
function periodo() {
  const n = new Date(); const d = n.getDay(); const f = d >= 4 ? d - 4 : d + 3;
  const qui = new Date(n); qui.setDate(n.getDate() - f);
  const prox = new Date(qui); prox.setDate(qui.getDate() + 7); // mesmo periodo qui->qui do nome do arquivo
  const dd = (x) => `${String(x.getDate()).padStart(2, "0")}/${String(x.getMonth() + 1).padStart(2, "0")}`;
  return `${dd(qui)} — ${dd(prox)}`;
}

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function formatoCurto(m) {
  const f = (m.format || "").toUpperCase();
  const parts = [];
  if (m.room) parts.push(m.room);
  if (/LEG/.test(f)) parts.push("Legendado"); else if (/DUB/.test(f)) parts.push("Dublado");
  if (/3D/.test(f)) parts.push("3D");
  const r = String(m.rating || "").trim();
  if (r) parts.push(/^L$/i.test(r) ? "Livre" : `${r} anos`);
  return parts.join(" · ");
}

function horarios(m, max = 4) {
  return [...new Set(m.showtimes || [])].sort().slice(0, max);
}

/**
 * movies: lista do scraping. options.estreias: titulos novos da semana (vem do index.mjs).
 */
export function generateVerticalHtml(movies, options = {}) {
  const logo = b64(LOGO_PATH, "image/png");
  const qr = b64(QR_PATH, "image/png");
  const novosSet = new Set((options.estreias || []).map((t) => String(t).toUpperCase().trim()));
  let destaque = movies.filter((m) => novosSet.has(String(m.title).toUpperCase().trim()));
  const temEstreia = destaque.length > 0;
  if (!temEstreia) destaque = movies.slice(0, 4);
  destaque = destaque.slice(0, 4);
  const outros = movies.filter((m) => !destaque.includes(m)).slice(0, 6);
  const nOutros = movies.length - destaque.length;

  const N = destaque.length;
  const rotulo = temEstreia ? "ESTREIA" : "EM CARTAZ";
  const introNum = temEstreia ? String(N) : String(movies.length);
  const introPal = temEstreia ? (N === 1 ? "ESTREIA" : "ESTREIAS") : "FILMES";
  const introSub = temEstreia ? "nesta semana" : "em cartaz";

  const feats = destaque.map((m, i) => `
    <section class="feat" id="f${i}">
      <div class="fbg" style="background-image:url('${esc(m.poster)}')"></div>
      <div class="fshade"></div>
      <div class="ftag"><span>${rotulo} ${i + 1}/${N}</span>${temEstreia ? '<b class="novo">NOVO</b>' : ""}</div>
      <div class="pwrap"><img class="poster" src="${esc(m.poster)}"/></div>
      <h2 class="ftitle"${String(m.title).length > 34 ? ' style="font-size:64px"' : String(m.title).length > 22 ? ' style="font-size:76px"' : ""}>${esc(m.title)}</h2>
      <div class="times">${horarios(m).length ? horarios(m).map((h) => `<span>${esc(h)}</span>`).join("") : `<span class="semh">SESSÕES E INGRESSOS NO QR</span>`}</div>
      <div class="meta">${esc(formatoCurto(m))}</div>
    </section>`).join("");

  const grid = outros.map((m) => `
      <div class="card"><div class="cimg" style="background-image:url('${esc(m.poster)}')"></div>
        <div class="cinfo"><b>${esc(m.title)}</b><i>${horarios(m, 2).length ? horarios(m, 2).join("  ·  ") : esc(formatoCurto(m))}</i></div></div>`).join("");

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/>
<style>
${fontFaces()}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1920px;overflow:hidden;background:#07070a;font-family:'InterV2',Inter,Arial,sans-serif;color:#fff}
.layer{position:absolute;inset:0;overflow:hidden}
#intro{background:radial-gradient(ellipse 60% 45% at 50% 42%,#5c0a14 0%,#22060a 55%,#07070a 100%)}
#intro .k{position:absolute;top:640px;width:100%;text-align:center;font-weight:600;font-size:34px;letter-spacing:16px;color:#ff4d5e}
#intro .n{position:absolute;top:700px;width:100%;text-align:center;font-weight:900;font-size:200px;line-height:1}
#intro .w{position:absolute;top:880px;width:100%;text-align:center;font-weight:900;font-size:196px;letter-spacing:-4px;line-height:1}
#intro .s{position:absolute;top:1100px;width:100%;text-align:center;font-family:'PlayV2',Georgia,serif;font-style:italic;font-size:84px;color:#f3d9dc}
.feat{position:absolute;inset:0;overflow:hidden;background:#0b0f18}
.fbg{position:absolute;inset:-80px;background-size:cover;background-position:center;filter:blur(60px) saturate(1.35) brightness(.62);transform:scale(1.15)}
.fshade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,.1) 55%,rgba(0,0,0,.72) 100%)}
.ftag{position:absolute;top:150px;left:56px;right:56px;display:flex;justify-content:space-between;align-items:center;font-family:'MonoV2',monospace;font-size:30px;letter-spacing:6px;color:rgba(255,255,255,.88)}
.ftag .novo{background:#e3122b;color:#fff;font-family:'InterV2';font-weight:800;font-size:28px;letter-spacing:8px;padding:10px 18px 10px 24px;border-radius:8px}
.pwrap{position:absolute;top:262px;left:50%;width:660px;height:1000px;margin-left:-330px;border-radius:26px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.08)}
.poster{width:100%;height:100%;object-fit:cover;display:block}
.ftitle{position:absolute;top:1300px;left:60px;right:60px;text-align:center;font-weight:900;font-size:92px;line-height:1.02;letter-spacing:-1px;text-shadow:0 6px 30px rgba(0,0,0,.5)}
.times{position:absolute;top:1560px;left:0;right:0;display:flex;justify-content:center;gap:22px}
.times span{font-family:'MonoV2',monospace;font-size:58px;padding:16px 26px;border-radius:16px;background:rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.22)}
.times span.semh{font-family:'InterV2',Inter,sans-serif;font-weight:800;font-size:40px;letter-spacing:4px;background:#e3122b;border-color:#e3122b}
.meta{position:absolute;top:1690px;left:0;right:0;text-align:center;font-weight:500;font-size:34px;color:rgba(255,255,255,.85)}
#hdr{position:absolute;top:0;left:0;right:0;height:120px;display:flex;justify-content:center;align-items:center;gap:26px;z-index:20}
#hdr img{height:92px;margin:-10px 0}
#hdr .sep{width:2px;height:58px;background:rgba(255,255,255,.35)}
#hdr .t{font-family:'MonoV2',monospace;font-size:26px;letter-spacing:7px;line-height:1.25;color:rgba(255,255,255,.9)}
#grid{background:radial-gradient(ellipse 80% 60% at 50% 30%,#3a0810 0%,#12060a 60%,#07070a 100%)}
#grid .k{position:absolute;top:205px;width:100%;text-align:center;font-weight:600;font-size:34px;letter-spacing:14px;color:#ff5466}
#grid .h{position:absolute;top:260px;width:100%;text-align:center;font-weight:900;font-size:120px;letter-spacing:-2px}
#grid .cards{position:absolute;top:510px;left:52px;right:52px;display:grid;grid-template-columns:repeat(3,1fr);gap:28px}
.card{background:rgba(255,255,255,.07);border-radius:16px;overflow:hidden}
.cimg{height:430px;background-size:cover;background-position:center top}
.cinfo{padding:14px 16px 18px;min-height:150px}
.cinfo b{display:block;font-weight:800;font-size:30px;line-height:1.12;text-transform:uppercase}
.cinfo i{display:block;margin-top:8px;font-style:normal;font-family:'MonoV2',monospace;font-size:27px;color:#ff8a96}
#end{background:radial-gradient(ellipse 70% 50% at 50% 45%,#4a0a12 0%,#16060a 60%,#07070a 100%)}
#end img.logo{position:absolute;top:300px;left:50%;width:560px;margin-left:-280px}
#end .h{position:absolute;top:700px;width:100%;text-align:center;font-weight:900;font-size:98px;line-height:1.02;letter-spacing:-1px}
#end .s{position:absolute;top:925px;width:100%;text-align:center;font-family:'PlayV2',Georgia,serif;font-style:italic;font-size:74px;color:#f3d9dc}
#end .q{position:absolute;bottom:420px;left:50%;margin-left:-60px;font-weight:600;font-size:40px;color:#fff;white-space:nowrap;transform:translateX(-50%);margin-left:0}
#end .loc{position:absolute;bottom:340px;width:100%;text-align:center;font-weight:600;font-size:30px;letter-spacing:10px;color:#ff6a78}
#qr{position:absolute;z-index:30;background:#fff;border-radius:22px;padding:14px 14px 8px;box-shadow:0 14px 40px rgba(0,0,0,.5);transform-origin:0 0}
#qr img{display:block;width:100%;height:auto}
#qr .l{color:#111;text-align:center;font-weight:800;font-size:17px;letter-spacing:3px;padding:6px 0 4px}
#flash{position:absolute;inset:0;background:#fff;z-index:40;opacity:0;pointer-events:none}
</style></head><body>
<div class="layer" id="intro"><div class="k">CINE CATARATAS</div><div class="n">${introNum}</div><div class="w">${introPal}</div><div class="s">${introSub}</div></div>
${feats}
<div class="layer" id="grid"><div class="k">TAMBÉM EM CARTAZ</div><div class="h">+${nOutros} filme${nOutros === 1 ? "" : "s"}</div><div class="cards">${grid}</div></div>
<div class="layer" id="end"><img class="logo" src="${logo}"/><div class="h">Escolha o seu<br/>filme agora</div><div class="s">e garanta o lugar</div><div class="q">Ingressos pelo QR</div><div class="loc">JL SHOPPING · FOZ</div></div>
<div id="hdr"><img src="${logo}"/><div class="sep"></div><div class="t">EM CARTAZ<br/>${periodo()}</div></div>
<div id="qr"><img src="${qr}"/><div class="l">INGRESSOS</div></div>
<div id="flash"></div>
<script>
const N=${N}, HAS_GRID=${outros.length > 0};
const T_INTRO=1.3, T_GRID=HAS_GRID?10.5:12.9, T_END=12.9, CUR=0.38;
const SLOT=(T_GRID-T_INTRO)/N;
const $=s=>document.querySelector(s);
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const eo=x=>1-Math.pow(1-cl(x),3);
const eio=x=>{x=cl(x);return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2};
const p=(t,a,b)=>cl((t-a)/(b-a));
function show(el,on){el.style.visibility=on?'visible':'hidden'}
// cortina diagonal: a camada nova entra por um poligono que varre da direita para a esquerda
function curtain(el,k){ if(k>=1){el.style.clipPath='none';return}
  const x=1500-2100*eio(k); el.style.clipPath='polygon('+x+'px 0,1080px 0,1080px 1920px,'+(x-420)+'px 1920px)'; }
window.__seek=function(t){
  const intro=$('#intro'), grid=$('#grid'), end=$('#end'), hdr=$('#hdr'), qr=$('#qr'), fl=$('#flash');
  // intro
  show(intro,t<T_INTRO+CUR);
  $('#intro .k').style.opacity=eo(p(t,0,.35));
  const nn=$('#intro .n'), ww=$('#intro .w'), ss=$('#intro .s');
  nn.style.transform='scale('+(1.6-0.6*eo(p(t,.05,.45)))+')'; nn.style.opacity=eo(p(t,.05,.3));
  ww.style.transform='translateY('+(60*(1-eo(p(t,.12,.5))))+'px)'; ww.style.opacity=eo(p(t,.12,.4))*(1-0.35*p(t,1.0,1.3));
  ss.style.opacity=eo(p(t,.4,.75)); ss.style.transform='translateY('+(30*(1-eo(p(t,.4,.8))))+'px)';
  // estreias
  for(let i=0;i<N;i++){
    const f=document.getElementById('f'+i); const t0=T_INTRO+i*SLOT, t1=t0+SLOT+CUR;
    const on=t>=t0 && t<t1+0.001 && t<T_END+CUR; show(f,on); if(!on) continue;
    f.style.zIndex=2+i; curtain(f,(t-t0)/CUR);
    const lt=t-t0;
    const pw=f.querySelector('.pwrap'); pw.style.transform='translateY('+(80*(1-eo(lt/0.7)))+'px) scale('+(1.0+0.035*cl(lt/SLOT))+')';
    pw.style.opacity=eo(lt/0.4);
    const ti=f.querySelector('.ftitle'); ti.style.opacity=eo((lt-.25)/.4); ti.style.transform='translateY('+(40*(1-eo((lt-.25)/.5)))+'px)';
    [...f.querySelectorAll('.times span')].forEach((s,j)=>{const q=eo((lt-.45-j*.08)/.35); s.style.opacity=q; s.style.transform='translateY('+(24*(1-q))+'px)'});
    f.querySelector('.meta').style.opacity=eo((lt-.7)/.4);
    f.querySelector('.ftag').style.opacity=eo((lt-.1)/.3);
    f.querySelector('.fbg').style.transform='scale('+(1.15+0.06*cl(lt/SLOT))+')';
  }
  // grade
  const gon=HAS_GRID && t>=T_GRID && t<T_END+CUR; show(grid,gon);
  if(gon){ grid.style.zIndex=10; curtain(grid,(t-T_GRID)/CUR); const lt=t-T_GRID;
    $('#grid .k').style.opacity=eo((lt-.1)/.3);
    const h=$('#grid .h'); h.style.opacity=eo((lt-.15)/.35); h.style.transform='scale('+(1.25-0.25*eo((lt-.15)/.45))+')';
    [...document.querySelectorAll('.card')].forEach((c,j)=>{const q=eo((lt-.3-j*.07)/.4); c.style.opacity=q; c.style.transform='translateY('+(60*(1-q))+'px)'}); }
  // final
  const eon=t>=T_END; show(end,eon);
  if(eon){ end.style.zIndex=12; curtain(end,(t-T_END)/CUR); const lt=t-T_END;
    const lg=$('#end img.logo'); lg.style.opacity=eo((lt-.15)/.4); lg.style.transform='translateY('+(30*(1-eo((lt-.15)/.5)))+'px)';
    const h=$('#end .h'); h.style.opacity=eo((lt-.3)/.4); h.style.transform='translateY('+(40*(1-eo((lt-.3)/.5)))+'px)';
    $('#end .s').style.opacity=eo((lt-.5)/.4);
    $('#end .q').style.opacity=eo((lt-.9)/.4); $('#end .loc').style.opacity=eo((lt-1.0)/.4); }
  // cabecalho (menos na abertura e no final)
  hdr.style.opacity=eo(p(t,T_INTRO,T_INTRO+.4))*(1-p(t,T_END,T_END+.25));
  // QR rastreado: pequeno no canto, cresce no final
  const qa={x:858,y:1708,w:178}, qb={x:375,y:1080,w:330};
  const k=eio(p(t,T_END+.2,T_END+.9));
  const w=qa.w+(qb.w-qa.w)*k; qr.style.width=w+'px';
  qr.style.left=(qa.x+(qb.x-qa.x)*k)+'px'; qr.style.top=(qa.y+(qb.y-qa.y)*k)+'px';
  const qin=eo(p(t,T_INTRO+.2,T_INTRO+.6)); qr.style.opacity=qin; qr.style.transform='translateX('+(220*(1-qin))+'px)';
  qr.querySelector('.l').style.display=k>.5?'none':'block';
  // flash nos cortes de bloco
  let fo=0; for(const c of [T_INTRO,T_GRID,T_END]){ if(t>=c && t<c+.12) fo=Math.max(fo,.35*(1-(t-c)/.12)); } fl.style.opacity=fo;
};
document.fonts && document.fonts.ready.then(()=>{window.__ready=true}); window.__seek(0);
</script></body></html>`;
}

export function saveVerticalHtml(html, filename = "cinema-dooh-vertical.html") {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputPath = join(OUTPUT_DIR, filename);
  writeFileSync(outputPath, html, "utf-8");
  console.log(`[vertical-v2] HTML salvo em: ${outputPath}`);
  return outputPath;
}
