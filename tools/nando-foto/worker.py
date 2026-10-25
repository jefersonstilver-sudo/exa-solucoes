# Imagem do aviso do Nando para o sindico encaminhar nos grupos de WhatsApp do condominio.
# Roda no GitHub Actions (render-nando.yml), so quando o sindico aceita receber a imagem.
# Formato: vertical de celular 1080x1920 — faixa com o nome do predio + o aviso montado com os MESMOS
# arquivos do painel (aviso-nando.js/css do site). Guarda no Storage e pede ao nando-webhook para enviar.
# Qualquer erro volta para o nando-webhook (fica registrado no banco), para nunca falhar calado.
import json, os, sys, time, traceback, urllib.request
from playwright.sync_api import sync_playwright

SITE = "https://examidia.com.br"
URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
avisos = json.loads(os.environ.get("AVISOS") or "[]")      # [{"id": "...", "url": "<json do aviso>", "predio": "Nome"}]
telefone = os.environ.get("TELEFONE", "")
legenda = os.environ.get("LEGENDA", "")
teste = (os.environ.get("TESTE") or "").lower() in ("1", "true", "sim")

HTML = """<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="%(site)s/nando/aviso-nando.css?x=%(t)d">
<style>
html,body{margin:0;background:#0d0b0c}
#folha{position:relative;width:540px;height:960px;overflow:hidden;background:#0d0b0c;
  background-image:radial-gradient(600px 300px at 20%% -10%%,rgba(196,32,38,.45),transparent 60%%);font-family:Montserrat,system-ui,sans-serif;color:#fff}
#topo{position:absolute;left:0;right:0;top:0;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;box-sizing:border-box}
#topo .t1{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.6);font-weight:600}
#topo .t2{font-size:18px;font-weight:800;line-height:1.1;max-width:400px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#topo .exa{font-size:11px;font-weight:800;letter-spacing:.12em;color:rgba(255,255,255,.55)}
#moldura{position:absolute;left:14px;right:14px;top:62px;bottom:14px;border-radius:22px;overflow:hidden;box-shadow:0 18px 40px rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.1)}
#tela{position:absolute;inset:0;background:#140a1c}
</style></head><body><div id="folha">
<div id="topo"><div><div class="t1">Comunicado do condomínio</div><div class="t2">%(predio)s</div></div><div class="exa">EXA</div></div>
<div id="moldura"><div id="tela"></div></div>
</div><script src="%(site)s/nando/aviso-nando.js?x=%(t)d"></script></body></html>"""

def baixar_json(u):
    with urllib.request.urlopen(u, timeout=30) as r:
        return json.loads(r.read())

def subir(caminho, dados):
    req = urllib.request.Request(f"{URL}/storage/v1/object/nando-midia/{caminho}", data=dados, method="POST",
                                 headers={"Authorization": f"Bearer {KEY}", "apikey": KEY, "Content-Type": "image/png", "x-upsert": "true"})
    urllib.request.urlopen(req, timeout=60).read()
    return f"{URL}/storage/v1/object/public/nando-midia/{caminho}"

def avisar(corpo):
    req = urllib.request.Request(f"{URL}/functions/v1/nando-webhook?action=fotos", data=json.dumps(corpo).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    print(urllib.request.urlopen(req, timeout=60).read()[:300])

def main():
    if not avisos or not telefone:
        print("nada para fazer"); return
    fotos = []
    agora = int(time.time())
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        pg = nav.new_page(viewport={"width": 540, "height": 960}, device_scale_factor=2)
        for a in avisos:
            dados = baixar_json(a["url"])
            predio = (a.get("predio") or "").replace("<", "").replace(">", "")
            pg.set_content(HTML % {"site": SITE, "t": agora, "predio": predio}, wait_until="networkidle", timeout=45000)
            pg.wait_for_function("window.NandoAviso && window.NandoAviso.montar", timeout=30000)
            pg.evaluate("d => { window.__m = window.NandoAviso.montar(document.getElementById('tela'), d); }", dados)
            pg.wait_for_timeout(400)
            pg.evaluate("() => document.querySelectorAll('.na-raiz').forEach(r => r.classList.add('na-on'))")
            pg.wait_for_timeout(5500)  # animacoes de entrada terminam
            png = pg.locator("#folha").screenshot(type="png")
            fotos.append(subir(f"fotos/{a['id']}_{agora}.png", png))
            print("foto ok", a["id"], len(png))
        nav.close()
    avisar({"telefone": telefone, "imagens": fotos, "legenda": legenda, "teste": teste})

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        erro = f"{type(e).__name__}: {e}"[:600]
        print("FALHOU:", erro); traceback.print_exc()
        linha = traceback.format_exc().strip().splitlines()
        onde = " | ".join(l.strip() for l in linha[-6:])[:900]
        print(f"::error title=robo da imagem::{erro} || {onde}", flush=True)  # aparece nas anotacoes do GitHub
        try: avisar({"telefone": telefone, "imagens": [], "erro": erro, "teste": teste})
        except Exception as e2: print("nem consegui avisar:", e2)
        sys.exit(1)
