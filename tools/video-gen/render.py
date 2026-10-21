#!/usr/bin/env python3
"""EXA Motion Studio v4 - renderizador. Uso: render.py job.json out.mp4 [--frames t1 t2 ...]
job.json: {formato, briefing:{empresa, segmento, mensagem, subtitulo, cta, whatsapp_qr, instagram, cores_estilo, logo_url?, midia_url?, midia_tipo?}}"""
import re, sys, json, urllib.parse, pathlib, subprocess, shutil, tempfile, urllib.request
import segno
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent.resolve()
job = json.load(open(sys.argv[1])); out = pathlib.Path(sys.argv[2])
frames_only = [float(x) for x in sys.argv[4:]] if len(sys.argv) > 3 and sys.argv[3] == '--frames' else None
VALIDATE = len(sys.argv) > 3 and sys.argv[3] == '--validate'
b = job.get('briefing', {}); fmt = job.get('formato', 'horizontal_10s')
vert = fmt == 'vertical_premium_15s'; FPS = 30; DUR = 15 if vert else 10
W, H = (1080, 1920) if vert else (1920, 1080)
tmp = pathlib.Path(tempfile.mkdtemp(prefix='exa_motion_'))
assets = {}
exa = here / 'exa-logo-branca.png'
if not exa.exists():
    try: urllib.request.urlretrieve('https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png', exa)
    except Exception: pass
if exa.exists(): shutil.copy(exa, tmp / 'exa.png'); assets['exa'] = 'exa.png'
def fetch(url, stem):
    ext = url.split('?')[0].rsplit('.', 1)[-1].lower()
    if ext not in ('png', 'jpg', 'jpeg', 'webp', 'gif', 'mp4', 'mov', 'webm'): ext = 'png'
    req = urllib.request.Request(url, headers={'User-Agent': 'exa-motion'})
    with urllib.request.urlopen(req, timeout=60) as r, open(tmp / (stem + '.' + ext), 'wb') as f: shutil.copyfileobj(r, f)
    return stem + '.' + ext
lu = b.get('logo_url')
if lu:
    try: assets['logo'] = fetch(lu, 'logo')
    except Exception as e: print('logo falhou', e)
media = None
mu = b.get('midia_url')
if mu and not frames_only or (mu and frames_only):
    try:
        media = fetch(mu, 'media'); print('midia ok', media)
    except Exception as e: print('midia falhou', e)
wa = ''.join(ch for ch in str(b.get('whatsapp_qr', '')) if ch.isdigit())
qr = None; whats = ''
if wa:
    if len(wa) <= 11: wa = '55' + wa
    q = segno.make('https://wa.me/%s?text=%s' % (wa, urllib.parse.quote(b.get('qr_texto', 'Oi! Vi o video de voces no elevador'))), error='m', micro=False)
    qr = [[1 if c else 0 for c in row] for row in q.matrix]
    d = wa[2:] if wa.startswith('55') else wa
    whats = '(%s) %s-%s' % (d[:2], d[2:-4], d[-4:]) if len(d) >= 10 else d
P = {'empresa': b.get('empresa', 'SUA MARCA'), 'segmento': b.get('segmento', ''), 'cores_estilo': b.get('cores_estilo', ''), 'mensagem': b.get('mensagem', 'ANUNCIE AQUI'), 'subtitulo': b.get('subtitulo', ''),
     'cta': b.get('cta') or ('PECA AGORA' if qr else 'CONHECA'), 'instagram': re.sub(r'[^A-Za-z0-9_.]', '', str(b.get('instagram', ''))), 'formato': fmt, 'qr': qr, 'whats': whats, 'assets': assets, 'media': bool(media), 'pedido': b.get('pedido_cliente', '') + ' ' + b.get('observacoes', ''), 'tema': b.get('tema'), 'elementos': b.get('elementos') or [], 'elementos_txt': b.get('estilo_extra', '')}
def hue_from_text(s):
    s = (s or '').lower()
    for pat, h in [(r'vermelh|red', 4), (r'laranja|orange', 24), (r'amarel|dourad|ouro|gold|yellow', 46), (r'verde|green', 130), (r'turquesa|ciano', 175), (r'azul|blue', 215), (r'roxo|violeta|purple|lilas', 275), (r'rosa|pink|magenta', 325)]:
        if re.search(pat, s): return h
    return None
def pick_hue(s):
    s = s.lower()
    for pat, h in [(r'pizza|burger|lanche|restaur|churras|padaria|doce|sorvet|cafe|bar\b|food|massa', 18), (r'clinic|odonto|saude|farm|medic|dent|fisio', 172), (r'academ|fit|crossfit|esporte', 130), (r'imobil|advog|contab|consult|seguro|banco|finan', 215), (r'beleza|salao|estetic|barbear|spa|nail', 325), (r'pet|vet|racao|tosa|agro|jardim', 28), (r'carro|auto|moto|oficina|pneu', 4)]:
        if re.search(pat, s): return h
    return None
