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
vert = fmt == 'vertical_premium_15s'; FPS = 60; DUR = 15 if vert else 10
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

def media_dims(path):
    """tamanho REAL exibido (considera rotacao de celular)"""
    import json as _j
    try:
        o = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:stream_tags=rotate:stream_side_data=rotation', '-of', 'json', path], capture_output=True, text=True).stdout
        st_ = _j.loads(o)['streams'][0]; w, h = int(st_['width']), int(st_['height']); rot = 0
        try: rot = int(float((st_.get('tags') or {}).get('rotate', 0)))
        except Exception: pass
        for sd in st_.get('side_data_list') or []:
            if 'rotation' in sd: rot = int(float(sd['rotation']))
        if abs(rot) % 180 == 90: w, h = h, w
        return w, h
    except Exception:
        try:
            from PIL import Image, ImageOps
            im = ImageOps.exif_transpose(Image.open(path)); return im.size
        except Exception: return 0, 0
SPLIT = False; MW = MH = 0
if media:
    MW, MH = media_dims(str(tmp / media))
    SPLIT = bool(MW and MH and (MW / MH) < 0.8 and fmt != 'vertical_premium_15s')
    print('midia dims', MW, MH, 'split', SPLIT)
wa = ''.join(ch for ch in str(b.get('whatsapp_qr', '')) if ch.isdigit())
qr = None; whats = ''
if wa:
    if len(wa) <= 11: wa = '55' + wa
    q = segno.make('https://wa.me/%s?text=%s' % (wa, urllib.parse.quote(b.get('qr_texto', 'Oi! Vi o video de voces no elevador'))), error='m', micro=False)
    qr = [[1 if c else 0 for c in row] for row in q.matrix]
    d = wa[2:] if wa.startswith('55') else wa
    whats = '(%s) %s-%s' % (d[:2], d[2:-4], d[-4:]) if len(d) >= 10 else d
P = {'empresa': b.get('empresa', 'SUA MARCA'), 'segmento': b.get('segmento', ''), 'cores_estilo': b.get('cores_estilo', ''), 'mensagem': b.get('mensagem', 'ANUNCIE AQUI'), 'subtitulo': b.get('subtitulo', ''),
     'cta': b.get('cta') or ('PECA AGORA' if qr else 'CONHECA'), 'instagram': re.sub(r'[^A-Za-z0-9_.]', '', str(b.get('instagram', ''))), 'formato': fmt, 'qr': qr, 'whats': whats, 'assets': assets, 'media': bool(media), 'split': SPLIT, 'pedido': b.get('pedido_cliente', '') + ' ' + b.get('observacoes', ''), 'tema': b.get('tema'), 'elementos': b.get('elementos') or [], 'elementos_txt': b.get('estilo_extra', '')}
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

def hex2hsl(h):
    import colorsys
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]; hh,l,ss=colorsys.rgb_to_hls(r,g,b); return hh*360,ss,l
def hsl2hex(h,s,l):
    import colorsys
    r,g,b=colorsys.hls_to_rgb((h%360)/360,l,s); return '#%02x%02x%02x'%(int(r*255),int(g*255),int(b*255))
