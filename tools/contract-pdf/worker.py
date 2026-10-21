"""EXA contract PDF worker. Renders the system's own contract HTML (create-contract-from-proposal) to PDF with Chromium.
modo=contrato: sends the PDF to ClickSign (clicksign-create-contract). modo=modelo: sends the PDF back to Sofia to deliver as a model on WhatsApp.
No third-party PDF service; PDFs are never stored."""
import os, sys, json, base64, urllib.request, urllib.error
import urllib.parse

URL = os.environ["SUPABASE_URL"].rstrip("/")
KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
TOKEN = os.environ["SOFIA_WEBHOOK_TOKEN"]
MODO = os.environ.get("MODO") or "contrato"
CID = os.environ.get("CONTRATO_ID", "")
PROPOSAL = os.environ.get("PROPOSAL_ID", "")
CONVERSA = os.environ.get("CONVERSA_ID", "")

def call(method, path, body=None):
    h = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}
    r = urllib.request.Request(URL + path, data=json.dumps(body).encode() if body is not None else None, method=method, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=180) as resp:
            t = resp.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{path} -> {e.code} {e.read()[:300]!r}")
    return json.loads(t) if t[:1] in b"[{" else t

def notify(action, payload):
    r = urllib.request.Request(f"{URL}/functions/v1/sofia-agent?action={action}&token={urllib.parse.quote(TOKEN)}",
        data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json"})
    try: urllib.request.urlopen(r, timeout=90).read()
    except urllib.error.HTTPError as e: print("notify failed", e.code, e.read()[:300])
    except Exception as e: print("notify failed", e)

def render(html):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.set_content(html, wait_until="networkidle"); pg.emulate_media(media="print")
        pdf = pg.pdf(format="A4", print_background=True, margin={"top": "12mm", "bottom": "12mm", "left": "10mm", "right": "10mm"})
        b.close()
    if len(pdf) < 5000: raise RuntimeError("PDF suspeito (muito pequeno)")
    return pdf

def modelo():
    view = call("POST", "/functions/v1/create-contract-from-proposal", {"proposalId": PROPOSAL, "preview_only": True})
    html = view.get("contractHtml")
    if not html: raise RuntimeError("sem contractHtml: " + json.dumps(view)[:300])
    notify("modelo", {"conversa_id": CONVERSA, "pdf_base64": base64.b64encode(render(html)).decode()})

def contrato():
    rows = call("GET", f"/rest/v1/contratos_legais?id=eq.{CID}&select=proposta_id,status,clicksign_envelope_id")
    if not rows: sys.exit("contrato nao encontrado")
    if rows[0].get("clicksign_envelope_id"):
        print("ja enviado ao ClickSign"); notify("contrato", {"contrato_id": CID}); return
    view = call("POST", "/functions/v1/create-contract-from-proposal", {"proposalId": rows[0]["proposta_id"]})
    html = view.get("contractHtml")
    if not html: raise RuntimeError("sem contractHtml: " + json.dumps(view)[:300])
    res = call("POST", "/functions/v1/clicksign-create-contract", {"contrato_id": CID, "pdf_base64": base64.b64encode(render(html)).decode()})
    print("clicksign:", json.dumps(res)[:300])
    notify("contrato", {"contrato_id": CID})

if __name__ == "__main__":
    try: (modelo if MODO == "modelo" else contrato)()
    except Exception as e:
        print("ERROR", e)
        if MODO == "modelo": notify("modelo", {"conversa_id": CONVERSA, "error": str(e)[:400]})
        else: notify("contrato", {"contrato_id": CID, "error": str(e)[:400]})
        sys.exit(1)
