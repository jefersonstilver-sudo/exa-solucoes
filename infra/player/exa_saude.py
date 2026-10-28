# -*- coding: utf-8 -*-
"""
EXA 2.0 — Coletor de saúde do NUC ("auditoria v7", automática).

Roda a cada 15 min pelo cron do usuário (instalado por instalar_saude_no_nuc.sh), SEPARADO do player:
  - só LÊ o sistema (nada é alterado, nada é reiniciado);
  - prioridade mínima de CPU e disco (nice 19 / ionice idle) e limite total de 150 s (timeout no cron);
  - cada medição tem limite próprio; se uma falhar, as outras seguem;
  - se a internet estiver fora, apenas não envia (tenta de novo no próximo ciclo).

Envia para o ExaSistema (função telas_registrar_saude), a mesma porta que o player usa para o heartbeat.
O teste de velocidade de download (5 MB) roda só 1x por dia.
"""
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request

APP = os.path.expanduser("~/Documentos/appUbuntu")
CONF = os.path.expanduser("~/.exa_saude.json")      # {"cliente_id": "bc17"} gravado na instalação
ESTADO = os.path.expanduser("~/.exa_saude_estado.json")
VERSAO_COLETOR = "saude-v7"
API_TELAS = "18.228.252.149"
URL_VEL_S3 = "https://sistema-update.s3.sa-east-1.amazonaws.com/diag/velocidade_5mb.bin"
URL_VEL_CF = "https://speed.cloudflare.com/__down?bytes=5000000"


def sh(cmd, timeout=8, env=None):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout, env=env)
        return r.stdout.strip()
    except Exception:
        return ""


def ler(caminho, padrao=""):
    try:
        with open(caminho) as f:
            return f.read().strip()
    except Exception:
        return padrao


def env_do_player():
    vals = {}
    for linha in ler(os.path.join(APP, ".env")).splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        k, v = linha.split("=", 1)
        vals[k.strip()] = v.strip().strip('"').strip("'")
    return vals


def temperatura():
    melhor = None
    for zona in sorted(os.listdir("/sys/class/thermal")) if os.path.isdir("/sys/class/thermal") else []:
        if not zona.startswith("thermal_zone"):
            continue
        t = ler("/sys/class/thermal/%s/temp" % zona)
        tipo = ler("/sys/class/thermal/%s/type" % zona)
        try:
            c = int(t) / 1000.0
        except Exception:
            continue
        if 5 < c < 125 and (melhor is None or c > melhor[0]):
            melhor = (c, tipo)
    if melhor is None:
        out = sh("sensors 2>/dev/null")
        nums = [float(x) for x in re.findall(r"\+(\d+\.\d)°C", out)]
        if nums:
            melhor = (max(nums), "sensors")
    return (round(melhor[0], 1), melhor[1]) if melhor else (None, None)


def memoria():
    info = {}
    for linha in ler("/proc/meminfo").splitlines():
        p = linha.split()
        if len(p) >= 2:
            info[p[0].rstrip(":")] = int(p[1])
    tot, disp = info.get("MemTotal", 0), info.get("MemAvailable", 0)
    st, sf = info.get("SwapTotal", 0), info.get("SwapFree", 0)
    return {
        "ram_total_gb": round(tot / 1048576, 1) if tot else None,
        "ram_uso_pct": round(100 * (tot - disp) / tot) if tot else None,
        "swap_uso_pct": round(100 * (st - sf) / st) if st else 0,
    }


def ping(host, n=10):
    out = sh("ping -n -q -c %d -i 0.3 -W 1 %s 2>/dev/null" % (n, host), timeout=n + 6)
    perda = re.search(r"(\d+(?:\.\d+)?)% packet loss", out)
    rtt = re.search(r"= ([\d.]+)/([\d.]+)/([\d.]+)/([\d.]+) ms", out)
    return {
        "perda_pct": float(perda.group(1)) if perda else 100.0,
        "lat_ms": float(rtt.group(2)) if rtt else None,
        "lat_max_ms": float(rtt.group(3)) if rtt else None,
        "jitter_ms": float(rtt.group(4)) if rtt else None,
    }


