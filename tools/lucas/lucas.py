"""Lucas Editor: motor de video da EXA com revisao visual.

Fluxo: ficha da marca + arquivos do cliente (logo, fotos, videos, banco Coverr autorizado)
 -> Opus escreve a cena (canvas, funcao pura do tempo) -> render de quadros parados
 -> Opus olha os quadros e corrige (ate LUCAS_ROUNDS rodadas) -> export quadro a quadro, MUDO,
    10 s horizontal 1920x1080 ou 15 s vertical 1080x1920 -> storage + pasta da marca -> avisa a Sofia.

Uso no GitHub Actions: python tools/lucas/lucas.py  (le JOB_ID e segredos do ambiente)
Teste local sem banco/IA: python tools/lucas/lucas.py --local spec.json cena.js saida.mp4
"""
import base64, io, json, os, re, shutil, subprocess, sys, time, urllib.parse, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
FPS = 30
MODEL = os.environ.get("LUCAS_MODEL") or "claude-opus-5-5"
ROUNDS = int(os.environ.get("LUCAS_ROUNDS") or "3")
FONTES_PADRAO = ["Inter", "Oswald", "Playfair Display", "Montserrat", "Poppins", "Bebas Neue", "DM Serif Display", "Archivo Black", "Fraunces", "Nunito"]
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"


def log(*a):
    print("[lucas]", *a, flush=True)


# ---------------------------------------------------------------- Supabase
class SB:
    def __init__(self):
        self.url = os.environ["SUPABASE_URL"].rstrip("/")
        self.key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    def req(self, method, path, body=None, headers=None, raw=None, timeout=120):
        h = {"apikey": self.key, "Authorization": "Bearer " + self.key}
        h.update(headers or {})
        data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
        if body is not None:
            h["Content-Type"] = "application/json"
        r = urllib.request.Request(self.url + path, data=data, method=method, headers=h)
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            t = resp.read()
            return json.loads(t) if t and t[:1] in b"[{" else t

    def upload(self, bucket, path, blob, ctype):
        self.req("POST", f"/storage/v1/object/{bucket}/{path}", raw=blob, headers={"Content-Type": ctype, "x-upsert": "true"})
        return f"{self.url}/storage/v1/object/public/{bucket}/{urllib.parse.quote(path)}"


def baixar(url, dest, timeout=180):
    r = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(r, timeout=timeout) as resp, open(dest, "wb") as f:
        shutil.copyfileobj(resp, f)
    return dest


def ffprobe(path):
    o = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", str(path)], capture_output=True, text=True).stdout
    j = json.loads(o or "{}")
    st = (j.get("streams") or [{}])[0]
    return int(st.get("width") or 0), int(st.get("height") or 0), float((j.get("format") or {}).get("duration") or 0)


# ---------------------------------------------------------------- preparacao dos arquivos
def preparar_imagem(src, dest, maxlado=2200):
    from PIL import Image, ImageOps
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if max(im.size) > maxlado:
        im.thumbnail((maxlado, maxlado))
    if dest.suffix == ".png":
        im.convert("RGBA").save(dest)
    else:
        im.convert("RGB").save(dest, quality=90)
    return im.size


def preparar_clipe(src, outdir, W, H, maxdur=12.0):
    """extrai quadros (30 fps) que cobrem o canvas inteiro; devolve dict do clipe"""
    w, h, dur = ffprobe(src)
    if not w or not h or dur < 0.8:
        return None
    outdir.mkdir(parents=True, exist_ok=True)
    d = min(dur, maxdur)
    # escala para COBRIR o canvas (o render corta o excesso)
    vf = f"fps={FPS},scale='if(gt(a,{W}/{H}),-2,{W})':'if(gt(a,{W}/{H}),{H},-2)'"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(src), "-t", f"{d:.2f}", "-vf", vf, "-q:v", "3", str(outdir / "%05d.jpg")], check=True)
    n = len(list(outdir.glob("*.jpg")))
    if n < 5:
        return None
    from PIL import Image
    fw, fh = Image.open(outdir / "00001.jpg").size
    return {"n": n, "fps": FPS, "w": fw, "h": fh, "dur": round(n / FPS, 2)}


def baixar_fontes(familias, fontdir):
    """Google Fonts -> woff2 locais (latin + latin-ext). Devolve (css, familias_ok)."""
    fontdir.mkdir(parents=True, exist_ok=True)
    css_out, ok = [], []
    for fam in dict.fromkeys(f for f in familias if f):
        css = None
        for q in [f"{fam}:ital,wght@0,400;0,700;0,800;0,900;1,400;1,700", f"{fam}:wght@400;700;800;900", f"{fam}:wght@400;700", fam]:
            try:
                r = urllib.request.Request("https://fonts.googleapis.com/css2?family=" + urllib.parse.quote(q) + "&display=block", headers={"User-Agent": UA})
                css = urllib.request.urlopen(r, timeout=30).read().decode()
                break
            except Exception:
                continue
        if not css:
            log("fonte indisponivel:", fam)
            continue
        blocos = re.findall(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*{[^}]*})", css)
        if not blocos:
            blocos = [("latin", b) for b in re.findall(r"@font-face\s*{[^}]*}", css)]
        n = 0
        for sub, bl in blocos:
            if sub not in ("latin", "latin-ext"):
                continue
            m = re.search(r"url\((https://[^)]+)\)", bl)
            if not m:
                continue
            nome = re.sub(r"[^A-Za-z0-9]", "", fam) + "_" + str(len(list(fontdir.iterdir()))) + ".woff2"
            try:
                baixar(m.group(1), fontdir / nome, timeout=60)
            except Exception:
                continue
            css_out.append(bl.replace(m.group(1), "fonts/" + nome))
            n += 1
        if n:
            ok.append(fam)
    return "\n".join(css_out), ok