def logo_palette(path):
    try:
        from PIL import Image
        im=Image.open(path).convert('RGBA'); im.thumbnail((120,120)); px=[p for p in im.getdata() if p[3]>200]
        from collections import Counter
        q=Counter((p[0]//32*32+16,p[1]//32*32+16,p[2]//32*32+16) for p in px)
        cand=[]
        for (r,g,b),n in q.most_common(40):
            h,s,l=hex2hsl('#%02x%02x%02x'%(r,g,b))
            if s>.35 and .22<l<.75: cand.append((n*(1+s),h,s,l))
        cand.sort(reverse=True); out=[]
        for _,h,s,l in cand:
            if all(min(abs(h-x),360-abs(h-x))>35 for x in out): out.append(h)
        return out[:2]
    except Exception as e:
        print('paleta falhou',e); return []
def hexcolor(txt):
    import re as _re
    m=_re.search(r'#([0-9a-fA-F]{6})',txt or '')
    return ('#'+m.group(1)) if m else None
hl=[]
if 'logo' in assets: hl=logo_palette(tmp/assets['logo'])
cx=hexcolor(b.get('cores_estilo'))
if cx: P['cor']=cx; hl2=hex2hsl(cx)[0]
elif P.get('hue') is not None and hue_from_text(b.get('cores_estilo')) is not None: P['cor']=hsl2hex(P['hue'],.85,.52); hl2=P['hue']
elif hl: P['cor']=hsl2hex(hl[0],.85,.52); hl2=hl[0]
elif P.get('hue') is not None: P['cor']=hsl2hex(P['hue'],.85,.52); hl2=P['hue']
else: P['cor']='#d92d3a'; hl2=355
P['cor2']=hsl2hex(hl[1],.9,.58) if len(hl)>1 else hsl2hex(hl2+35,.9,.6)
P['escuro']='#0b0b10'; P['claro']='#f2efe9'
P['frases']=[x for x in (b.get('frases') or []) if x][:6]
P['numeros']=b.get('numeros') or []

SCENE = (b.get('scene_code') or '').strip()
SCENE_HTML = (b.get('scene_html') or '').strip(); ESTILO = int(b.get('estilo') or 0)
HTMLMODE = bool(SCENE_HTML) or ESTILO in (1,2,3,4,5)
if HTMLMODE: SCENE=''
if HTMLMODE:
    shutil.copy(here / 'gsap.min.js', tmp / 'gsap.min.js')
    if SCENE_HTML: (tmp / 'index.html').write_text(SCENE_HTML, encoding='utf-8')
    else: shutil.copy(here / ('estilo%d.html' % ESTILO), tmp / 'index.html')
else:
    shutil.copy(here / ('gen_harness.html' if SCENE else 'template4.html'), tmp / 'index.html')
with sync_playwright() as p:
    br = p.chromium.launch(args=['--allow-file-access-from-files'])
    pg = br.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: print('PAGEERR', e))
    perr = []
    pg.on('pageerror', lambda e: perr.append(str(e)))
    if SCENE or HTMLMODE: pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith('file://') else r.abort())
    pg.add_init_script('window.P = %s;' % json.dumps(P))
    if HTMLMODE: pg.add_init_script('window.__RENDER = true;')
    if SCENE: pg.add_init_script('window.SCENE_CODE = %s;' % json.dumps(SCENE))
    pg.goto('file://%s/index.html' % tmp)
    if HTMLMODE:
        pg.wait_for_function('window.tl && window.tl.duration() > 1', timeout=15000); pg.evaluate('document.fonts && document.fonts.ready'); pg.wait_for_timeout(300)
    else: pg.evaluate('window.ready()')
    def shot(t):
        if HTMLMODE:
            pg.evaluate('(t)=>{window.tl.pause();window.tl.time(t,false)}', t); return pg.screenshot(omit_background=bool(media))
        pg.evaluate('render(%f)' % t); return pg.locator('canvas').screenshot(omit_background=bool(media))
    if VALIDATE:
        import io, time
        from PIL import Image, ImageChops, ImageStat
        res = {'ok': True, 'problemas': []}; ims = []; t0 = time.time()
        ts = [0.5, 1.5, 3, 4.5, 6, 7.5, 9, DUR - 0.4]
        for t in ts:
            ims.append(Image.open(io.BytesIO(shot(t))).convert('RGBA'))
        per = (time.time() - t0) / len(ts)
        errs = pg.evaluate('window.ERRS || []') + perr
        if HTMLMODE and pg.evaluate('window.tl.duration()') < DUR - 0.6: errs.append('timeline curta: ' + str(pg.evaluate('window.tl.duration()')))
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
    import hashlib
    hashes = []
    for i, t in enumerate(times):
        png = shot(t); open(str(fd / ('f_%05d.png' % i)), 'wb').write(png); hashes.append(hashlib.md5(png).hexdigest())
    br.close()
    try:
        # relatorio de quadros: trechos parados (mesmo quadro repetido), movimento medio e quadros em branco
        runs = []; cur = 1
        for i in range(1, len(hashes)):
            if hashes[i] == hashes[i - 1]: cur += 1
            else:
                if cur >= int(FPS * .5): runs.append((round((i - cur) / FPS, 2), round(cur / FPS, 2)))
                cur = 1
        if cur >= int(FPS * .5): runs.append((round((len(hashes) - cur) / FPS, 2), round(cur / FPS, 2)))
        uniq = len(set(hashes)); rep = {'fps': FPS, 'quadros': len(hashes), 'unicos': uniq, 'pct_unicos': round(100.0 * uniq / max(1, len(hashes)), 1), 'paradas_longas': [{'inicio_s': a, 'dur_s': d} for a, d in runs], 'tem_midia': bool(media), 'estilo': ESTILO or 'canvas'}
        print('FRAMEREPORT ' + json.dumps(rep))
    except Exception as e: print('framereport falhou', e)
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
        mw, mh = MW, MH
        vf_pre = 'autorotate' # ffmpeg rotaciona sozinho
        if SPLIT:
            ph = int(H * 0.84) // 2 * 2; pw = int(ph * mw / mh) // 2 * 2; r = max(18, pw // 14)
            cx = int(W * 0.855)
            geq = "geq=lum='p(X,Y)':cb='p(X,Y)':cr='p(X,Y)':a='if(gt(abs(X-W/2),W/2-%d)*gt(abs(Y-H/2),H/2-%d)*gt(hypot(abs(X-W/2)-(W/2-%d),abs(Y-H/2)-(H/2-%d)),%d),0,255)'" % (r, r, r, r, r)
            bz = max(8, pw // 36)
            bgf = ('[0:v]split=2[a][b];[a]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,boxblur=40:4,eq=brightness=-0.32:saturation=1.05[bgb];'
                   '[b]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,pad=%d:%d:%d:%d:color=0x0d0d10,format=yuva420p,%s[ph];'
                   '[bgb][ph]overlay=%d-w/2:(H-h)/2,fps=%d,format=yuv420p[bg]') % (W, H, W, H, pw, ph, pw, ph, pw + 2 * bz, ph + 2 * bz, bz, bz, geq, cx, FPS)
        elif is_vid:
            same = mw and mh and abs((mw / mh) / (W / H) - 1) < .25
            if same:
                bgf = '[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,fps=%d,eq=brightness=-0.06:saturation=1.08,format=yuv420p[bg]' % (W, H, W, H, FPS)
            else:
                bgf = '[0:v]split=2[a][b];[a]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d,boxblur=36:3,eq=brightness=-0.16:saturation=1.1[bgb];[b]scale=%d:%d:force_original_aspect_ratio=decrease[fg];[bgb][fg]overlay=(W-w)/2:(H-h)/2,fps=%d,format=yuv420p[bg]' % (W, H, W, H, W, H, FPS)
        else:
            bgf = '[0:v]scale=%d:%d:force_original_aspect_ratio=increase,crop=%d:%d%s,fps=%d,eq=brightness=-0.06:saturation=1.08,format=yuv420p[bg]' % (W * 2, H * 2, W * 2, H * 2, zoom, FPS)
        fc = bgf + ';[bg][1:v]overlay=format=auto,' + fade + ',format=yuv420p[v]'
        cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + pre + ['-framerate', str(FPS), '-i', str(fd / 'f_%05d.png'), '-filter_complex', fc, '-map', '[v]', '-t', str(DUR), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)]
    else:
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(fd / 'f_%05d.png'), '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', str(out)]
    subprocess.run(cmd, check=True)
shutil.rmtree(tmp, ignore_errors=True)
print('OK', out)
