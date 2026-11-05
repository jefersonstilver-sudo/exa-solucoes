// Sonda: o site de ingressos do Cine Cataratas abre a partir do GitHub? (Cloudflare)
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { writeFileSync, mkdirSync } from "fs";
puppeteer.use(Stealth());
mkdirSync("output", { recursive: true });
const URL = "https://webcinecataratas.com/compra_ingresso_online_new/?filial=002";
const b = await puppeteer.launch({ headless: process.env.HEADLESS === "1" ? "new" : false, args: ["--no-sandbox", "--disable-blink-features=AutomationControlled", "--window-size=1366,900"] });
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
const r = await p.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(e => ({ status: () => "erro " + e.message }));
console.log("HTTP", r.status());
let ok = false;
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const t = await p.title().catch(() => "");
  const n = await p.$$eval(".div-filmes-pais", e => e.length).catch(() => 0);
  if (i % 5 === 0) console.log(`${i * 2}s título="${t}" filmes=${n}`);
  if (n > 0) { ok = true; console.log(`OK em ${i * 2}s: ${n} filmes`); break; }
}
await p.screenshot({ path: "output/sonda.png" });
writeFileSync("output/sonda.txt", (await p.evaluate(() => document.body.innerText)).slice(0, 3000));
console.log(ok ? "RESULTADO: PASSOU" : "RESULTADO: BLOQUEADO");
await b.close();
