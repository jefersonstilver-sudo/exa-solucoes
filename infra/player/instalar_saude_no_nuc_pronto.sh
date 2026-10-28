bash <<'EOF_NUC'
# EXA 2.0 — instala o coletor de saúde (auditoria automática a cada 15 min) neste NUC.
# NÃO mexe no player: não para, não reinicia, não altera nenhum arquivo dele.
# Desfazer: crontab -l | grep -v exa_saude.py | crontab -   (e apagar ~/Documentos/appUbuntu/exa_saude.py)
set -e
APP="$HOME/Documentos/appUbuntu"
[ -d "$APP" ] || { echo "ABORTADO: pasta $APP nao existe"; exit 1; }

# 1) descobre o código da tela usando o próprio player (só leitura)
if [ -n "${EXA_TELA:-}" ]; then printf '{"cliente_id": "%s"}\n' "$EXA_TELA" > "$HOME/.exa_saude.json"; fi
if [ ! -s "$HOME/.exa_saude.json" ]; then
  # 1a) procura "tela_id" nos arquivos de configuração do player
  ID=$(grep -rhoE '"tela_id"[[:space:]]*:[[:space:]]*"?[0-9a-fA-F]{4}"?' "$APP" --include='*.json' 2>/dev/null | head -n1 | grep -oE '[0-9a-fA-F]{4}"?$' | tr -d '"')
  # 1b) se não achar, pergunta ao próprio player
  if [ -z "$ID" ]; then
    ID=$(cd "$APP" && timeout 40 nice -n 19 python3 -c 'import sys; sys.path.insert(0,"."); import atualizadores.sistema as s; print("TELA=" + str(s.CLIENTE_ID))' 2>/tmp/exa_saude_id.err | grep -oE 'TELA=[0-9a-fA-F]+' | tail -n1 | cut -d= -f2)
  fi
  if [ -z "$ID" ] || [ "$ID" = "101" ]; then
    echo "ABORTADO: nao consegui descobrir o codigo da tela. Erro do player:"; tail -n 5 /tmp/exa_saude_id.err 2>/dev/null
    echo "Se souber o codigo (ex.: bc17), rode:  echo '{\"cliente_id\": \"bc17\"}' > ~/.exa_saude.json   e cole este comando de novo."
    exit 1
  fi
  printf '{"cliente_id": "%s"}\n' "$ID" > "$HOME/.exa_saude.json"
fi
echo "Tela: $(cat "$HOME/.exa_saude.json")"

# 1c) bloqueia o desligamento programado da 01:00 (NUC com bateria do relógio fraca não religa sozinho).
#     Reversível: sudo -n systemctl unmask poweroff.target halt.target
if sudo -n systemctl mask poweroff.target halt.target >/dev/null 2>&1; then
  echo "Desligamento das 01:00: BLOQUEADO ($(systemctl is-enabled poweroff.target 2>/dev/null))"
else
  echo "AVISO: nao consegui bloquear o desligamento das 01:00 (sudo sem permissao)"
fi
# 1d) desliga a atualização automática do Ubuntu (packagekit), que pesa no NUC e pode reiniciar coisas (igual à v6.1)
sudo -n systemctl mask packagekit.service >/dev/null 2>&1 && echo "Atualizacao automatica do Ubuntu: BLOQUEADA" || true
# 1e) atualizações automáticas do apt (unattended-upgrades) e a janela "Atualizador de Programas", que aparece por cima
#     do painel e esquenta o NUC (visto no Las Brisas ao religar: CPU 99%, 83 °C). A instalação em curso termina sozinha.
for u in apt-daily.timer apt-daily-upgrade.timer update-notifier-download.timer update-notifier-motd.timer; do
  sudo -n systemctl mask "$u" >/dev/null 2>&1 || true
done
pkill -f update-manager >/dev/null 2>&1 || true
echo "Atualizacoes automaticas do apt: $(systemctl is-enabled apt-daily-upgrade.timer 2>/dev/null)"

