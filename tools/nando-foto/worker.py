# Imagem do aviso do Nando para o sindico encaminhar nos grupos de WhatsApp do condominio.
# Roda no GitHub Actions (render-nando.yml), so quando o sindico aceita receber a imagem.
# Formato: arte vertical de celular 1080x1920, de ponta a ponta (sem faixa nem moldura), com o aviso montado com os MESMOS
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
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=block" rel="stylesheet">
<link rel="stylesheet" href="%(site)s/nando/aviso-nando.css?x=%(t)d">
<style>
html,body{margin:0;background:#140a1c}
/* arte de ponta a ponta: so o aviso, sem faixa, sem moldura */
#tela{position:relative;width:540px;height:960px;overflow:hidden;background:#140a1c}
#tela .na-raiz{font-family:Inter,system-ui,sans-serif !important}
</style></head><body><div id="tela"></div>
<script src="%(site)s/nando/aviso-nando.js?x=%(t)d"></script></body></html>"""

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
            # a pagina e montada no endereco do proprio site (mesma origem dos arquivos do aviso)
            pg.route(f"{SITE}/__nando_imagem__", lambda r: r.fulfill(status=200, content_type="text/html; charset=utf-8", body=HTML % {"site": SITE, "t": agora}))
            pg.goto(f"{SITE}/__nando_imagem__", wait_until="load", timeout=45000)
            for _ in range(80):  # espera o script do aviso carregar (sem wait_for_function)
                if pg.evaluate("() => !!(window.NandoAviso && window.NandoAviso.montar)"):
                    break
                pg.wait_for_timeout(250)
            else:
                raise RuntimeError("o script do aviso (aviso-nando.js) nao carregou")
            pg.unroute(f"{SITE}/__nando_imagem__")
            pg.evaluate("() => document.fonts.ready")  # Inter carregada antes de montar (o texto se ajusta pela largura real)
            pg.evaluate("d => { window.__m = window.NandoAviso.montar(document.getElementById('tela'), d); }", dados)
            pg.wait_for_timeout(400)
            pg.evaluate("() => document.querySelectorAll('.na-raiz').forEach(r => r.classList.add('na-on'))")
            pg.wait_for_timeout(5500)  # animacoes de entrada terminam
            png = pg.locator("#tela").screenshot(type="png")
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
