# -*- coding: utf-8 -*-
"""
EXA 2.0 — player v10: o próprio player garante o "padrão EXA" no NUC (sem terminal, via OTA).

Roda em segundo plano dentro do atualizador (thread daemon), 60 s depois de iniciar e depois a cada 6 h:
  1. ~/.exa_saude.json com o código da tela (tela_id do player)
  2. coletor de saúde (exa_saude.py) e vigia de rede (exa_vigia_rede.sh) — regrava só se mudou
  3. bloqueios: desligamento programado (poweroff/halt), packagekit e atualizações automáticas do apt
  4. agendamentos no crontab do usuário (coletor a cada 15 min, vigia a cada 5 min), preservando as outras linhas
  5. primeira leitura do coletor logo após instalar/atualizar
  6. registra o resultado em ~/.exa_padrao.json (o coletor envia isso ao sistema)
Nunca levanta exceção para fora, nunca para nem reinicia o player.
"""
import fcntl
import json
import os
import subprocess
import threading
import time

VERSAO = "padrao-v5"
APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOME = os.path.expanduser("~")
ESTADO = os.path.join(HOME, ".exa_padrao.json")
CONF_SAUDE = os.path.join(HOME, ".exa_saude.json")
BLOQUEAR = ["poweroff.target", "halt.target", "packagekit.service", "apt-daily.timer",
            "apt-daily-upgrade.timer", "update-notifier-download.timer", "update-notifier-motd.timer"]

COLETOR = __COLETOR__

VIGIA = __VIGIA__

_iniciado = False
_CARREGADO_EM = time.time()  # v11.1: o sistema recarrega a peça quando o arquivo no disco é mais novo


def _sh(args, entrada=None, timeout=30):
    try:
        r = subprocess.run(args, input=entrada, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout or "") + (r.stderr or "")
    except Exception as e:
        return 99, str(e)


def _gravar_se_diferente(caminho, conteudo, executavel=False):
    try:
        with open(caminho, encoding="utf-8") as f:
            if f.read() == conteudo:
                return "igual"
    except Exception:
        pass
    if caminho.endswith(".py"):
        compile(conteudo, caminho, "exec")  # nunca grava um coletor quebrado
    tmp = caminho + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(conteudo)
        f.flush()
        os.fsync(f.fileno())
    if executavel:
        os.chmod(tmp, 0o755)
    os.replace(tmp, caminho)
    return "gravado"


def _linhas_cron():
    coletor = os.path.join(APP, "exa_saude.py")
    vigia = os.path.join(APP, "exa_vigia_rede.sh")
    return {
        "exa_saude.py": "*/15 * * * * cd %s && flock -n /tmp/exa_saude.lock timeout 150 nice -n 19 ionice -c3 python3 %s >/tmp/exa_saude.log 2>&1" % (APP, coletor),
        "exa_vigia_rede.sh": "* * * * * flock -n /tmp/exa_vigia.lock timeout 50 bash %s >/dev/null 2>&1" % vigia,
    }


def _garantir_crontab():
    rc, saida = _sh(["crontab", "-l"])
    atuais = [l for l in saida.splitlines() if l.strip()] if rc == 0 else []
    queremos = _linhas_cron()
    novas = [l for l in atuais if not any(k in l for k in queremos)] + list(queremos.values())
    if novas == atuais:
        return "ok"
    rc, saida = _sh(["crontab", "-"], entrada="\n".join(novas) + "\n")
    if rc != 0:
        raise RuntimeError("crontab: " + saida.strip()[:120])
    rc, conf = _sh(["crontab", "-l"])
    falta = [k for k in queremos if k not in conf]
    if falta:
        raise RuntimeError("crontab nao gravou: " + ",".join(falta))
    return "gravado"