def gerar_qr(numero, dest):
    import segno
    d = re.sub(r"\D", "", numero or "")
    if len(d) < 10:
        return False
    if not d.startswith("55"):
        d = "55" + d
    segno.make("https://wa.me/" + d, error="m").save(str(dest), scale=16, border=2, dark="#000000", light="#ffffff")
    return True


# ---------------------------------------------------------------- harness e render
def montar_pagina(work, spec, fontes_css, cena_js):
    shutil.copy(HERE / "runtime.js", work / "runtime.js")
    (work / "cena.js").write_text(cena_js + "\n;window.__cenaOk = typeof renderAt === 'function';", encoding="utf-8")
    html = (
        "<!doctype html><html><head><meta charset='utf-8'><style>" + fontes_css
        + "html,body{margin:0;padding:0;background:#000;overflow:hidden}canvas{display:block}</style></head><body>"
        + f"<canvas id='c' width='{spec['W']}' height='{spec['H']}'></canvas>"
        + "<script>window.SPEC=" + json.dumps(spec) + ";window.ERRS=[];window.addEventListener('error',e=>window.ERRS.push(String(e.message)));</script>"
        + "<script src='runtime.js'></script><script src='cena.js'></script></body></html>"
    )
    (work / "index.html").write_text(html, encoding="utf-8")


class Render:
    def __init__(self, work, W, H):
        from playwright.sync_api import sync_playwright
        self.pw = sync_playwright().start()
        self.br = self.pw.chromium.launch(args=["--allow-file-access-from-files", "--disable-web-security"])
        self.work, self.W, self.H = work, W, H

    def abrir(self):
        pg = self.br.new_page(viewport={"width": self.W, "height": self.H}, device_scale_factor=1)
        erros = []
        pg.on("pageerror", lambda e: erros.append(str(e)))
        pg.route("**/*", lambda r: r.continue_() if r.request.url.startswith("file://") else r.abort())
        pg.goto("file://" + str(self.work / "index.html"))
        pg.wait_for_timeout(300)
        ok = pg.evaluate("window.__cenaOk === true")
        if not ok:
            erros += pg.evaluate("window.ERRS || []")
            if not erros:
                erros.append("renderAt(t, ctx) nao foi definida")
        pg.evaluate("L.ready")
        return pg, erros

    def quadro(self, pg, t, qualidade=92):
        lay = pg.evaluate("t => window.__frame(t)", t)
        img = pg.locator("#c").screenshot(type="jpeg", quality=qualidade)
        return img, lay

    def fechar(self):
        try:
            self.br.close()
            self.pw.stop()
        except Exception:
            pass


def instantes(dur):
    return [round(dur * f, 2) for f in (0.05, 0.16, 0.29, 0.42, 0.55, 0.68, 0.82, 0.96)]


def validar(rd, dur):
    """renderiza 8 quadros + varredura de movimento; devolve (quadros[(t,jpg)], problemas[])"""
    from PIL import Image, ImageChops, ImageStat
    probs, quadros = [], []
    pg, erros = rd.abrir()
    try:
        if erros:
            return [], ["erro de JavaScript: " + " | ".join(erros[:4])]
        lay = []
        for t in instantes(dur):
            try:
                img, l = rd.quadro(pg, t)
            except Exception as e:
                return [], ["erro ao desenhar t=%.2fs: %s" % (t, str(e)[:300])]
            quadros.append((t, img))
            lay += ["t=%.1fs %s" % (t, x) for x in l]
        js = pg.evaluate("window.ERRS || []")
        if js:
            probs.append("erro de JavaScript: " + " | ".join(js[:4]))
        lay = list(dict.fromkeys(lay))
        if lay:
            probs.append("layout: " + " ; ".join(lay[:8]))
        ims = [Image.open(io.BytesIO(b)).convert("L").resize((240, int(240 * rd.H / rd.W))) for _, b in quadros]
        vazios = [t for (t, _), im in zip(quadros, ims) if ImageStat.Stat(im).stddev[0] < 7]
        if vazios:
            probs.append("quadro quase vazio/liso em " + ", ".join("%.1fs" % t for t in vazios))
        # varredura de movimento a cada 0,25 s
        amostras, t = [], 0.1
        while t < dur - 0.1:
            try:
                img, _ = rd.quadro(pg, round(t, 2), 60)
            except Exception as e:
                return [], ["erro ao desenhar t=%.2fs: %s" % (t, str(e)[:300])]
            amostras.append((t, Image.open(io.BytesIO(img)).convert("L").resize((160, int(160 * rd.H / rd.W)))))
            t += 0.25
        parado, ini = [], None
        for i in range(1, len(amostras)):
            d = ImageStat.Stat(ImageChops.difference(amostras[i][1], amostras[i - 1][1])).mean[0]
            if d < 0.35:
                ini = amostras[i - 1][0] if ini is None else ini
            else:
                if ini is not None and amostras[i - 1][0] - ini >= 1.0 and ini < dur * 0.70:
                    parado.append("%.1f-%.1fs" % (ini, amostras[i - 1][0]))
                ini = None
        if parado:
            probs.append("trechos sem nenhum movimento (antes do cartao final): " + ", ".join(parado))
    finally:
        pg.close()
    return quadros, probs