def tcp(host, porta, n=5):
    """Servidor das telas não responde ping (firewall da AWS): mede abrindo conexão na porta da API."""
    tempos, falhas = [], 0
    for _ in range(n):
        t0 = time.time()
        try:
            c = socket.create_connection((host, porta), timeout=3)
            c.close()
            tempos.append((time.time() - t0) * 1000)
        except Exception:
            falhas += 1
        time.sleep(0.2)
    return {
        "perda_pct": round(100.0 * falhas / n, 1),
        "lat_ms": round(sum(tempos) / len(tempos), 1) if tempos else None,
        "lat_max_ms": round(max(tempos), 1) if tempos else None,
        "metodo": "tcp",
    }


def rede():
    d = {}
    rota = sh("ip -4 route show default 2>/dev/null").splitlines()
    m = re.search(r"default via (\S+) dev (\S+)", rota[0]) if rota else None
    if not m:
        d["sem_rota"] = True
        return d
    gw, iface = m.group(1), m.group(2)
    d["gateway"], d["iface"] = gw, iface
    sem_fio = os.path.isdir("/sys/class/net/%s/wireless" % iface) or os.path.exists("/sys/class/net/%s/phy80211" % iface)
    d["tipo"] = "wifi" if sem_fio else "cabo"
    vel = ler("/sys/class/net/%s/speed" % iface)
    if vel.lstrip("-").isdigit() and int(vel) > 0:
        d["link_mbps"] = int(vel)
    if sem_fio:
        lk = sh("iw dev %s link 2>/dev/null" % iface)
        f = re.search(r"freq: (\d+)", lk)
        s = re.search(r"signal: (-?\d+) dBm", lk)
        b = re.search(r"tx bitrate: ([\d.]+) MBit", lk)
        ss = re.search(r"SSID: (.+)", lk)
        if f:
            mhz = int(f.group(1))
            d["wifi_mhz"] = mhz
            d["wifi_banda"] = "5 GHz" if mhz >= 4900 else "2.4 GHz"
        if s:
            d["wifi_sinal_dbm"] = int(s.group(1))
        if b:
            d["wifi_taxa_mbps"] = float(b.group(1))
        if ss:
            d["wifi_ssid"] = ss.group(1).strip()[:40]
    d["gw"] = ping(gw)
    d["internet"] = ping("8.8.8.8")
    d["api_telas"] = tcp(API_TELAS, 8000)
    try:
        with urllib.request.urlopen("https://api.ipify.org", timeout=6) as r:
            d["ip_publico"] = r.read(64).decode().strip()
    except Exception:
        pass
    try:
        socket.setdefaulttimeout(5)
        socket.gethostbyname("iwlscwsenzgyylopnwpu.supabase.co")
        d["dns_ok"] = True
    except Exception:
        d["dns_ok"] = False
    return d


def _baixar_medindo(url, limite_s):
    t0 = time.time()
    n = 0
    req = urllib.request.Request(url, headers={"User-Agent": "exa-saude"})
    with urllib.request.urlopen(req, timeout=8) as r:
        while time.time() - t0 < limite_s:
            bloco = r.read(65536)
            if not bloco:
                break
            n += len(bloco)
    seg = max(time.time() - t0, 0.001)
    return round(n * 8 / seg / 1e6, 2), n, round(seg, 1)