hh = b.get('hue') if b.get('hue') is not None else hue_from_text(b.get('cores_estilo')) if hue_from_text(b.get('cores_estilo')) is not None else pick_hue(P['empresa'] + ' ' + P['mensagem'] + ' ' + b.get('segmento', ''))
if hh is not None: P['hue'] = hh
SCENE = (b.get('scene_code') or '').strip()
shutil.copy(here / ('gen_harness.html' if SCENE else 'template4.html'), tmp / 'index.html')
with sync_playwright() as p:
    br = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = br.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: print('PAGEERR', e))
    perr = []
    pg.on('pageerror', lambda e: perr.append(str(e)))
    if SCENE: pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file://') else r.abort())
    pg.add_init_script('window.P = %s;' % json.dumps(P))
    if SCENE: pg.add_init_script('window.SCENE_CODE = %s;' % json.dumps(SCENE))
    pg.goto('file://%s/index.html' % tmp); pg.evaluate('window.ready()')
    if VALIDATE:
        import io, time
        from PIL import Image, ImageChops, ImageStat
        res = {'ok': True, 'problemas': []}; ims = []; t0 = time.time()
        ts = [0.5, 1.5, 3, 4.5, 6, 7.5, 9, DUR - 0.4]
        for t in ts:
            pg.evaluate('render(%f)' % t)
            ims.append(Image.open(io.BytesIO(pg.locator('canvas').screenshot(omit_background=bool(media)))).convert('RGBA'))
        per = (time.time() - t0) / len(ts)
        errs = pg.evaluate('window.ERRS || []') + perr
        if errs: res['ok'] = False; res['problemas'].append('erros JS: ' + ' | '.join(errs[:4]))
        bl = 0
        for im in ims:
            st = ImageStat.Stat(im.convert('L')); a = im.split()[3]
            if (not media and st.stddev[0] < 6) or (media and ImageStat.Stat(a).mean[0] < 4): bl += 1
        if bl >= 3: res['ok'] = False; res['problemas'].append('quadros em branco/vazios (%d de %d)' % (bl, len(ts)))
        diffs = [ImageStat.Stat(ImageChops.difference(ims[i].convert('RGB'), ims[i + 1].convert('RGB')).convert('L')).mean[0] for i in range(len(ims) - 1)]
        if sum(diffs) / len(diffs) < 1.5: res['ok'] = False; res['problemas'].append('quase sem animacao entre quadros (dif media %.1f)' % (sum(diffs) / len(diffs)))
        if per > 1.2: res['ok'] = False; res['problemas'].append('muito pesado: %.2fs por quadro; simplifique (menos particulas/blur/shadowBlur)' % per)
        res['seg_por_quadro'] = round(per, 2); print('VALIDATE ' + json.dumps(res)); br.close(); shutil.rmtree(tmp, ignore_errors=True); sys.exit(0)
    times = frames_only if frames_only else [i / FPS for i in range(DUR * FPS)]
    fd = tmp / 'f'; fd.mkdir()
    for i, t in enumerate(times):
        pg.evaluate('render(%f)' % t)
        pg.locator('canvas').screenshot(path=str(fd / ('f_%05d.png' % i)), omit_background=bool(media))
    br.close()
if frames_only:
    out.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(times): shutil.copy(fd / ('f_%05d.png' % i), out / ('t_%05.2f.png' % t))
else:
    out.parent.mkdir(parents=True, exist_ok=True)
    fade = 'fade=t=in:st=0:d=0.35,fade=t=out:st=%.2f:d=0.3' % (DUR - 0.3)
    if media:
        is_vid = media.rsplit('.', 1)[-1] in ('mp4', 'mov', 'webm')
        pre = ['-stream_loop', '-1', '-i', str(tmp / media)] if is_vid else ['-loop', '1', '-framerate', str(FPS), '-i', str(tmp / media)]
        zoom = '' if is_vid else ',zoompan=z=\'min(1+0.0012*on,1.18)\':d=1:s=%dx%d:fps=%d' % (W, H, FPS)
        bgf = '[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d%s,fps=%d,eq=brightness=-0.06:saturation=1.08,format=yuv420p[bg]' % (W * (1 if is_vid else 2), H * (1 if is_vid else 2), W * (1 if is_vid else 2), H * (1 if is_vid else 2), zoom, FPS)
        if not is_vid: bgf = bgf.replace('crop=%d:%d' % (W * 2, H * 2), 'crop=%d:%d' % (W * 2, H * 2))
        fc = bgf + ';[bg][1:v]overlay=format=auto,' + fade + ',format=yuv420p[v]'
        cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + pre + ['-framerate', str(FPS), '-i', str(fd / 'f_%05d.png'), '-filter_complex', fc, '-map', '[v]', '-t', str(DUR), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)]
    else:
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(fd / 'f_%05d.png'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)]
    subprocess.run(cmd, check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('OK', out)