def folhas(quadros, W, H):
    """2 folhas 2x2 (cada quadro ~760 px de largura) com o tempo escrito"""
    from PIL import Image, ImageDraw
    out = []
    cw = 760 if W > H else 420
    ch = int(cw * H / W)
    for k in range(0, len(quadros), 4):
        grupo = quadros[k:k + 4]
        sh = Image.new("RGB", (cw * 2 + 6, ch * 2 + 6), (128, 128, 128))
        for i, (t, b) in enumerate(grupo):
            im = Image.open(io.BytesIO(b)).convert("RGB").resize((cw, ch))
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 92, 34], fill=(0, 0, 0))
            d.text((8, 8), "%.1fs" % t, fill=(255, 255, 0))
            sh.paste(im, ((i % 2) * (cw + 6), (i // 2) * (ch + 6)))
        bio = io.BytesIO()
        sh.save(bio, "JPEG", quality=86)
        out.append(bio.getvalue())
    return out


def exportar(rd, dur, saida):
    fd = rd.work / "export"
    fd.mkdir(exist_ok=True)
    pg, erros = rd.abrir()
    if erros:
        raise RuntimeError("cena com erro no export: " + " | ".join(erros[:3]))
    try:
        for i in range(int(round(dur * FPS))):
            img, _ = rd.quadro(pg, i / FPS, 94)
            (fd / ("f_%05d.jpg" % i)).write_bytes(img)
    finally:
        pg.close()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(fd / "f_%05d.jpg"),
                    "-vf", "fade=t=in:st=0:d=0.3,fade=t=out:st=%.2f:d=0.3" % (dur - 0.3),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(saida)], check=True)
    w, h, d = ffprobe(saida)
    if abs(d - dur) > 0.15 or (w, h) != (rd.W, rd.H):
        raise RuntimeError("export fora do padrao: %dx%d %.2fs" % (w, h, d))
    return saida


# ---------------------------------------------------------------- Opus
def b64img(blob, mt="image/jpeg"):
    return {"type": "image", "source": {"type": "base64", "media_type": mt, "data": base64.b64encode(blob).decode()}}


def miniatura(path, lado=900):
    from PIL import Image
    im = Image.open(path)
    im.thumbnail((lado, lado))
    bio = io.BytesIO()
    if im.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", im.size, (200, 200, 200))  # cinza: mostra o recorte da logo
        bg.paste(im.convert("RGBA"), mask=im.convert("RGBA").split()[3])
        im = bg
    im.convert("RGB").save(bio, "JPEG", quality=82)
    return bio.getvalue()


def tira_clipe(cdir, n):
    """6 quadros do clipe com o segundo escrito + brilho medio por segundo (acha trechos escuros/fades)"""
    from PIL import Image, ImageDraw, ImageStat
    idx = sorted(set(max(1, min(n, round(1 + k * (n - 1) / 5))) for k in range(6)))
    ims = []
    for i in idx:
        im = Image.open(cdir / ("%05d.jpg" % i)).convert("RGB")
        im.thumbnail((380, 380))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 64, 24], fill=(0, 0, 0))
        d.text((6, 6), "%.1fs" % ((i - 1) / FPS), fill=(255, 255, 0))
        ims.append(im)
    cols = 3
    w = max(i.size[0] for i in ims)
    h = max(i.size[1] for i in ims)
    s = Image.new("RGB", (cols * w + (cols - 1) * 6, 2 * h + 6), (90, 90, 90))
    for k, im in enumerate(ims):
        s.paste(im, ((k % cols) * (w + 6), (k // cols) * (h + 6)))
    bio = io.BytesIO()
    s.save(bio, "JPEG", quality=80)
    brilho = [round(ImageStat.Stat(Image.open(cdir / ("%05d.jpg" % min(n, 1 + int(sec * FPS)))).convert("L")).mean[0]) for sec in range(int(n / FPS) + 1)]
    return bio.getvalue(), brilho


class Diretor:
    def __init__(self):
        import anthropic
        self.cli = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"], max_retries=3, timeout=900)
        self.sys = (HERE / "diretor.md").read_text(encoding="utf-8")
        self.msgs = []
        self.uso = {"input": 0, "output": 0, "chamadas": 0}

    def perguntar(self, content, max_tokens=24000):
        self.msgs.append({"role": "user", "content": content})
        with self.cli.messages.stream(model=MODEL, max_tokens=max_tokens, system=self.sys, messages=self.msgs) as s:
            msg = s.get_final_message()
        txt = "".join(c.text for c in msg.content if getattr(c, "type", "") == "text")
        self.msgs.append({"role": "assistant", "content": txt.strip() or "(sem resposta)"})
        self.uso["input"] += msg.usage.input_tokens
        self.uso["output"] += msg.usage.output_tokens
        self.uso["chamadas"] += 1
        # quadros de rodadas anteriores saem do historico (o material da marca, na 1a mensagem, fica)
        for m in self.msgs[1:-2]:
            if m["role"] == "user" and isinstance(m["content"], list):
                m["content"] = [c for c in m["content"] if c.get("type") == "text"] or [{"type": "text", "text": "(quadros da rodada anterior)"}]
        return txt


def extrair_codigo(txt):
    blocos = re.findall(r"```([A-Za-z]*)[ \t]*\n([\s\S]*?)```", txt or "")
    cand = [c for lang, c in blocos if "renderAt" in c] or [c for lang, c in blocos if lang.lower() in ("js", "javascript")]
    code = max(cand, key=len).strip() if cand else ""
    con = re.search(r"CONCEITO:\s*(.+)", txt)
    return code, (con.group(1).strip()[:300] if con else "")


def extrair_veredito(txt):
    m = re.search(r"\{[\s\S]*?\"aprovado\"[\s\S]*?\}", txt)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


REVISAO = (
    "REVISAO DA RODADA {r}. Acima: os 8 quadros renderizados do SEU codigo (tempo no canto) e o relatorio automatico."
    "\nRELATORIO AUTOMATICO: {auto}"
    "\nSeja o diretor de arte mais exigente da agencia. Confira quadro a quadro: (1) parece feito a mao para ESTA marca (paleta, fontes, elementos da marca) ou parece template? "
    "(2) fotos/videos do cliente grandes e bonitos, sem texto em cima de rosto/produto; (3) leitura em 2 segundos a 1 metro: tamanho, contraste, poucas palavras; "
    "(4) logo nitida, sem deformar, presente no inicio e no final; (5) cartao final completo e parado tempo suficiente; (6) nada cortado, fora da area segura ou sobreposto; "
    "(7) composicao nativa do formato ({fmt}); (8) nada inventado e nada do que e PROIBIDO; (9) movimento continuo e transicoes ligando as cenas."
    "\nResponda PRIMEIRO com um JSON numa linha: {{\"nota\": 0-10, \"aprovado\": true|false, \"problemas\": [\"...\"]}}. "
    "Aprove (nota >= 8) somente se voce colocaria isso no ar hoje e o relatorio automatico nao tiver erro. "
    "Se NAO aprovar, depois do JSON escreva CONCEITO: e o codigo COMPLETO corrigido num unico bloco ```js (nao um trecho)."
)


# ---------------------------------------------------------------- Coverr (banco de videos)
def coverr_buscar(termos, vertical, quantos, destdir):
    key = os.environ.get("COVERR_API_KEY", "")
    if not key or not termos:
        return []
    achados, vistos = [], set()
    for termo in termos[:4]:
        try:
            u = "https://api.coverr.co/videos?" + urllib.parse.urlencode({"query": termo, "page_size": 12, "urls": "true"})
            r = urllib.request.Request(u, headers={"Authorization": "Bearer " + key, "User-Agent": UA})
            hits = json.loads(urllib.request.urlopen(r, timeout=30).read()).get("hits") or []
        except Exception as e:
            log("coverr busca falhou", termo, e)
            continue
        hits.sort(key=lambda h: (bool(h.get("is_vertical")) != vertical, -(h.get("max_width") or 0)))
        for h in hits:
            if h.get("id") in vistos or float(h.get("duration") or 0) < 4:
                continue
            mp4 = (h.get("urls") or {}).get("mp4")
            if not mp4:
                continue
            vistos.add(h["id"])
            dest = destdir / ("coverr_%s.mp4" % h["id"])
            try:
                baixar(mp4, dest, timeout=240)
                rq = urllib.request.Request("https://api.coverr.co/videos/%s/stats/downloads" % h["id"], method="PATCH", headers={"Authorization": "Bearer " + key})
                try:
                    urllib.request.urlopen(rq, timeout=20).read()
                except Exception:
                    pass
                achados.append({"path": dest, "id": h["id"], "titulo": h.get("title") or termo, "termo": termo})
            except Exception as e:
                log("coverr download falhou", h.get("id"), e)
            break
        if len(achados) >= quantos:
            break
    return achados


# ---------------------------------------------------------------- job real
def rodar_job():
    sb = SB()
    JOB = os.environ["JOB_ID"]
    token = os.environ.get("SOFIA_WEBHOOK_TOKEN", "")
    job = sb.req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=*")[0]
    b = dict(job.get("briefing") or {})
    sb.req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "rendering"})
    vertical = "vertical" in (job.get("formato") or "")
    W, H, DUR = (1080, 1920, 15) if vertical else (1920, 1080, 10)
    marca, arqs = {}, []
    if b.get("marca_id"):
        rows = sb.req("GET", f"/rest/v1/marcas_clientes?id=eq.{b['marca_id']}&select=*")
        marca = rows[0] if rows else {}
        arqs = sb.req("GET", f"/rest/v1/marca_arquivos?marca_id=eq.{b['marca_id']}&select=*&order=created_at.desc&limit=200") or []
    work = Path(f"/tmp/lucas_{JOB}")
    shutil.rmtree(work, ignore_errors=True)
    (work / "assets").mkdir(parents=True)
    A = work / "assets"
    assets = {"logo": None, "qr": None, "fotos": [], "clips": []}
    imgs_ref = []  # material mostrado ao diretor

    # logo
    logo_url = ((marca.get("logo") or {}).get("url")) or b.get("logo_url")
    if logo_url:
        try:
            raw = baixar(logo_url, A / "logo_raw")
            cab = open(raw, "rb").read(400).lstrip()
            if cab.startswith(b"%PDF"):  # logo vetorial em PDF -> PNG transparente em alta
                subprocess.run(["pdftocairo", "-png", "-transp", "-singlefile", "-r", "400", str(raw), str(A / "logo_pdf")], check=True)
                raw = A / "logo_pdf.png"
            elif cab.startswith((b"<svg", b"<?xml")) or b"<svg" in cab:
                subprocess.run(["rsvg-convert", "-w", "2400", "-a", "-o", str(A / "logo_svg.png"), str(raw)], check=True)
                raw = A / "logo_svg.png"
            if True:
                w, h = preparar_imagem(raw, A / "logo.png", 1600)
                assets["logo"] = {"src": "assets/logo.png", "w": w, "h": h}
                imgs_ref.append(("LOGO do cliente (fundo cinza so para voce ver o recorte)", miniatura(A / "logo.png", 700)))
        except Exception as e:
            log("logo falhou", e)
    # fotos (cliente primeiro), clipes do cliente
    fotos_urls = [a for a in arqs if a["tipo"] in ("foto", "print")] or [{"url": u, "legenda": ""} for u in (b.get("fotos_urls") or [])]
    videos_urls = [a for a in arqs if a["tipo"] == "video"] or ([{"url": b["midia_url"], "legenda": ""}] if b.get("midia_tipo") == "video" and b.get("midia_url") else [])
    escolhidas = b.get("arquivos_escolhidos") or []  # urls que o Lucas escolheu com o cliente
    if escolhidas:
        fotos_urls = [a for a in fotos_urls if a["url"] in escolhidas] or fotos_urls
        videos_urls = [a for a in videos_urls if a["url"] in escolhidas] or videos_urls
    for i, a in enumerate(fotos_urls[:8]):
        try:
            raw = baixar(a["url"], A / f"foto{i}_raw")
            w, h = preparar_imagem(raw, A / f"foto{i}.jpg")
            assets["fotos"].append({"src": f"assets/foto{i}.jpg", "w": w, "h": h, "legenda": a.get("legenda") or "", "origem": "cliente"})
            imgs_ref.append((f"FOTO {len(assets['fotos']) - 1} do cliente ({w}x{h}) {a.get('legenda') or ''}", miniatura(A / f"foto{i}.jpg")))
        except Exception as e:
            log("foto falhou", e)
    for i, a in enumerate(videos_urls[:4]):
        try:
            raw = baixar(a["url"], A / f"video{i}.mp4", timeout=300)
            c = preparar_clipe(raw, A / f"clip{len(assets['clips'])}", W, H)
            if c:
                k = len(assets["clips"])
                c.update({"dir": f"assets/clip{k}", "legenda": a.get("legenda") or "", "origem": "cliente"})
                assets["clips"].append(c)
                tira, brilho = tira_clipe(A / f"clip{k}", c["n"])
                imgs_ref.append((f"CLIPE {k} do cliente ({c['dur']}s; brilho medio 0-255 por segundo: {brilho}). Escolha o trecho bom pelo tempo local; evite trechos escuros, fades e legendas/marcas d'agua gravadas no video", tira))
        except Exception as e:
            log("video falhou", e)
    # banco de videos: so com autorizacao do cliente e pouco material proprio
    reais = len(assets["fotos"]) + len(assets["clips"])
    if marca.get("banco_autorizado") and (b.get("usar_banco") or reais < 3):
        termos = list(b.get("banco_termos") or marca.get("banco_termos") or [])
        for c in coverr_buscar(termos, vertical, 3 if reais == 0 else 2, A):
            cc = preparar_clipe(c["path"], A / f"clip{len(assets['clips'])}", W, H)
            if not cc:
                continue
            k = len(assets["clips"])
            cc.update({"dir": f"assets/clip{k}", "legenda": "banco: " + c["titulo"], "origem": "coverr"})
            assets["clips"].append(cc)
            tira, brilho = tira_clipe(A / f"clip{k}", cc["n"])
            imgs_ref.append((f"CLIPE {k} do BANCO Coverr ({c['titulo']}, {cc['dur']}s; brilho por segundo: {brilho}): use so como clima; descarte se mostrar algo PROIBIDO ou marca de terceiros", tira))
            try:
                pub = sb.upload("marcas", f"{marca['id']}/banco/coverr_{c['id']}.mp4", open(c["path"], "rb").read(), "video/mp4")
                sb.req("POST", "/rest/v1/marca_arquivos?on_conflict=marca_id,url", {"marca_id": marca["id"], "tipo": "banco", "url": pub, "origem": "coverr", "legenda": c["titulo"], "meta": {"coverr_id": c["id"], "termo": c["termo"], "job_id": JOB}}, headers={"Prefer": "resolution=ignore-duplicates"})
            except Exception as e:
                log("registro banco falhou", e)
    # pasta da marca: copia para marcas/{id}/... os arquivos que ainda estao so no bucket do WhatsApp
    if marca.get("id"):
        for a in arqs:
            if a.get("path") or a["tipo"] not in ("logo", "foto", "video", "print"):
                continue
            try:
                ext = (urllib.parse.urlparse(a["url"]).path.rsplit(".", 1)[-1] or "bin")[:5].lower()
                destino = f"{marca['id']}/{a['tipo']}s/{a['id']}.{ext}"
                tmp = baixar(a["url"], A / ("copia_" + a["id"]), timeout=300)
                ctype = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "webp": "image/webp", "mp4": "video/mp4", "svg": "image/svg+xml"}.get(ext, "application/octet-stream")
                sb.upload("marcas", destino, Path(tmp).read_bytes(), ctype)
                sb.req("PATCH", f"/rest/v1/marca_arquivos?id=eq.{a['id']}", {"path": destino})
                Path(tmp).unlink(missing_ok=True)
            except Exception as e:
                log("copia para a pasta falhou", a.get("id"), e)
    qrnum = marca.get("whatsapp_qr") or b.get("whatsapp_qr")
    if qrnum and b.get("usar_qr", True) and gerar_qr(qrnum, A / "qr.png"):
        assets["qr"] = {"src": "assets/qr.png"}
    # referencias: videos finais anteriores desta marca (consistencia de serie)
    refs = [a for a in arqs if a["tipo"] == "video_final" and (a.get("meta") or {}).get("folha_url") and (a.get("meta") or {}).get("job_id") != JOB][:2]
    for a in refs:
        try:
            p = baixar(a["meta"]["folha_url"], A / ("ref_" + a["id"] + ".jpg"))
            imgs_ref.append(("VIDEO ANTERIOR desta marca (%s, %s): mantenha a identidade da serie, mas NAO repita o conceito" % ((a.get("meta") or {}).get("formato", ""), (a.get("meta") or {}).get("conceito", "")[:80]), Path(p).read_bytes()))
        except Exception:
            pass

    fontes_css, fontes_ok = baixar_fontes(list(marca.get("fontes") or []) + FONTES_PADRAO, work / "fonts")
    conversa = ""
    if job.get("conversation_id"):
        try:
            ms = sb.req("GET", f"/rest/v1/sofia_messages?conversation_id=eq.{job['conversation_id']}&select=direction,body&order=id.desc&limit=30") or []
            conversa = "\n".join(("CLIENTE: " if m["direction"] == "in" else "EXA: ") + str(m.get("body") or "")[:350] for m in reversed(ms))
        except Exception:
            pass
    ficha = {
        "empresa": marca.get("empresa") or b.get("empresa"), "segmento": marca.get("segmento") or b.get("segmento"),
        "cores": marca.get("cores") or [], "fontes_da_marca": marca.get("fontes") or [], "tom_de_voz": marca.get("tom_de_voz"),
        "PROIBIDO": marca.get("proibido"), "slogan": marca.get("slogan"), "instagram": marca.get("instagram") or b.get("instagram"),
        "whatsapp": qrnum, "endereco": marca.get("endereco"), "site": marca.get("site"), "notas": marca.get("notas"),
        "estrategia_da_serie": marca.get("estrategia"),
    }
    pedido = {k: b.get(k) for k in ("video_n", "tema", "mensagem", "subtitulo", "cta", "frases", "numeros", "pedido_cliente", "observacoes", "cores_estilo") if b.get(k)}
    spec = {"W": W, "H": H, "DUR": DUR, "FPS": FPS, "assets": assets, "marca": {"cores": ficha["cores"], "fontes": ficha["fontes_da_marca"], "empresa": ficha["empresa"]}}

    intro = [{"type": "text", "text": (
        f"FORMATO: {'VERTICAL 1080x1920, 15 s' if vertical else 'HORIZONTAL 1920x1080, 10 s'}, sem som.\n"
        f"FICHA DA MARCA: {json.dumps(ficha, ensure_ascii=False)}\n"
        f"ESTE VIDEO: {json.dumps(pedido, ensure_ascii=False)}\n"
        f"FONTES DISPONIVEIS: {', '.join(fontes_ok)}\n"
        f"MATERIAL: logo={'sim' if assets['logo'] else 'NAO (use o nome da empresa em tipografia forte)'}, fotos={len(assets['fotos'])}, clipes={len(assets['clips'])}, qr={'sim' if assets['qr'] else 'nao'}.\n"
        f"CONVERSA COM O CLIENTE (contexto; o que ele pediu vale):\n{conversa[-6000:]}\n\nO material segue nas imagens.")}]
    for rot, blob in imgs_ref[:14]:
        intro += [{"type": "text", "text": rot}, b64img(blob)]
    intro.append({"type": "text", "text": "Escreva agora: CONCEITO e o bloco ```js completo."})

    versoes = dirigir(work, spec, fontes_css, intro, vertical)
    out = work / "final.mp4"
    resultado, falhas = None, []
    for v in versoes:  # a melhor versao; se quebrar em algum quadro do export, a proxima
        rd = Render(work, W, H)
        try:
            shutil.rmtree(work / "export", ignore_errors=True)
            montar_pagina(work, spec, fontes_css, v["codigo"])
            exportar(rd, DUR, out)
            resultado = v
            break
        except Exception as e:
            falhas.append(str(e)[:200])
            log("export falhou, tentando a proxima versao:", e)
        finally:
            rd.fechar()
    if not resultado:
        raise RuntimeError("export falhou em todas as versoes: " + " | ".join(falhas)[:400])

    blob = out.read_bytes()
    pub = sb.upload("sofia-videos", f"{JOB}.mp4", blob, "video/mp4")
    qa = []
    for i, f in enumerate([0.5, 1.3, 2.1, 2.9, 3.7, 4.5, 5.3, 6.1, 6.9, 7.7, 8.5, 9.4]):
        t = f * DUR / 10.0
        fp = work / f"qa_{i}.jpg"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", str(out), "-frames:v", "1", "-vf", "scale=800:-2", "-q:v", "4", str(fp)], check=True)
        qa.append({"t": round(t, 1), "url": sb.upload("sofia-videos", f"qa/{JOB}-{i}.jpg", fp.read_bytes(), "image/jpeg")})
    folha_url = None
    if marca.get("id"):
        try:
            sb.upload("marcas", f"{marca['id']}/finais/{JOB}.mp4", blob, "video/mp4")
            folha_url = sb.upload("marcas", f"{marca['id']}/finais/{JOB}.jpg", resultado["folhas"][0], "image/jpeg") if resultado["folhas"] else None
            sb.req("POST", "/rest/v1/marca_arquivos?on_conflict=marca_id,url", {"marca_id": marca["id"], "tipo": "video_final", "url": pub, "origem": "lucas",
                   "legenda": resultado["conceito"][:200], "meta": {"job_id": JOB, "formato": job.get("formato"), "nota": resultado["nota"], "conceito": resultado["conceito"], "folha_url": folha_url, "video_n": b.get("video_n")}},
                   headers={"Prefer": "resolution=ignore-duplicates"})
        except Exception as e:
            log("pasta da marca falhou", e)
    agora = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    try:
        fresco = sb.req("GET", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}&select=briefing,status")[0]
        if fresco.get("status") == "sent":
            log("job ja foi enviado ao cliente por outra execucao; nao sobrescrevo")
            return
        b = {**b, **(fresco.get("briefing") or {})}
    except Exception:
        pass
    b.update({"qa_frames": qa, "qa_ok_at": agora, "qa_nota": resultado["nota"], "lucas": {
        "conceito": resultado["conceito"], "rodadas": resultado["rodadas"], "historico": resultado["historico"], "uso_tokens": resultado["uso"],
        "modelo": MODEL, "folha_url": folha_url, "aprovado": resultado["aprovado"]}})
    sb.req("PATCH", f"/rest/v1/sofia_video_jobs?id=eq.{JOB}", {"status": "ready", "output_url": pub, "briefing": b})
    if token:
        try:
            r = urllib.request.Request(f"{sb.url}/functions/v1/sofia-agent?action=video&token={token}", data=json.dumps({"job_id": JOB}).encode(), method="POST",
                                       headers={"Content-Type": "application/json", "Authorization": "Bearer " + sb.key})
            urllib.request.urlopen(r, timeout=60).read()
        except Exception as e:
            log("aviso a Sofia falhou", e)
    log("OK", pub)