# 2) grava o coletor (conteúdo abaixo)
cat > "$APP/exa_saude.py.tmp" <<'EOF_PY'
# -*- coding: utf-8 -*-
"""
EXA 2.0 — Coletor de saúde do NUC ("auditoria v7", automática).

Roda a cada 15 min pelo cron do usuário (instalado por instalar_saude_no_nuc.sh), SEPARADO do player:
  - só LÊ o sistema (nada é alterado, nada é reiniciado);
  - prioridade mínima de CPU e disco (nice 19 / ionice idle) e limite total de 90 s (timeout no cron);
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
VERSAO_COLETOR = "saude-v5"
API_TELAS = "18.228.252.149"


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


def velocidade_download(estado):
    """5 MB, no máximo 1x a cada 20 h."""
    if time.time() - estado.get("ultimo_speedtest", 0) < 20 * 3600:
        return estado.get("download_mbps")
    try:
        t0 = time.time()
        req = urllib.request.Request("https://speed.cloudflare.com/__down?bytes=5000000", headers={"User-Agent": "exa-saude"})
        n = 0
        with urllib.request.urlopen(req, timeout=40) as r:
            while True:
                bloco = r.read(65536)
                if not bloco:
                    break
                n += len(bloco)
        seg = max(time.time() - t0, 0.001)
        mbps = round(n * 8 / seg / 1e6, 1)
        estado["ultimo_speedtest"] = time.time()
        estado["download_mbps"] = mbps
        return mbps
    except Exception:
        estado["ultimo_speedtest"] = time.time() - 18 * 3600  # tenta de novo em ~2 h
        return None


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


def vigia():
    """Vigia de rede (exa_vigia_rede.sh): eventos dos últimos 7 dias + estado do cabo."""
    d = {"instalado": "exa_vigia_rede.sh" in sh("crontab -l 2>/dev/null")}
    try:
        d["falhas_agora"] = int(ler(os.path.expanduser("~/.exa_vigia/falhas"), "0") or 0)
    except Exception:
        d["falhas_agora"] = 0
    linhas = ler(os.path.expanduser("~/.exa_vigia/vigia.log")).splitlines()
    limite = time.strftime("%Y-%m-%d", time.localtime(time.time() - 7 * 86400))
    rec = [l for l in linhas if l[:10] >= limite]
    d["reboots_7d"] = sum("REINICIANDO O NUC" in l for l in rec)
    d["rede_reiniciada_7d"] = sum("reiniciando a rede" in l for l in rec)
    d["sem_rede_7d"] = sum("SEM REDE" in l for l in rec)
    d["operadora_fora_7d"] = sum("operadora" in l for l in rec)
    d["eventos"] = [l[:140] for l in rec[-8:]]
    for dev in sorted(os.listdir("/sys/class/net")):
        if dev.startswith(("en", "eth")):
            b = "/sys/class/net/" + dev
            d["cabo"] = {"placa": dev, "sinal": ler(b + "/carrier") == "1", "velocidade_mbps": ler(b + "/speed") or None,
                         "driver": os.path.basename(os.path.realpath(b + "/device/driver")) if os.path.exists(b + "/device/driver") else None,
                         "erros_rx": ler(b + "/statistics/rx_errors") or None}
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
            return 200 <= r.status < 300
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
    for nome, fn in (("sistema", sistema), ("cpu", cpu), ("rede", rede), ("monitor", monitor), ("player", player), ("vigia", vigia)):
        try:
            payload[nome] = fn()
        except Exception as e:
            payload[nome] = {"erro": str(e)[:120]}
    payload["download_mbps"] = velocidade_download(estado)
    ok = enviar(payload, env_do_player())
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
EOF_PY
python3 -m py_compile "$APP/exa_saude.py.tmp" && mv "$APP/exa_saude.py.tmp" "$APP/exa_saude.py"
rm -rf "$APP/__pycache__/exa_saude"* 2>/dev/null || true

# 3) agenda a cada 15 min, com prioridade mínima e limite de 90 s (nunca roda dois ao mesmo tempo)
LINHA="*/15 * * * * cd $APP && flock -n /tmp/exa_saude.lock timeout 90 nice -n 19 ionice -c3 python3 $APP/exa_saude.py >/tmp/exa_saude.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'exa_saude.py' || true ; echo "$LINHA" ) | crontab -
if [ "$(crontab -l 2>/dev/null | grep -c exa_saude.py)" = "1" ]; then echo "Agendado a cada 15 min: OK"; else echo "ERRO: o agendamento NAO ficou gravado (crontab). Mande um print para a EXA."; fi

# 3b) vigia de rede (religa a rede/NUC sozinho se o cabo não subir — caso Foz Residence 23/10)
cat > "$APP/exa_vigia_rede.sh" <<'EOF_VIG'
#!/bin/bash
# EXA 2.0 — vigia de rede (vigia-v1). Roda pelo crontab do usuário exa a cada 5 min.
# Motivo: Foz Residence 23/10 — no boot das 02:35 a placa Realtek (r8169) não iniciou o PHY,
# o cabo nunca subiu e o NUC ficou 5 dias "ligado e mudo" até alguém apertar o botão.
# Regras:
#  - internet ok                      -> nada
#  - internet fora, gateway responde  -> problema da operadora/antena: só registra, NÃO reinicia
#  - nem o gateway responde           -> problema no NUC: 2ª falha (10 min) reinicia a rede;
#                                        4ª falha (20 min) reinicia o NUC (no máx. 1x a cada 2 h e 4x por dia,
#                                        e só se o NUC estiver ligado há mais de 20 min)
# Teste sem agir:  bash exa_vigia_rede.sh --teste
EST="$HOME/.exa_vigia"; mkdir -p "$EST"; LOG="$EST/vigia.log"
TESTE=0; [ "$1" = "--teste" ] && TESTE=1
agora=$(date +%s); up=$(cut -d. -f1 /proc/uptime)
log(){ echo "$(date '+%F %T') $*" >> "$LOG"; [ $TESTE = 1 ] && echo "$*"; tail -n 300 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"; }
GW=$(ip route 2>/dev/null | awk '/^default/{print $3; exit}')
CABO=$(cat /sys/class/net/en*/carrier 2>/dev/null | head -n1)
net_ok(){
  ping -c2 -W3 1.1.1.1 >/dev/null 2>&1 && return 0
  ping -c2 -W3 8.8.8.8 >/dev/null 2>&1 && return 0
  timeout 5 bash -c '</dev/tcp/18.228.252.149/8000' >/dev/null 2>&1 && return 0
  return 1
}
gw_ok(){ [ -n "$GW" ] && ping -c3 -W2 "$GW" >/dev/null 2>&1; }

if net_ok; then
  [ -s "$EST/falhas" ] && log "internet voltou (depois de $(cat "$EST/falhas") falha(s))"
  rm -f "$EST/falhas"; [ $TESTE = 1 ] && echo "OK: internet funcionando (gateway ${GW:-?}, cabo=${CABO:-?})"; exit 0
fi
if gw_ok; then
  log "internet FORA, mas gateway $GW responde -> operadora/antena (nao reinicio nada)"
  rm -f "$EST/falhas"; exit 0
fi
n=$(( $(cat "$EST/falhas" 2>/dev/null || echo 0) + 1 )); echo $n > "$EST/falhas"
log "SEM REDE no NUC (falha $n): gateway=${GW:-nenhum} cabo=${CABO:-?} uptime=${up}s"
[ $TESTE = 1 ] && { echo "(modo teste: nao executo nada)"; exit 0; }
if [ $n -eq 2 ] || [ $n -eq 3 ]; then
  log "reiniciando a rede (systemd-networkd)"; sudo -n systemctl restart systemd-networkd >/dev/null 2>&1
fi
if [ $n -ge 4 ] && [ "$up" -gt 1200 ]; then
  ult=$(cat "$EST/ultimo_reboot" 2>/dev/null || echo 0)
  hoje=$(date +%F); qtd=$(grep -c "^$hoje .*REINICIANDO O NUC" "$LOG" 2>/dev/null)
  if [ $((agora - ult)) -gt 7200 ] && [ "${qtd:-0}" -lt 4 ]; then
    echo "$agora" > "$EST/ultimo_reboot"; rm -f "$EST/falhas"
    log "REINICIANDO O NUC (sem rede ha ~$((n*5)) min)"; sync; sudo -n systemctl reboot
  fi
fi
EOF_VIG
chmod +x "$APP/exa_vigia_rede.sh"
LINHA_V="*/5 * * * * flock -n /tmp/exa_vigia.lock timeout 120 bash $APP/exa_vigia_rede.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'exa_vigia_rede.sh' || true ; echo "$LINHA_V" ) | crontab -
echo "Vigia de rede a cada 5 min: $( [ "$(crontab -l 2>/dev/null | grep -c exa_vigia_rede.sh)" = 1 ] && echo OK || echo ERRO )"
bash "$APP/exa_vigia_rede.sh" --teste

# 4) primeira coleta agora, para conferir
cd "$APP" && timeout 90 nice -n 19 python3 "$APP/exa_saude.py" --mostrar | tail -n 30
echo "=========== CONFERENCIA ==========="
echo "Agendamentos: coletor=$(crontab -l | grep -c exa_saude.py) vigia=$(crontab -l | grep -c exa_vigia_rede.sh)  (os dois tem que ser 1)"
echo "Desligamento 01:00: $(systemctl is-enabled poweroff.target 2>/dev/null)"
EOF_NUC