def velocidade_download(estado):
    """v7: mede do NOSSO S3 (de onde vêm os vídeos) e da Cloudflare (referência). No máx. 1x a cada 6 h; 15 s cada."""
    if time.time() - estado.get("ultimo_speedtest", 0) < 6 * 3600:
        return estado.get("velocidade")
    d = {}
    for nome, url in (("s3", URL_VEL_S3), ("cloudflare", URL_VEL_CF)):
        try:
            mbps, n, seg = _baixar_medindo(url, 15)
            d[nome] = {"mbps": mbps, "bytes": n, "seg": seg}
        except Exception as e:
            d[nome] = {"erro": str(e)[:80]}
    d["medido_em"] = time.strftime("%Y-%m-%d %H:%M")
    estado["ultimo_speedtest"] = time.time() if any("mbps" in v for v in d.values() if isinstance(v, dict)) else time.time() - 5 * 3600
    estado["velocidade"] = d
    return d


def monitor():
    env = dict(os.environ)
    env.setdefault("DISPLAY", ":0")
    env.setdefault("XAUTHORITY", os.path.expanduser("~/.Xauthority"))
    d = {}
    xr = sh("xrandr --query 2>/dev/null", timeout=6, env=env)
    if xr:
        conectadas = re.findall(r"^(\S+) connected(?: primary)? (\d+x\d+)?", xr, re.M)
        d["saidas_conectadas"] = [c[0] for c in conectadas]
        d["resolucao"] = next((c[1] for c in conectadas if c[1]), None)
        d["monitor_conectado"] = bool(conectadas)
    xs = sh("xset q 2>/dev/null", timeout=6, env=env)
    if "Monitor is" in xs:
        d["monitor_ligado"] = "Monitor is On" in xs
    return d


def tela(resolucao):
    """v7: duas capturas pequenas da tela com 3 s de intervalo. Igual = possivelmente CONGELADA
    (o relógio da tela mostra segundos, então uma tela viva sempre muda). Brilho ~0 = tela PRETA."""
    if not shutil.which("ffmpeg"):
        return {"metodo": "sem ffmpeg"}
    env = dict(os.environ)
    env.setdefault("DISPLAY", ":0")
    env.setdefault("XAUTHORITY", os.path.expanduser("~/.Xauthority"))
    tam = resolucao or "1080x1920"

    def foto():
        r = subprocess.run(["nice", "-n", "19", "ffmpeg", "-loglevel", "error", "-f", "x11grab", "-video_size", tam, "-i",
                            env["DISPLAY"], "-frames:v", "1", "-vf", "scale=48:-1", "-pix_fmt", "gray", "-f", "rawvideo", "-"],
                           capture_output=True, timeout=12, env=env)
        return r.stdout

    a = foto()
    time.sleep(3)
    b = foto()
    if not a or not b:
        return {"erro": "captura falhou"}
    dif = sum(1 for x, y in zip(a, b) if abs(x - y) > 8)
    return {"mudou": dif > 0, "pixels_mudaram": dif, "brilho": round(sum(b) / len(b), 1), "preta": sum(b) / len(b) < 4}


def motivo_boot(estado):
    """v7: quando o NUC ligou de novo, descobre como a sessão anterior terminou (journal da sessão anterior)."""
    bid = ler("/proc/sys/kernel/random/boot_id")
    if not bid:
        return estado.get("ultimo_boot")
    if estado.get("boot_id") == bid:
        return estado.get("ultimo_boot")
    d = {"detectado_em": time.strftime("%Y-%m-%d %H:%M:%S")}
    try:
        d["ligou_em"] = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() - float(ler("/proc/uptime", "0").split()[0])))
    except Exception:
        pass
    ant = sh("journalctl -b -1 -n 80 -o short-iso --no-pager 2>/dev/null", timeout=15)
    if not ant:
        d["tipo"] = "desconhecido (sem registro da sessao anterior)"
    else:
        linhas = [l for l in ant.splitlines() if l and not l.startswith("--")]
        d["anterior_terminou"] = linhas[-1][:25] if linhas else None
        if re.search(r"Reached target .*(Reboot|System Reboot)|systemd-shutdown.*reboot|Rebooting", ant, re.I):
            d["tipo"] = "reinicio pelo sistema"
        elif re.search(r"Reached target .*(Power-Off|Shutdown|Halt)|systemd-shutdown|Journal stopped|System is powering down", ant, re.I):
            d["tipo"] = "desligamento pelo sistema"
        else:
            d["tipo"] = "abrupto (falta de energia ou travamento)"
    vlog = ler(os.path.expanduser("~/.exa_vigia/vigia.log"))
    if d.get("anterior_terminou") and "REINICIANDO O NUC" in vlog:
        dia = d["anterior_terminou"][:10]
        if any(l.startswith(dia) and "REINICIANDO O NUC" in l for l in vlog.splitlines()[-20:]):
            d["tipo"] = "reiniciado pelo vigia (NUC sem rede)"
    estado["boot_id"] = bid
    estado["ultimo_boot"] = d
    return d