def dirigir(work, spec, fontes_css, intro, vertical):
    """gera a cena, renderiza quadros, o diretor revisa e corrige; devolve a melhor versao"""
    W, H, DUR = spec["W"], spec["H"], spec["DUR"]
    fmt = "vertical empilhado 1080x1920" if vertical else "horizontal 1920x1080"
    dr = Diretor()
    codigo, conceito = extrair_codigo(dr.perguntar(intro))
    historico, candidatos = [], []
    rd = Render(work, W, H)

    def testar(cod):
        montar_pagina(work, spec, fontes_css, cod)
        q, auto = validar(rd, DUR)
        return q, auto, (folhas(q, W, H) if q else [])

    try:
        pendente = True  # 'codigo' ainda nao foi revisado
        for r in range(1, ROUNDS + 1):
            if not codigo:
                codigo, conceito = extrair_codigo(dr.perguntar([{"type": "text", "text": "Nao encontrei o bloco ```js. Envie o codigo COMPLETO num unico bloco ```js."}]))
                continue
            quadros, auto, fl = testar(codigo)
            if not quadros:  # quebrou: pede correcao sem gastar revisao visual
                historico.append({"rodada": r, "nota": None, "aprovado": False, "problemas": auto[:4], "auto": auto[:4]})
                codigo, c2 = extrair_codigo(dr.perguntar([{"type": "text", "text": "O codigo quebrou: " + "; ".join(auto) + ". Envie CONCEITO e o codigo COMPLETO corrigido num bloco ```js."}]))
                conceito = c2 or conceito
                continue
            conteudo = []
            for i, f in enumerate(fl):
                conteudo += [{"type": "text", "text": "Quadros %d-%d:" % (i * 4 + 1, i * 4 + 4)}, b64img(f)]
            conteudo.append({"type": "text", "text": REVISAO.format(r=r, auto=("; ".join(auto) or "sem problemas detectados"), fmt=fmt)})
            txt = dr.perguntar(conteudo)
            v = extrair_veredito(txt) or {}
            try:
                nota = float(str(v.get("nota")).replace(",", "."))
            except Exception:
                nota = 0.0
            historico.append({"rodada": r, "nota": nota, "aprovado": bool(v.get("aprovado")), "problemas": (v.get("problemas") or [])[:8], "auto": auto[:6]})
            candidatos.append({"codigo": codigo, "conceito": conceito, "nota": nota, "folhas": fl, "auto": auto})
            log("rodada", r, "nota", nota, "auto", auto)
            pendente = False
            if v.get("aprovado") and nota >= 8 and not auto:
                break
            novo, c2 = extrair_codigo(txt)
            if not novo:
                break
            codigo, conceito, pendente = novo, (c2 or conceito), True
        if pendente and codigo:
            # a ultima correcao nao passou por revisao: entra se renderiza sem problema automatico
            quadros, auto, fl = testar(codigo)
            if quadros and not auto:
                base = max([c["nota"] for c in candidatos] or [0])
                candidatos.append({"codigo": codigo, "conceito": conceito, "nota": base + 0.5, "folhas": fl, "auto": auto, "sem_revisao": True})
    finally:
        rd.fechar()
    if not candidatos:
        raise RuntimeError("o diretor nao entregou nenhuma versao que renderiza: " + json.dumps(historico, ensure_ascii=False)[:400])
    ordem = sorted(candidatos, key=lambda c: (not c["auto"], c["nota"]), reverse=True)
    out = []
    for m in ordem:
        nota_real = None if m.get("sem_revisao") else m["nota"]
        out.append({"codigo": m["codigo"], "conceito": m["conceito"], "nota": nota_real, "folhas": m["folhas"],
                    "aprovado": bool(nota_real is not None and nota_real >= 8 and not m["auto"]),
                    "rodadas": len(historico), "historico": historico, "uso": dr.uso})
    return out


