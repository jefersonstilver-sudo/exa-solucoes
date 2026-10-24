# Grava a tela do painel (NUC) por ate 4 minutos e envia o video para a EXA.
# Uso no terminal do NUC (uma linha):
#   python3 -c "import urllib.request as u;exec(u.urlopen('https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/gravar_tela.py').read())"
# So le a tela; nao altera nada no painel.
#
# v4 (medido): a gravacao do Luis XV (406x720) saiu fluida, 10 quadros/s reais; a do St. Peter em 1080x1920
# comprimida pelo processador saiu com menos de 1 quadro/s real (7x mais pixels para o Celeron).
# Agora grava so em HD 720x1280 (boa qualidade para edicao), com a receita que foi fluida no Luis XV.
# Antes de gravar, faz um teste de 6 s de cada modo e so usa o que acompanha o tempo real.
import os, subprocess, shutil, time, urllib.request, urllib.error, json, glob, re

SEGUNDOS = 240
ENDERECO_ENVIO = "https://sistema-update.s3.sa-east-1.amazonaws.com/diag/envio_gravacao.json"
ARQ = "/tmp/gravacao_painel.mp4"
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

def dispositivo_video():
    d = sorted(glob.glob("/dev/dri/renderD*"))
    return d[0] if d else None

def modos(tam):
    w, h = [int(x) for x in tam.split("x")]
    hd = "720:1280" if h > w else "1280:720"
    grab = ["-f", "x11grab", "-draw_mouse", "0", "-thread_queue_size", "512", "-video_size", tam]
    lista = []
    # so HD 720x1280 (imagem boa para edicao); testa do mais fluido para o mais leve
    for fps in ("15", "12", "10"):
        lista.append((f"HD-{fps}", grab + ["-framerate", fps, "-i", DISPLAY + ".0",
                      "-vf", f"scale={hd}:flags=bicubic,format=yuv420p", "-c:v", "libx264", "-preset", "ultrafast", "-crf", "18", "-threads", "2"]))
    return lista

def rodar(args, segundos, saida):
    cmd = ["ffmpeg", "-hide_banner", "-nostdin", "-y"] + args + ["-t", str(segundos), "-movflags", "+faststart", saida]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=segundos + 120)
    vel = re.findall(r"speed=\s*([\d.]+)x", r.stderr)
    return (float(vel[-1]) if vel else 0.0), r.stderr[-300:]

def main():
    print("Preparando a gravacao (v4)...", flush=True)
    tam = tamanho_tela()
    print("tela:", tam, "| gravando em HD 720x1280 |", sh(["sh", "-c", "grep -m1 'model name' /proc/cpuinfo"]), flush=True)
    print("MINIMIZE ESTE TERMINAL AGORA (botao _ no canto). O teste comeca em 20 segundos.", flush=True)
    for i in range(20, 0, -5):
        print(f"  comeca em {i} s...", flush=True); time.sleep(5)
    escolhido = None
    for nome, args in modos(tam):
        vel, erro = rodar(args, 6, "/tmp/teste_grav.mp4")
        print(f"teste {nome}: velocidade {vel:.2f}x", flush=True)
        if vel >= 0.97 and os.path.exists("/tmp/teste_grav.mp4") and os.path.getsize("/tmp/teste_grav.mp4") > 10000:
            escolhido = (nome, args); break
        if vel == 0.0:
            print("   ", erro.strip().splitlines()[-1] if erro.strip() else "", flush=True)
    if not escolhido:
        nome, args = modos(tam)[-1]
        escolhido = (nome, args)
        print("Nenhum modo acompanhou 100%; usando o mais leve.", flush=True)
    nome, args = escolhido
    print(f"GRAVANDO no modo {nome} por {SEGUNDOS // 60} minutos... (nao feche este terminal)", flush=True)
    vel, erro = rodar(args, SEGUNDOS, ARQ)
    print(f"gravacao terminou: velocidade media {vel:.2f}x", flush=True)
    if not os.path.exists(ARQ):
        print("ERRO: nao consegui gravar. Mande um print deste terminal para a EXA.\n", erro); return
    enviar(ARQ, nome)

def enviar(arq, nome):
    mb = os.path.getsize(arq) / 1e6
    print(f"Gravacao pronta ({mb:.0f} MB, {nome}). Enviando...", flush=True)
    destino = json.loads(urllib.request.urlopen(ENDERECO_ENVIO + "?t=" + str(int(time.time())), timeout=30).read())["url"]
    with open(arq, "rb") as f:
        req = urllib.request.Request(destino, data=f.read(), method="PUT", headers={"Content-Type": "video/mp4"})
    try:
        resp = urllib.request.urlopen(req, timeout=3600)
    except urllib.error.HTTPError as e:
        print("ERRO NO ENVIO", e.code, e.read()[:300].decode("utf-8", "replace"))
        print("A gravacao ficou guardada em", arq, "- reenvie com o enviar_gravacao.py")
        return
    print("ENVIADO_OK" if resp.status in (200, 201) else f"Envio respondeu {resp.status}", "|", nome)
    os.remove(arq)

main()