def versao_player():
    m = re.search(r'APP_VERSAO\s*=\s*"([^"]+)"', ler(os.path.join(APP, "atualizadores", "sistema.py")))
    return m.group(1) if m else (ler(os.path.join(APP, "version_app.txt")) or None)


def cpu():
    """Uso real de CPU em 2 s e os processos que mais consomem (explica carga alta)."""
    def amostra():
        v = [int(x) for x in ler("/proc/stat").splitlines()[0].split()[1:]]
        ocioso = v[3] + (v[4] if len(v) > 4 else 0)
        return sum(v), ocioso
    try:
        t1, o1 = amostra()
        time.sleep(2)
        t2, o2 = amostra()
        uso = round(100 * (1 - (o2 - o1) / max(t2 - t1, 1)))
    except Exception:
        uso = None
    top = []
    for linha in sh("ps -eo pcpu,pmem,comm --sort=-pcpu --no-headers 2>/dev/null | head -n 5").splitlines():
        p = linha.split(None, 2)
        if len(p) == 3:
            top.append({"cpu": float(p[0]), "mem": float(p[1]), "proc": p[2][:30]})
    io = sh("cat /proc/pressure/io 2>/dev/null | head -n1")
    m = re.search(r"avg60=([\d.]+)", io)
    return {"cpu_uso_pct": uso, "top": top, "io_espera_pct": float(m.group(1)) if m else None}


def player():
    procs = sh("pgrep -af 'python' 2>/dev/null")
    d = {
        "main_rodando": "main.py" in procs,
        "atualizador_rodando": "atualizador.py" in procs,
        "app_versao": versao_player(),
    }
    pid = sh("pgrep -of 'main.py'")
    if pid.isdigit():
        et = sh("ps -o etimes= -p %s" % pid)
        if et.strip().isdigit():
            d["main_ha_min"] = int(et) // 60
    pasta = os.path.join(APP, "cache", "Propagandas")
    try:
        arqs = [f for f in os.listdir(pasta) if not f.endswith(".part")]
        d["videos_no_cache"] = len(arqs)
        d["cache_mb"] = round(sum(os.path.getsize(os.path.join(pasta, f)) for f in arqs) / 1048576)
    except Exception:
        pass
    # disco aceita escrita? (disco "somente leitura" trava o player sem avisar)
    teste = os.path.join(APP, ".exa_saude_teste")
    try:
        with open(teste, "w") as f:
            f.write("ok")
        os.remove(teste)
        d["disco_gravavel"] = True
    except Exception:
        d["disco_gravavel"] = False
    return d