def _garantir_bloqueios():
    pendentes = []
    for u in BLOQUEAR:
        rc, est = _sh(["systemctl", "is-enabled", u], timeout=10)
        est = est.strip()
        if est == "masked" or "not-found" in est or "No such file" in est:
            continue
        rc, _ = _sh(["sudo", "-n", "systemctl", "mask", u], timeout=20)
        if rc != 0:
            pendentes.append(u)
    _sh(["pkill", "-f", "update-manager"], timeout=5)
    if pendentes:
        raise RuntimeError("sem permissao para bloquear: " + ",".join(pendentes))
    return "ok"


def garantir(cliente_id):
    # main.py e atualizador.py carregam o sistema; só um processo por vez faz o trabalho
    try:
        trava = open("/tmp/exa_padrao.lock", "w")
        fcntl.flock(trava, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except Exception:
        return {"ok": None, "pulado": "outro processo esta garantindo o padrao agora"}
    try:
        return _garantir(cliente_id)
    finally:
        try:
            fcntl.flock(trava, fcntl.LOCK_UN)
            trava.close()
        except Exception:
            pass


def _garantir(cliente_id):
    itens, erros = {}, {}
    cid = str(cliente_id or "").strip()
    if not cid or cid == "101":
        erros["tela"] = "codigo da tela desconhecido (%r)" % cid
    else:
        try:
            atual = {}
            try:
                with open(CONF_SAUDE, encoding="utf-8") as f:
                    atual = json.load(f)
            except Exception:
                pass
            if atual.get("cliente_id") != cid:
                atual["cliente_id"] = cid
                _gravar_se_diferente(CONF_SAUDE, json.dumps(atual))
            itens["tela"] = cid
        except Exception as e:
            erros["tela"] = str(e)[:150]
    mudou_coletor = False
    for nome, conteudo, exe in (("exa_saude.py", COLETOR, False), ("exa_vigia_rede.sh", VIGIA, True)):
        try:
            r = _gravar_se_diferente(os.path.join(APP, nome), conteudo, exe)
            itens[nome] = r
            if nome == "exa_saude.py" and r == "gravado":
                mudou_coletor = True
        except Exception as e:
            erros[nome] = str(e)[:150]
    for nome, fn in (("bloqueios", _garantir_bloqueios), ("agendamentos", _garantir_crontab)):
        try:
            itens[nome] = fn()
        except Exception as e:
            erros[nome] = str(e)[:150]
    anterior = {}
    try:
        with open(ESTADO, encoding="utf-8") as f:
            anterior = json.load(f)
    except Exception:
        pass
    estado = {"versao": VERSAO, "quando": time.strftime("%Y-%m-%d %H:%M:%S"), "ok": not erros,
              "itens": itens, "erros": erros, "primeira_leitura": anterior.get("primeira_leitura")}
    if "tela" in itens and (mudou_coletor or anterior.get("versao") != VERSAO):
        try:  # primeira leitura agora, para o sistema ver o NUC sem esperar 15 min
            subprocess.Popen(["nice", "-n", "19", "timeout", "150", "python3", os.path.join(APP, "exa_saude.py")],
                             cwd=APP, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
            estado["primeira_leitura"] = estado["quando"]
        except Exception as e:
            erros["primeira_leitura"] = str(e)[:150]
    try:
        _gravar_se_diferente(ESTADO, json.dumps(estado, ensure_ascii=False))
    except Exception:
        pass
    return estado


def _laco(cliente_id, atraso, intervalo):
    time.sleep(atraso)
    while True:
        try:
            e = garantir(cliente_id)
            print("Padrao EXA %s: %s" % (VERSAO, "OK" if e.get("ok") else "PENDENTE %s" % e.get("erros")))
        except Exception as ex:
            print("Padrao EXA falhou: %s" % ex)
        time.sleep(intervalo)


def iniciar(cliente_id, atraso=60, intervalo=6 * 3600):
    global _iniciado
    if _iniciado:
        return
    _iniciado = True
    threading.Thread(target=_laco, args=(cliente_id, atraso, intervalo), daemon=True).start()
