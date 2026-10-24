# Grava a tela do painel (NUC) por ate 4 minutos e envia o video para a EXA.
# Uso no terminal do NUC (uma linha):
#   python3 -c "import urllib.request as u;exec(u.urlopen('https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/gravar_tela.py').read())"
# So le a tela; nao altera nada no painel. O endereco de envio e temporario e vale para um unico arquivo.
#
# v3: o ffmpeg (x11grab) neste NUC so conseguiu ~1 quadro a cada 5 s (video "em slides").
# Agora usa o GRAVADOR DO PROPRIO GNOME (o mesmo do atalho Ctrl+Shift+Alt+R), que grava pela placa
# de video e fica fluido. So se ele nao existir cai no ffmpeg, a 15 quadros/s.
import os, subprocess, shutil, time, urllib.request, urllib.error, json, glob

SEGUNDOS = 240
ENDERECO_ENVIO = "https://sistema-update.s3.sa-east-1.amazonaws.com/diag/envio_gravacao.json"
BASE = "/tmp/gravacao_painel"

def sh(cmd, t=15):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=t)
        return (r.stdout + r.stderr).strip()
    except Exception as e:
        return f"(falhou: {e})"

def diagnostico():
    print("--- diagnostico ---", flush=True)
    print("sessao:", os.environ.get("XDG_SESSION_TYPE"), "| desktop:", os.environ.get("XDG_CURRENT_DESKTOP"), "| display:", os.environ.get("DISPLAY"), flush=True)
    print("gnome:", sh(["gnome-shell", "--version"]), flush=True)
    xr = sh(["xrandr", "--query"])
    print("tela:", " | ".join(l.strip() for l in xr.splitlines() if " connected" in l)[:200], flush=True)
    print("cpu:", sh(["sh", "-c", "grep -m1 'model name' /proc/cpuinfo"]), flush=True)
    print("-------------------", flush=True)

def gnome_gravar():
    if not shutil.which("gdbus"):
        return None
    # sem limite de tempo no gravador do GNOME (o padrao e 30 s)
    sh(["gsettings", "set", "org.gnome.settings-daemon.plugins.media-keys", "max-screencast-length", "0"])
    r = sh(["gdbus", "call", "--session", "--dest", "org.gnome.Shell.Screencast", "--object-path", "/org/gnome/Shell/Screencast",
            "--method", "org.gnome.Shell.Screencast.Screencast", BASE, "{'framerate': <30>, 'draw-cursor': <false>}"])
    print("gravador do GNOME:", r[:160], flush=True)
    if not r.startswith("(true"):
        return None
    arq = r.split("'")[1] if "'" in r else None
    print(f"Gravando (GNOME, 30 quadros/s) por {SEGUNDOS // 60} minutos... (nao feche este terminal)", flush=True)
    time.sleep(SEGUNDOS)
    sh(["gdbus", "call", "--session", "--dest", "org.gnome.Shell.Screencast", "--object-path", "/org/gnome/Shell/Screencast",
        "--method", "org.gnome.Shell.Screencast.StopScreencast"])
    time.sleep(5)
    if not arq or not os.path.exists(arq):
        achados = sorted(glob.glob(BASE + "*"), key=os.path.getmtime)
        arq = achados[-1] if achados else None
    return arq

def ffmpeg_gravar():
    if not shutil.which("ffmpeg"):
        return None
    display = os.environ.get("DISPLAY") or ":0"
    tam = "1080x1920"
    for linha in sh(["xdpyinfo", "-display", display]).splitlines():
        if "dimensions:" in linha:
            tam = linha.split()[1]
    print(f"Gravando (ffmpeg, 15 quadros/s) {tam} por {SEGUNDOS // 60} minutos...", flush=True)
    arq = BASE + ".mp4"
    subprocess.run(["nice", "-n", "5", "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                    "-thread_queue_size", "1024", "-use_wallclock_as_timestamps", "1",
                    "-f", "x11grab", "-framerate", "15", "-draw_mouse", "0", "-video_size", tam, "-i", display + ".0",
                    "-t", str(SEGUNDOS), "-fps_mode", "cfr", "-r", "15", "-pix_fmt", "yuv420p",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "20", "-threads", "2", "-movflags", "+faststart", arq])
    return arq if os.path.exists(arq) else None

def enviar(arq):
    mb = os.path.getsize(arq) / 1e6
    print(f"Gravacao pronta ({mb:.0f} MB). Enviando...", flush=True)
    destino = json.loads(urllib.request.urlopen(ENDERECO_ENVIO + "?t=" + str(int(time.time())), timeout=30).read())["url"]
    with open(arq, "rb") as f:
        req = urllib.request.Request(destino, data=f.read(), method="PUT", headers={"Content-Type": "video/mp4"})
    try:
        resp = urllib.request.urlopen(req, timeout=3600)
    except urllib.error.HTTPError as e:
        print("ERRO NO ENVIO", e.code, e.read()[:300].decode("utf-8", "replace"))
        print("A gravacao ficou guardada em", arq)
        return
    print("ENVIADO_OK" if resp.status in (200, 201) else f"Envio respondeu {resp.status}", "| formato:", arq.rsplit(".", 1)[-1])
    os.remove(arq)

def main():
    print("Preparando a gravacao...", flush=True)
    diagnostico()
    for a in glob.glob(BASE + "*"):
        try: os.remove(a)
        except Exception: pass
    print("MINIMIZE ESTE TERMINAL AGORA (botao _ no canto). A gravacao comeca em 20 segundos.", flush=True)
    for i in range(20, 0, -5):
        print(f"  comeca em {i} s...", flush=True); time.sleep(5)
    arq = gnome_gravar() or ffmpeg_gravar()
    if not arq:
        print("ERRO: nao consegui gravar. Mande um print deste terminal para a EXA.")
        return
    enviar(arq)

main()