def sistema():
    d = {}
    try:
        d["uptime_h"] = round(float(ler("/proc/uptime", "0").split()[0]) / 3600, 1)
    except Exception:
        pass
    try:
        d["load1"] = round(os.getloadavg()[0], 2)
    except Exception:
        pass
    d["cores"] = os.cpu_count()
    du = shutil.disk_usage("/")
    d["disco_total_gb"] = round(du.total / 1e9)
    d["disco_uso_pct"] = round(100 * du.used / du.total)
    d.update(memoria())
    d["ntp_ok"] = sh("timedatectl show -p NTPSynchronized --value 2>/dev/null") == "yes"
    # desligamento programado da 01:00 (cron do root): só é seguro com poweroff/halt mascarados
    d["poweroff_mascarado"] = sh("systemctl is-enabled poweroff.target 2>/dev/null") == "masked"
    boots = sh("journalctl --list-boots --no-pager 2>/dev/null | tail -n 30", timeout=10)
    if boots:
        agora = time.time()
        n = 0
        for linha in boots.splitlines():
            m = re.search(r"(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})", linha)
            if m:
                try:
                    t = time.mktime(time.strptime(m.group(1), "%Y-%m-%d %H:%M:%S"))
                    if agora - t < 86400:
                        n += 1
                except Exception:
                    pass
        d["boots_24h"] = n
    d["hostname"] = socket.gethostname()
    d["produto"] = ler("/sys/class/dmi/id/product_name") or None
    d["fabricante"] = ler("/sys/class/dmi/id/sys_vendor") or None
    d["cpu"] = next((l.split(":", 1)[1].strip() for l in ler("/proc/cpuinfo").splitlines() if l.startswith("model name")), None)
    return d


def vigia(estado):
    """Vigia de rede: diário de conexão (mudanças de estado minuto a minuto) + ações + estado do cabo."""
    d = {"instalado": "exa_vigia_rede.sh" in sh("crontab -l 2>/dev/null")}
    base = os.path.expanduser("~/.exa_vigia/")
    d["estado_agora"] = ler(base + "estado") or None
    try:
        d["falhas_agora_min"] = int(ler(base + "falhas", "0") or 0)
    except Exception:
        d["falhas_agora_min"] = 0
    acoes = ler(base + "vigia.log").splitlines()
    limite = time.strftime("%Y-%m-%d", time.localtime(time.time() - 7 * 86400))
    rec = [l for l in acoes if l[:10] >= limite]
    d["reboots_7d"] = sum("REINICIANDO O NUC" in l for l in rec)
    d["rede_reiniciada_7d"] = sum("reiniciando a rede" in l for l in rec)
    d["acoes"] = [l[:140] for l in rec[-6:]]
    # diário: envia o que ainda não foi enviado (até 60 linhas) + resumo das últimas 24 h
    diario = ler(base + "diario.log").splitlines()
    ultimo = estado.get("diario_ultimo", "")
    novos = [l for l in diario if l > ultimo] if ultimo else diario[-60:]
    d["diario_novos"] = [l[:120] for l in novos[-60:]]
    estado["_diario_pendente"] = diario[-1] if diario else ultimo
    lim24 = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(time.time() - 86400))
    res = {}
    for l in diario:
        if l[:19] >= lim24:
            tipo = (l[20:].split(" ") or ["?"])[0]
            res[tipo] = res.get(tipo, 0) + 1
    d["eventos_24h"] = res
    for dev in sorted(os.listdir("/sys/class/net")):
        if dev.startswith(("en", "eth")):
            b = "/sys/class/net/" + dev
            d["cabo"] = {"placa": dev, "sinal": ler(b + "/carrier") == "1", "velocidade_mbps": ler(b + "/speed") or None,
                         "driver": os.path.basename(os.path.realpath(b + "/device/driver")) if os.path.exists(b + "/device/driver") else None,
                         "erros_rx": ler(b + "/statistics/rx_errors") or None,
                         "quedas_link": ler(b + "/carrier_changes") or None}
            break
    return d


def identidade():
    """Um prédio pode ter 2+ NUCs com o mesmo código de tela: cada NUC se identifica pelo ID do AnyDesk
    (o mesmo do painel de monitoramento) ou, sem ele, pelo machine-id."""
    ad = sh("anydesk --get-id 2>/dev/null", timeout=8)
    ad = ad if ad.isdigit() else ""
    mid = ler("/etc/machine-id")[:12]
    return ad, (ad or mid or socket.gethostname())


