# Envia para a EXA a ultima gravacao da tela que ficou no NUC (/tmp/gravacao_painel.mp4).
import os, json, time, urllib.request, urllib.error
ARQ = "/tmp/gravacao_painel.mp4"
if not os.path.exists(ARQ):
    print("Nao achei a gravacao em /tmp. Rode a gravacao de novo.")
else:
    print(f"Enviando a gravacao ({os.path.getsize(ARQ) / 1e6:.0f} MB)...", flush=True)
    d = json.loads(urllib.request.urlopen("https://sistema-update.s3.sa-east-1.amazonaws.com/diag/envio_gravacao.json?t=" + str(int(time.time())), timeout=30).read())
    try:
        with open(ARQ, "rb") as f:
            r = urllib.request.urlopen(urllib.request.Request(d["url"], data=f.read(), method="PUT", headers={"Content-Type": "video/mp4"}), timeout=1800)
        print("ENVIADO_OK", r.status)
        os.remove(ARQ)
    except urllib.error.HTTPError as e:
        print("ERRO NO ENVIO", e.code, e.read()[:300].decode("utf-8", "replace"))