# ---------------------------------------------------------------- teste local
def local(spec_path, cena_path, saida):
    """renderiza uma cena escrita a mao com assets locais (sem banco e sem IA)"""
    cfg = json.loads(Path(spec_path).read_text())
    vertical = cfg.get("vertical", False)
    W, H, DUR = (1080, 1920, 15) if vertical else (1920, 1080, 10)
    work = Path(cfg.get("work") or "/tmp/lucas_local")
    shutil.rmtree(work, ignore_errors=True)
    A = work / "assets"
    A.mkdir(parents=True)
    assets = {"logo": None, "qr": None, "fotos": [], "clips": []}
    if cfg.get("logo"):
        w, h = preparar_imagem(cfg["logo"], A / "logo.png", 1600)
        assets["logo"] = {"src": "assets/logo.png", "w": w, "h": h}
    for i, f in enumerate(cfg.get("fotos", [])):
        w, h = preparar_imagem(f, A / f"foto{i}.jpg")
        assets["fotos"].append({"src": f"assets/foto{i}.jpg", "w": w, "h": h, "legenda": "", "origem": "cliente"})
    for f in cfg.get("videos", []):
        k = len(assets["clips"])
        c = preparar_clipe(Path(f), A / f"clip{k}", W, H)
        if c:
            c.update({"dir": f"assets/clip{k}", "legenda": "", "origem": "cliente"})
            assets["clips"].append(c)
    if cfg.get("whatsapp") and gerar_qr(cfg["whatsapp"], A / "qr.png"):
        assets["qr"] = {"src": "assets/qr.png"}
    fontes_css, ok = baixar_fontes(cfg.get("fontes", []) + ["Inter"], work / "fonts")
    log("fontes", ok)
    spec = {"W": W, "H": H, "DUR": DUR, "FPS": FPS, "assets": assets, "marca": {"cores": cfg.get("cores", []), "fontes": cfg.get("fontes", []), "empresa": cfg.get("empresa", "")}}
    montar_pagina(work, spec, fontes_css, Path(cena_path).read_text())
    rd = Render(work, W, H)
    try:
        quadros, auto = validar(rd, DUR)
        log("validacao:", auto or "ok")
        for i, f in enumerate(folhas(quadros, W, H)):
            Path(str(saida) + f".folha{i}.jpg").write_bytes(f)
        t0 = time.time()
        exportar(rd, DUR, Path(saida))
        log("export %.1fs" % (time.time() - t0), ffprobe(saida))
    finally:
        rd.fechar()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--local":
        local(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        rodar_job()
