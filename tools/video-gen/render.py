#!/usr/bin/env python3
"""EXA Motion v8 - renderizador.
Uso: render.py job.json out.mp4 [--frames t1 t2 ... | --validate]
Dois formatos nativos: horizontal_10s = 1920x1080 / 10 s; vertical_premium_15s = 1080x1920 / 15 s.
A cena (briefing.scene_js) usa a biblioteca K (lib.js). Sem scene_js, roda K.auto() (cena automatica de reserva).
O video/foto do cliente entra DENTRO da composicao (K.media): os quadros do video sao extraidos aqui e trocados
a cada quadro, entao a cena controla moldura, posicao e camadas (nada de video de fundo com texto ilegivel)."""
import re, sys, json, urllib.parse, pathlib, subprocess, shutil, tempfile, urllib.request, glob, io, time, hashlib
import segno
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent.resolve()
job = json.load(open(sys.argv[1])); out = pathlib.Path(sys.argv[2])
frames_only = [float(x) for x in sys.argv[4:]] if len(sys.argv) > 3 and sys.argv[3] == '--frames' else None
VALIDATE = len(sys.argv) > 3 and sys.argv[3] == '--validate'
b = job.get('briefing', {}) or {}
fmt = job.get('formato') or 'horizontal_10s'
if 'vertical' in fmt: fmt = 'vertical_premium_15s'
else: fmt = 'horizontal_10s'
vert = fmt == 'vertical_premium_15s'; FPS = 30; DUR = 15 if vert else 10
W, H = (1080, 1920) if vert else (1920, 1080)
tmp = pathlib.Path(tempfile.mkdtemp(prefix='exa_motion8_'))
for f in ('gsap.min.js', 'lib.js'): shutil.copy(here / f, tmp / f)
shutil.copytree(here / 'fonts', tmp / 'fonts')
assets = {}
exa = here / 'exa-logo-branca.png'
if not exa.exists():
    try: urllib.request.urlretrieve('https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png', exa)
    except Exception as e: print('logo EXA indisponivel', e)
if exa.exists(): shutil.copy(exa, tmp / 'exa.png'); assets['exa'] = 'exa.png'

def fetch(url, stem):
    ext = url.split('?')[0].rsplit('.', 1)[-1].lower()
    if ext not in ('png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'mov', 'webm', 'm4v', '3gp'): ext = 'bin'
    rq = urllib.request.Request(url, headers={'User-Agent': 'exa-motion'})
    with urllib.request.urlopen(rq, timeout=90) as r, open(tmp / (stem + '.' + ext), 'wb') as f: shutil.copyfileobj(r, f)
    return stem + '.' + ext

lu = b.get('logo_url')
if lu:
    try: assets['logo'] = fetch(lu, 'logo')
    except Exception as e: print('logo falhou', e)

def probe(path):
    """largura/altura EXIBIDAS (considera rotacao de celular) e se e video"""
    try:
        o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,codec_type:stream_tags=rotate:stream_side_data=rotation:format=duration', '-of', 'json', path], capture_output=True, text=True).stdout
        j = json.loads(o); s = j['streams'][0]; w, h = int(s['width']), int(s['height']); rot = 0
        try: rot = int(float((s.get('tags') or {}).get('rotate', 0)))
        except Exception: pass
        for sd in s.get('side_data_list') or []:
            if 'rotation' in sd: rot = int(float(sd['rotation']))
        if abs(rot) % 180 == 90: w, h = h, w
        dur = float((j.get('format') or {}).get('duration') or 0)
        return w, h, dur > 0.5
    except Exception:
        from PIL import Image, ImageOps
        im = ImageOps.exif_transpose(Image.open(path)); return im.size[0], im.size[1], False

media = None; MEDIA = {}
mu = b.get('midia_url')
if mu:
    try:
        media = fetch(mu, 'media'); mw, mh, is_vid = probe(str(tmp / media)); print('midia', media, mw, mh, 'video' if is_vid else 'imagem')
        if is_vid:
            (tmp / 'mf').mkdir()
            big = 'if(gt(iw,ih),min(1400,iw),-2)', 'if(gt(iw,ih),-2,min(1400,ih))'
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(tmp / media), '-t', str(DUR), '-vf', "fps=%d,scale='%s':'%s'" % (FPS, big[0], big[1]), '-q:v', '3', str(tmp / 'mf' / 'm_%05d.jpg')], check=True)
            n = len(glob.glob(str(tmp / 'mf' / 'm_*.jpg')))
            if n: MEDIA = {'mediaSrc': 'mf/m_%05d.jpg', 'mediaN': n, 'mediaAR': mw / mh if mh else 1}
        else:
            from PIL import Image, ImageOps
            im = ImageOps.exif_transpose(Image.open(tmp / media)).convert('RGB'); im.thumbnail((1600, 1600)); im.save(tmp / 'mfoto.jpg', quality=90)
            MEDIA = {'mediaSrc': 'mfoto.jpg', 'mediaN': 0, 'mediaAR': im.size[0] / im.size[1]}
    except Exception as e:
        print('midia falhou', e); MEDIA = {}

