// Sonda 2: quais fontes da programação do Cine Cataratas abrem a partir do GitHub?
import puppeteer from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import { writeFileSync, mkdirSync } from "fs";
puppeteer.use(Stealth());
mkdirSync("output", { recursive: true });
const ALVOS = [
  ["site", "https://cinecataratas.com.br/"],
  ["emcartaz", "https://cinecataratas.com.br/categoria-produto/em-cartaz/"],
  ["programacao", "https://cinecataratas.com.br/programacao/"],
];
const b = await puppeteer.launch({ headless: false, args: ["--no-sandbox", "--window-size=1366,900"] });
const out = [];
for (const [nome, url] of ALVOS) {
  const p = await b.newPage(); await p.setViewport({ width: 1366, height: 900 });
  let st = "?"; try { const r = await p.goto(url, { waitUntil: "networkidle2", timeout: 60000 }); st = r?.status(); } catch (e) { st = "erro " + e.message; }
  await new Promise(r => setTimeout(r, 6000));
  const t = await p.title().catch(() => "");
  const txt = await p.evaluate(() => document.body.innerText).catch(() => "");
  const imgs = await p.$$eval("img", e => e.map(i => (i.alt || "") + " | " + i.src).filter(s => /jpe?g|png|webp/i.test(s)).slice(0, 40)).catch(() => []);
  const links = await p.$$eval("a", e => [...new Set(e.map(a => a.href))].filter(h => /cine|ingress|filme|programa/i.test(h)).slice(0, 60)).catch(() => []);
  await p.screenshot({ path: `output/${nome}.png`, fullPage: false });
  writeFileSync(`output/${nome}.txt`, `HTTP ${st}\nTITULO ${t}\n\n${txt.slice(0, 4000)}\n\nIMGS\n${imgs.join("\n")}\n\nLINKS\n${links.join("\n")}`);
  out.push(`${nome}: HTTP ${st} · "${t}" · ${txt.length} chars`);
  await p.close();
}
console.log(out.join("\n"));
await b.close();
