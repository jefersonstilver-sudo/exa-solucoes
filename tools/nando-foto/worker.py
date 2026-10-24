# Foto do aviso do Nando (como aparece na tela do elevador) para mandar no WhatsApp do sindico.
# Roda no GitHub Actions (render-nando.yml). Monta o aviso com os MESMOS arquivos do painel
# (aviso-nando.js/css do site), tira a foto em 1080x1896, guarda no Storage e pede ao nando-webhook para enviar.
import json, os, sys, time, urllib.request
from playwright.sync_api import sync_playwright

SITE = "https://examidia.com.br"
URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
avisos = json.loads(os.environ.get("AVISOS") or "[]")      # [{"id": "...", "url": "<json do aviso>"}]
telefone = os.environ.get("TELEFONE", "")
legenda = os.environ.get("LEGENDA", "")

HTML = """<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="%s/nando/aviso-nando.css?x=%d">
<style>html,body{margin:0;background:#140a1c}#tela{position:relative;width:540px;height:948px;overflow:hidden;background:#140a1c}</style>
</head><body><div id="tela"></div><script src="%s/nando/aviso-nando.js?x=%d"></script></body></html>"""

def baixar_json(u):
    with urllib.request.urlopen(u, timeout=30) as r:
        return json.loads(r.read())

def subir(caminho, dados):
    req = urllib.request.Request(f"{URL}/storage/v1/object/nando-midia/{caminho}", data=dados, method="POST",
                                 headers={"Authorization": f"Bearer {KEY}", "apikey": KEY, "Content-Type": "image/png", "x-upsert": "true"})
    urllib.request.urlopen(req, timeout=60).read()
    return f"{URL}/storage/v1/object/public/nando-midia/{caminho}"

def main():
    if not avisos or not telefone:
        print("nada para fazer"); return
    fotos = []
    agora = int(time.time())
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        pg = nav.new_page(viewport={"width": 540, "height": 948}, device_scale_factor=2)
        for a in avisos:
            dados = baixar_json(a["url"])
            pg.set_content(HTML % (SITE, agora, SITE, agora), wait_until="networkidle")
            pg.wait_for_function("window.NandoAviso && window.NandoAviso.montar", timeout=20000)
            pg.evaluate("d => { window.__m = window.NandoAviso.montar(document.getElementById('tela'), d); }", dados)
            pg.wait_for_timeout(300)
            pg.evaluate("() => document.querySelectorAll('.na-raiz').forEach(r => r.classList.add('na-on'))")
            pg.wait_for_timeout(6000)  # deixa as animacoes de entrada terminarem
            png = pg.locator("#tela").screenshot(type="png")
            fotos.append(subir(f"fotos/{a['id']}_{agora}.png", png))
            print("foto ok", a["id"], len(png))
        nav.close()
    corpo = json.dumps({"telefone": telefone, "imagens": fotos, "legenda": legenda}).encode()
    req = urllib.request.Request(f"{URL}/functions/v1/nando-webhook?action=fotos", data=corpo, method="POST",
                                 headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    print(urllib.request.urlopen(req, timeout=60).read()[:200])

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print("FALHOU:", e); sys.exit(1)
