# Grava a tela do painel DUAS vezes e envia as duas para a EXA:
#   1) HD 720x1280 (boa para edicao), 4 min
#   2) qualidade leve 450x800 a 12 quadros/s (a receita que saiu fluida no Luis XV), 4 min
# Uso no terminal do painel (uma linha):
#   python3 -c "import urllib.request as u;exec(u.urlopen('https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/gravar_duas.py').read())"
# So le a tela; nao altera nada no painel.
import os, subprocess, time, urllib.request, urllib.error, json, re

SEGUNDOS = 240
BASE = "https://sistema-update.s3.sa-east-1.amazonaws.com/diag/"
DISPLAY = os.environ.get("DISPLAY") or ":0"

def sh(cmd, t=15):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=t)
        return (r.stdout + r.stderr).strip()
    except Exception as e:
        return f"(falhou: {e})"

def tamanho_tela():
    for linha in sh(["xdpyinfo", "-display", DISPLAY]).splitlines():
        if "dimensions:" in linha:
            return linha.split()[1]
    return "1080x1920"

def rodar(args, segundos, saida):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y"] + args + ["-t", str(segundos), "-movflags", "+faststart", saida]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=segundos + 120)
    vel = re.findall(r"speed=\s*([\d.]+)x", r.stderr)
    return (float(vel[-1]) if vel else 0.0), r.stderr[-300:]

def enviar(arq, json_envio, nome):
    mb = os.path.getsize(arq) / 1e6
    print(f"{nome}: pronta ({mb:.0f} MB). Enviando...", flush=True)
    try:
        destino = json.loads(urllib.request.urlopen(BASE + json_envio + "?t=" + str(int(time.time())), timeout=30).read())["url"]
        with open(arq, "rb") as f:
            req = urllib.request.Request(destino, data=f.read(), method="PUT", headers={"Content-Type": "video/mp4"})
        resp = urllib.request.urlopen(req, timeout=3600)
        print(f"{nome}: ENVIADO_OK" if resp.status in (200, 201) else f"{nome}: envio respondeu {resp.status}", flush=True)
        os.remove(arq)
    except urllib.error.HTTPError as e:
        print(f"{nome}: ERRO NO ENVIO", e.code, e.read()[:200].decode("utf-8", "replace"), "| ficou guardada em", arq, flush=True)
    except Exception as e:
        print(f"{nome}: ERRO NO ENVIO", e, "| ficou guardada em", arq, flush=True)

def main():
    print("Preparando as duas gravacoes...", flush=True)
    if not sh(["sh", "-c", "command -v ffmpeg"]):
        print("ERRO: este aparelho nao tem ffmpeg. Mande um print para a EXA."); return
    tam = tamanho_tela()
    w, h = [int(x) for x in tam.split("x")]
    vertical = h > w
    hd = "720:1280" if vertical else "1280:720"
    leve = "-2:800" if vertical else "800:-2"
    print("tela:", tam, "|", sh(["sh", "-c", "grep -m1 'model name' /proc/cpuinfo"]), flush=True)
    grab = ["-f", "x11grab", "-draw_mouse", "0", "-thread_queue_size", "512", "-video_size", tam]
    print("MINIMIZE ESTE TERMINAL AGORA (botao _ no canto). Comeca em 20 segundos.", flush=True)
    for i in range(20, 0, -5):
        print(f"  comeca em {i} s...", flush=True); time.sleep(5)

    # 1) HD: testa 15 / 12 / 10 quadros por segundo e usa o mais alto que acompanha o tempo real
    hd_args = None
    for fps in ("15", "12", "10"):
        a = grab + ["-framerate", fps, "-i", DISPLAY + ".0", "-vf", f"scale={hd}:flags=bicubic,format=yuv420p",
                    "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", "-threads", "2"]
        vel, _ = rodar(a, 6, "/tmp/teste_grav.mp4")
        print(f"teste HD {fps} q/s: velocidade {vel:.2f}x", flush=True)
        hd_args = a
        if vel >= 0.97:
            break
    print(f"1/2 GRAVANDO HD por {SEGUNDOS // 60} min... (nao feche este terminal)", flush=True)
    rodar(hd_args, SEGUNDOS, "/tmp/gravacao_hd.mp4")
    if os.path.exists("/tmp/gravacao_hd.mp4"):
        enviar("/tmp/gravacao_hd.mp4", "envio_gravacao.json", "HD")

    # 2) leve (receita do Luis XV)
    print(f"2/2 GRAVANDO qualidade leve por {SEGUNDOS // 60} min... (nao feche este terminal)", flush=True)
    leve_args = grab + ["-framerate", "12", "-i", DISPLAY + ".0", "-vf", f"scale={leve},format=yuv420p",
                        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "28"]
    rodar(leve_args, SEGUNDOS, "/tmp/gravacao_leve.mp4")
    if os.path.exists("/tmp/gravacao_leve.mp4"):
        enviar("/tmp/gravacao_leve.mp4", "envio_gravacao_leve.json", "LEVE")
    print("TERMINOU. Pode fechar o terminal.", flush=True)

main()