wa = ''.join(ch for ch in str(b.get('whatsapp_qr', '')) if ch.isdigit())
qr = None; whats = ''
if wa:
    if len(wa) <= 11: wa = '55' + wa
    q = segno.make('https://wa.me/%s?text=%s' % (wa, urllib.parse.quote(b.get('qr_texto', 'Oi! Vi o video de voces no elevador'))), error='m', micro=False)
    qr = [[1 if c else 0 for c in row] for row in q.matrix]
    d = wa[2:] if wa.startswith('55') else wa
    whats = '(%s) %s-%s' % (d[:2], d[2:-4], d[-4:]) if len(d) >= 10 else d

def hex2hsl(h):
    import colorsys
    h = h.lstrip('#'); r, g, bb = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]; hh, l, ss = colorsys.rgb_to_hls(r, g, bb); return hh * 360, ss, l
def hsl2hex(h, s, l):
    import colorsys
    r, g, bb = colorsys.hls_to_rgb((h % 360) / 360, l, s); return '#%02x%02x%02x' % (int(r * 255), int(g * 255), int(bb * 255))
def hue_from_text(s):
    s = (s or '').lower()
    for pat, h in [(r'vermelh|red', 4), (r'laranja|orange', 24), (r'amarel|dourad|ouro|gold|yellow', 46), (r'verde|green', 130), (r'turquesa|ciano', 175), (r'azul|blue', 215), (r'roxo|violeta|purple|lilas', 275), (r'rosa|pink|magenta', 325)]:
        if re.search(pat, s): return h
    return None
def pick_hue(s):
    s = s.lower()
    for pat, h in [(r'pizza|burger|lanche|restaur|churras|padaria|doce|sorvet|cafe|food|massa', 18), (r'clinic|odonto|saude|farm|medic|dent|fisio', 172), (r'academ|fit|crossfit|esporte|bike|bicicl', 130), (r'imobil|advog|contab|consult|seguro|banco|finan', 215), (r'beleza|salao|estetic|barbear|spa|nail', 325), (r'pet|vet|racao|tosa|agro|jardim', 28), (r'carro|auto|moto|oficina|pneu', 4)]:
        if re.search(pat, s): return h
    return None
