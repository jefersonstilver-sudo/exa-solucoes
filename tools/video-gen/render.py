#!/usr/bin/env python3
"""EXA Motion Studio - renderizador. Uso: render.py job.json out.mp4 [--frames t1 t2 ...]
job.json: {formato, briefing:{empresa, mensagem, subtitulo, cta, whatsapp_qr, hue?, logo_url?}}"""
import sys, json, urllib.parse, pathlib, subprocess, shutil, tempfile, urllib.request
import segno
from playwright.sync_api import sync_playwright

here = pathlib.Path(__file__).parent.resolve()
job = json.load(open(sys.argv[1])); out = pathlib.Path(sys.argv[2])
frames_only = [float(x) for x in sys.argv[4:]] if len(sys.argv) > 3 and sys.argv[3] == '--frames' else None
b = job.get('briefing', {}); fmt = job.get('formato', 'horizontal_10s')
vert = fmt == 'vertical_premium_15s'; FPS = 30; DUR = 15 if vert else 10
tmp = pathlib.Path(tempfile.mkdtemp(prefix='exa_motion_'))
assets = {}
exa = here / 'exa-logo-branca.png'
if not exa.exists():
    try: urllib.request.urlretrieve('https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-logo.png', exa)
    except Exception: pass
if exa.exists(): shutil.copy(exa, tmp / 'exa.png'); assets['exa'] = 'exa.png'
wa = ''.join(ch for ch in str(b.get('whatsapp_qr', '')) if ch.isdigit())
qr = None; whats = ''
if wa:
    if len(wa) <= 11: wa = '55' + wa
    q = segno.make('https://wa.me/%s?text=%s' % (wa, urllib.parse.quote(b.get('qr_texto', 'Oi! Vi o video de voces no elevador'))) , error='m', micro=False)
    qr = [[1 if c else 0 for c in row] for row in q.matrix]
    d = wa[2:] if wa.startswith('55') else wa
    whats = '(%s) %s-%s' % (d[:2], d[2:-4], d[-4:]) if len(d) >= 10 else d
P = {'empresa': b.get('empresa', 'SUA MARCA'), 'mensagem': b.get('mensagem', 'ANUNCIE AQUI'), 'subtitulo': b.get('subtitulo', ''),
     'cta': b.get('cta') or ('PECA AGORA' if qr else 'CONHECA'), 'formato': fmt, 'qr': qr, 'whats': whats, 'assets': assets}
import re
def pick_hue(s):
    s = s.lower()
    for pat, h in [(r'pizza|burger|lanche|restaur|churras|padaria|doce|sorvet|cafe|bar\b|food|massa', 18), (r'clinic|odonto|saude|farm|medic|dent|fisio', 172), (r'academ|fit|crossfit|esporte', 130), (r'imobil|advog|contab|consult|seguro|banco|finan', 215), (r'beleza|salao|estetic|barbear|spa|nail', 325), (r'pet|vet|agro|jardim|verde', 95), (r'carro|auto|moto|oficina|pneu', 4)]:
        if re.search(pat, s): return h
    return None
hh = b.get('hue') if b.get('hue') is not None else pick_hue(P['empresa'] + ' ' + P['mensagem'] + ' ' + b.get('segmento', ''))
if hh is not None: P['hue'] = hh
shutil.copy(here / 'template.html', tmp / 'index.html')
with sync_playwright() as p:
    br = p.chromium.launch(args=['--allow-file-access-from-files'])
    W, H = (1080, 1920) if vert else (1920, 1080)
    pg = br.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: print('PAGEERR', e))
    pg.add_init_script('window.P = %s;' % json.dumps(P))
    pg.goto('file://%s/index.html' % tmp); pg.evaluate('window.ready()')
    times = frames_only if frames_only else [i / FPS for i in range(DUR * FPS)]
    fd = tmp / 'f'; fd.mkdir()
    for i, t in enumerate(times):
        pg.evaluate('render(%f)' % t)
        pg.locator('canvas').screenshot(path=str(fd / ('f_%05d.png' % i)))
    br.close()
if frames_only:
    out.mkdir(parents=True, exist_ok=True)
    for i, t in enumerate(times): shutil.copy(fd / ('f_%05d.png' % i), out / ('t_%05.2f.png' % t))
else:
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(fd / 'f_%05d.png'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)], check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('OK', out)
