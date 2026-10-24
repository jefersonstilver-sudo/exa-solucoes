# Grava a tela do painel (NUC) em Full HD por ate 4 minutos e envia o video para a EXA.
# Uso no terminal do NUC (uma linha):
#   python3 -c "import urllib.request as u;exec(u.urlopen('https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/gravar_tela.py').read())"
# So le a tela; nao altera nada no painel. O endereco de envio e temporario e vale para um unico arquivo.
import os, subprocess, shutil, time, urllib.request, urllib.error, json

SEGUNDOS = 240
ENDERECO_ENVIO = "https://sistema-update.s3.sa-east-1.amazonaws.com/diag/envio_gravacao.json"
ARQ = "/tmp/gravacao_painel.mp4"

def resolucao(display):
    for cmd in (["xdpyinfo", "-display", display], ["xrandr", "--display", display]):
        try:
            s = subprocess.run(cmd, capture_output=True, text=True, timeout=10).stdout
        except Exception:
            continue
        for linha in s.splitlines():
            if "dimensions:" in linha:
                return linha.split()[1]
            if "current" in linha and "," in linha:
                p = linha.split("current")[1].split(",")[0].replace(" ", "")
                return p
    return "1080x1920"

def main():
    print("Preparando a gravacao...", flush=True)
    if not shutil.which("ffmpeg"):
        print("ERRO: este painel nao tem o ffmpeg instalado. Avise a EXA.")
        return
    display = os.environ.get("DISPLAY") or ":0"
    tam = resolucao(display)
    w, h = [int(x) for x in tam.lower().split("x")]
    # Full HD: o lado maior fica em ate 1920 (sem esticar)
    escala = "scale='if(gt(iw,ih),min(1920,iw),-2)':'if(gt(iw,ih),-2,min(1920,ih))',format=yuv420p"
    print("MINIMIZE ESTE TERMINAL AGORA (botao _ no canto). A gravacao comeca em 20 segundos.", flush=True)
    for i in range(20, 0, -5):
        print(f"  comeca em {i} s...", flush=True); time.sleep(5)
    print(f"Gravando a tela {tam} por {SEGUNDOS // 60} minutos... (nao feche este terminal)", flush=True)
    t0 = time.time()
    r = subprocess.run([
        "nice", "-n", "5", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-f", "x11grab", "-framerate", "25", "-video_size", f"{w}x{h}", "-i", display + ".0",
        "-t", str(SEGUNDOS), "-vf", escala, "-c:v", "libx264", "-preset", "ultrafast", "-crf", "24",
        "-movflags", "+faststart", ARQ,
    ])
    if r.returncode != 0 or not os.path.exists(ARQ):
        print("ERRO: a gravacao falhou. Mande um print deste terminal para a EXA.")
        return
    mb = os.path.getsize(ARQ) / 1e6
    print(f"Gravacao pronta ({mb:.0f} MB, {time.time() - t0:.0f} s). Enviando...", flush=True)
    destino = json.loads(urllib.request.urlopen(ENDERECO_ENVIO + "?t=" + str(int(time.time())), timeout=30).read())["url"]
    with open(ARQ, "rb") as f:
        req = urllib.request.Request(destino, data=f.read(), method="PUT", headers={"Content-Type": "video/mp4"})
    try:
        resp = urllib.request.urlopen(req, timeout=1800)
    except urllib.error.HTTPError as e:
        print("ERRO NO ENVIO", e.code, e.read()[:300].decode("utf-8", "replace"))
        print("A gravacao ficou guardada no NUC; a EXA manda outro comando so para enviar.")
        return
    print("ENVIADO_OK" if resp.status in (200, 201) else f"Envio respondeu {resp.status}")
    os.remove(ARQ)

main()