def logo_palette(path):
    try:
        from PIL import Image
        from collections import Counter
        im = Image.open(path).convert('RGBA'); im.thumbnail((120, 120)); px = [p for p in im.getdata() if p[3] > 200]
        qq = Counter((p[0] // 32 * 32 + 16, p[1] // 32 * 32 + 16, p[2] // 32 * 32 + 16) for p in px); cand = []
        for (r, g, bb), n in qq.most_common(40):
            h, s, l = hex2hsl('#%02x%02x%02x' % (r, g, bb))
            if s > .35 and .22 < l < .75: cand.append((n * (1 + s), h))
        cand.sort(reverse=True); outl = []
        for _, h in cand:
            if all(min(abs(h - x), 360 - abs(h - x)) > 35 for x in outl): outl.append(h)
        return outl[:2]
    except Exception as e:
        print('paleta falhou', e); return []

P = {'empresa': b.get('empresa') or 'Sua Marca', 'segmento': b.get('segmento') or '', 'mensagem': b.get('mensagem') or 'Sua marca no elevador', 'subtitulo': b.get('subtitulo') or '',
     'cta': b.get('cta') or ('Chame no WhatsApp' if qr else 'Conheca'), 'instagram': re.sub(r'[^A-Za-z0-9_.]', '', str(b.get('instagram') or '')), 'formato': fmt, 'qr': qr, 'whats': whats,
     'assets': assets, 'media': bool(MEDIA), 'pedido': (b.get('pedido_cliente') or '') + ' ' + (b.get('observacoes') or ''), 'tema': b.get('tema'), 'elementos': b.get('elementos') or [],
     'frases': [x for x in (b.get('frases') or []) if x][:6], 'numeros': b.get('numeros') or []}
P.update(MEDIA)
hl = logo_palette(tmp / assets['logo']) if 'logo' in assets else []
m = re.search(r'#([0-9a-fA-F]{6})', b.get('cores_estilo') or '')
th = hue_from_text(b.get('cores_estilo'))
if m: P['cor'] = '#' + m.group(1); h0 = hex2hsl(P['cor'])[0]
elif th is not None: h0 = th; P['cor'] = hsl2hex(h0, .85, .52)
elif hl: h0 = hl[0]; P['cor'] = hsl2hex(h0, .85, .52)
else:
    h0 = b.get('hue') if b.get('hue') is not None else pick_hue(P['empresa'] + ' ' + P['mensagem'] + ' ' + P['segmento'])
    if h0 is None: h0 = 4
    P['cor'] = hsl2hex(h0, .85, .52)
P['cor2'] = hsl2hex(hl[1], .9, .58) if len(hl) > 1 else hsl2hex(h0 + 35, .9, .6)

SCENE_JS = (b.get('scene_js') or '').strip() or 'K.auto();'
safe = SCENE_JS.replace('</script', '<\\/script')
(tmp / 'index.html').write_text('<!doctype html><html><head><meta charset="utf-8"></head><body><script>window.ERRS=[];</script><script src="gsap.min.js"></script><script src="lib.js"></script>'
                                '<script>window.__scene=function(){\n' + safe + '\n};window.__run();</script></body></html>', encoding='utf-8')

TS_CHECK = [round(x * DUR / 10, 2) for x in (0.6, 1.6, 2.6, 3.6, 4.6, 5.6, 6.6, 7.6, 8.6, 9.6)]
# trecho quase vazio: menos de COV_MIN da tela com conteudo por COV_RUN segundos ou mais (amostra a cada COV_STEP s)
COV_STEP, COV_MIN, COV_RUN = 0.2, 0.06, 0.6
def empty_runs(cov):
    """cov = [(t, fracao)]; devolve trechos quase vazios [{inicio_s, fim_s, dur_s, cobertura_min}]"""
    out = []; start = None; low = 1.0
    for t, c in cov + [(DUR + 1, 1.0)]:
        if c < COV_MIN and t < DUR - 0.25:
            if start is None: start, low = t, c
            low = min(low, c)
        elif start is not None:
            end = min(t, DUR)
            if end - start >= COV_RUN - 1e-6: out.append({'inicio_s': round(start, 1), 'fim_s': round(end, 1), 'dur_s': round(end - start, 1), 'cobertura_min': round(100 * low, 1)})
            start = None
    return out
with sync_playwright() as p:
    br = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = br.new_page(viewport={'width': W, 'height': H})
    perr = []
    pg.on('pageerror', lambda e: (perr.append(str(e)), print('PAGEERR', e)))
    pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file://') else r.abort())
    pg.add_init_script('window.P = %s; window.__RENDER = true;' % json.dumps(P))
    pg.goto('file://%s/index.html' % tmp)
    try:
        pg.wait_for_function('window.__fonts === true', timeout=15000)
        pg.wait_for_function('window.tl && window.tl.duration() > 1', timeout=15000)
    except Exception:
        er = (pg.evaluate('window.ERRS || []') + perr) or ['timeline nao criada (faltou K.init/K.finish?)']
        if VALIDATE: print('VALIDATE ' + json.dumps({'ok': False, 'problemas': ['erros JS: ' + ' | '.join(er[:4])]})); sys.exit(0)
        raise SystemExit('cena falhou: ' + ' | '.join(er[:4]))
    pg.wait_for_timeout(200)

    def seek(t):
        pg.evaluate('''async (t)=>{window.tl.pause();window.tl.time(t,false);window.__mediaTick&&window.__mediaTick(t);
          const ims=[...document.querySelectorAll('img')];await Promise.all(ims.map(i=>i.decode?i.decode().catch(()=>{}):0));}''', t)
    def shot(t):
        seek(t); return pg.screenshot(type='jpeg', quality=93)

    # checagem de layout (texto cortado, fora da tela, sobreposto) em 10 instantes
    lay = []
    for t in TS_CHECK:
        seek(t)
        for x in pg.evaluate('window.__checkLayout ? window.__checkLayout() : []'):
            lay.append('t=%.1fs %s' % (t, x))
    lay = list(dict.fromkeys(lay))[:8]
    # cobertura de conteudo ao longo do video (pega buracos que a amostra de 10 quadros nao ve)
    cov = []
    for i in range(int(DUR / COV_STEP)):
        t = round(0.3 + i * COV_STEP, 2)
        if t >= DUR: break
        seek(t); cov.append((t, pg.evaluate('window.__coverage ? window.__coverage() : 1')))
    vazios = empty_runs(cov)
    ignored = bool(P['media']) and pg.evaluate('!!window.__mediaIgnored')

    if VALIDATE:
        from PIL import Image, ImageChops, ImageStat
        res = {'ok': True, 'problemas': []}; ims = []; t0 = time.time()
        for t in TS_CHECK: ims.append(Image.open(io.BytesIO(shot(t))).convert('RGB'))
        per = (time.time() - t0) / len(TS_CHECK)
        errs = pg.evaluate('window.ERRS || []') + perr
        dur_tl = pg.evaluate('window.tl.duration()')
        if dur_tl < DUR - 0.6: errs.append('timeline curta (%.1fs de %ds): planeje cenas ate K.DUR' % (dur_tl, DUR))
        if errs: res['ok'] = False; res['problemas'].append('erros JS: ' + ' | '.join(errs[:4]))
        if lay: res['ok'] = False; res['problemas'].append('layout: ' + ' ; '.join(lay))
        for v in vazios:
            res['ok'] = False; res['problemas'].append('trecho quase vazio de %.1fs a %.1fs (so %.1f%% da tela com conteudo): mantenha um elemento em cena ou comece a cena seguinte antes' % (v['inicio_s'], v['fim_s'], v['cobertura_min']))
        if ignored: res['ok'] = False; res['problemas'].append('o video/foto do cliente nao foi usado: chame K.media(tl, at, {parent, rect}) em pelo menos uma cena')
        bl = sum(1 for im in ims if ImageStat.Stat(im.convert('L')).stddev[0] < 6)
        if bl >= 3: res['ok'] = False; res['problemas'].append('quadros vazios (%d de %d)' % (bl, len(ims)))
        diffs = [ImageStat.Stat(ImageChops.difference(ims[i], ims[i + 1]).convert('L')).mean[0] for i in range(len(ims) - 1)]
        if sum(diffs) / len(diffs) < 1.5: res['ok'] = False; res['problemas'].append('quase sem animacao entre quadros')
        if per > 1.5: res['ok'] = False; res['problemas'].append('muito pesado: %.2fs por quadro; simplifique' % per)
        res['seg_por_quadro'] = round(per, 2); res['cobertura_media'] = round(100 * sum(c for _, c in cov) / max(1, len(cov)), 1); print('VALIDATE ' + json.dumps(res, ensure_ascii=False)); br.close(); shutil.rmtree(tmp, ignore_errors=True); sys.exit(0)

    times = frames_only if frames_only else [i / FPS for i in range(DUR * FPS)]
    fd = tmp / 'f'; fd.mkdir(); hashes = []
    for i, t in enumerate(times):
        png = shot(t); open(str(fd / ('f_%05d.jpg' % i)), 'wb').write(png); hashes.append(hashlib.md5(png).hexdigest())
    br.close()

runs = []; cur = 1
for i in range(1, len(hashes)):
    if hashes[i] == hashes[i - 1]: cur += 1
    else:
        if cur >= int(FPS * .5): runs.append({'inicio_s': round((i - cur) / FPS, 2), 'dur_s': round(cur / FPS, 2)})
        cur = 1
uniq = len(set(hashes))
print('FRAMEREPORT ' + json.dumps({'fps': FPS, 'formato': fmt, 'resolucao': '%dx%d' % (W, H), 'quadros': len(hashes), 'unicos': uniq, 'pct_unicos': round(100.0 * uniq / max(1, len(hashes)), 1),
                                   'paradas_longas': runs, 'trechos_vazios': vazios, 'cobertura_media': round(100 * sum(c for _, c in cov) / max(1, len(cov)), 1), 'layout': lay, 'midia_ignorada': ignored, 'tem_midia': bool(P['media']), 'motor': 'v8'}, ensure_ascii=False))
if frames_only:
    out.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(times): shutil.copy(fd / ('f_%05d.jpg' % i), out / ('t_%05.2f.jpg' % t))
else:
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(fd / 'f_%05d.jpg'), '-vf', 'fade=t=in:st=0:d=0.3,fade=t=out:st=%.2f:d=0.3' % (DUR - 0.3),
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)]
    subprocess.run(cmd, check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('OK', out)