def enviar(payload, env):
    url = (env.get("SUPABASE_URL") or "").rstrip("/")
    chave = env.get("SUPABASE_KEY") or env.get("SUPABASE_ANON_KEY") or env.get("SUPABASE_SERVICE_KEY") or ""
    if not url or not chave:
        print("sem SUPABASE_URL/chave no .env do player")
        return False
    req = urllib.request.Request(
        url + "/rest/v1/rpc/telas_registrar_saude",
        data=json.dumps({"p": payload}).encode(),
        headers={"apikey": chave, "Authorization": "Bearer " + chave, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            if not 200 <= r.status < 300:
                return False
            corpo = r.read(300).decode("utf-8", "replace").strip().strip('"')
            # v7: o servidor (telas_registrar_saude v2) diz se gravou; versão antiga responde vazio = gravou
            if corpo.startswith("ignorado"):
                print("servidor recusou: %s" % corpo)
                return False
            return True
    except Exception as e:
        print("envio falhou: %s" % e)
        return False


def main():
    conf = {}
    try:
        conf = json.loads(ler(CONF, "{}"))
    except Exception:
        pass
    cliente = conf.get("cliente_id")
    if not cliente:
        print("sem cliente_id em %s" % CONF)
        return 1
    estado = {}
    try:
        estado = json.loads(ler(ESTADO, "{}"))
    except Exception:
        pass
    t, fonte = temperatura()
    ad, nuc = identidade()
    payload = {"cliente_id": cliente, "nuc_id": nuc, "anydesk_id": ad or None, "coletor": VERSAO_COLETOR,
               "coletado_em": int(time.time()), "temp_c": t, "temp_fonte": fonte}
    inicio = time.time()
    tempos = {}
    for nome, fn in (("sistema", sistema), ("cpu", cpu), ("rede", rede), ("monitor", monitor), ("player", player),
                     ("vigia", lambda: vigia(estado)), ("boot", lambda: motivo_boot(estado)),
                     ("tela", lambda: tela((payload.get("monitor") or {}).get("resolucao")))):
        t0 = time.time()
        try:
            payload[nome] = fn()
        except Exception as e:
            payload[nome] = {"erro": str(e)[:120]}
        tempos[nome] = round(time.time() - t0, 1)
    # v6.1: o teste de velocidade só roda se ainda sobra tempo (o envio é o que importa)
    if time.time() - inicio < 45:
        t0 = time.time()
        payload["velocidade"] = velocidade_download(estado)
        tempos["velocidade"] = round(time.time() - t0, 1)
    else:
        payload["velocidade"] = estado.get("velocidade")
        tempos["velocidade"] = "pulado"
    v = payload.get("velocidade") or {}
    payload["download_mbps"] = next((v[k]["mbps"] for k in ("s3", "cloudflare") if isinstance(v.get(k), dict) and "mbps" in v[k]), None)
    payload["tempos_s"] = tempos
    try:  # v10: o que o próprio player garantiu (padrão EXA)
        pd = json.loads(ler(os.path.expanduser("~/.exa_padrao.json"), "{}"))
        payload["padrao"] = {k: pd.get(k) for k in ("versao", "quando", "ok", "itens", "erros")}
    except Exception:
        pass
    ok = enviar(payload, env_do_player())
    if ok and estado.get("_diario_pendente"):
        estado["diario_ultimo"] = estado["_diario_pendente"]  # só marca como enviado se o envio deu certo
    estado.pop("_diario_pendente", None)
    try:
        with open(ESTADO, "w") as f:
            json.dump(estado, f)
    except Exception:
        pass
    if "--mostrar" in sys.argv:
        print(json.dumps(payload, ensure_ascii=False, indent=1))
    print("ENVIADO" if ok else "NAO ENVIADO")
    return 0


if __name__ == "__main__":
    sys.exit(main())
