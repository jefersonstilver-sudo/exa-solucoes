# -*- coding: utf-8 -*-
"""Teste isolado do player v9 (roda no CloudShell em /tmp/v9test, sem rede e sem tocar em NUC).
Relógio simulado: 5 min de espera rodam em milissegundos."""
import os
import sys
import time
import types

BASE = "/tmp/v9test"
os.chdir(BASE)
sys.path.insert(0, BASE)

dotenv = types.ModuleType("dotenv")
dotenv.load_dotenv = lambda *a, **k: None
sys.modules["dotenv"] = dotenv
supa = types.ModuleType("supabase")
supa.create_client = lambda *a, **k: None
supa.Client = object
sys.modules["supabase"] = supa

falhas = []


def ok(cond, msg):
    print(("PASSOU  " if cond else "FALHOU  ") + msg)
    if not cond:
        falhas.append(msg)


import atualizadores.sistema as s  # noqa: E402

ok(s.APP_VERSAO == "exa2-v9", "0. versão do app = exa2-v9")

# ---------------- relógio e servidor falsos ----------------
relogio = {"t": 1000.0}
s._agora = lambda: relogio["t"]
s._dormir = lambda seg: relogio.__setitem__("t", relogio["t"] + seg)
s._refresh_updates_json = lambda **k: None
syncs = []


def falso_sync(callback=None):
    syncs.append(relogio["t"])
    s._ULTIMO_SYNC_COMPLETO = relogio["t"]
    s._VERSAO_APLICADA = servidor["versao"]


s.verificar_atualizacao_servidor = falso_sync
servidor = {"versao": 10, "intervalo": None, "erro": False, "trava": False, "consultas": 0}


class Q:
    def __init__(self, campos):
        self.campos = campos

    def select(self, campos):
        return Q(campos)

    def eq(self, *a):
        return self

    def limit(self, *a):
        return self

    def execute(self):
        servidor["consultas"] += 1
        if servidor["trava"]:
            time.sleep(3)  # simula rede pendurada (o teste usa limite de 0.2 s)
        if servidor["erro"]:
            raise RuntimeError("rede caiu")
        d = {"manifest_versao": servidor["versao"]}
        if "sync_intervalo_seg" in self.campos:
            d["sync_intervalo_seg"] = servidor["intervalo"]
        return types.SimpleNamespace(data=[d])


class FakeSupa:
    def table(self, nome):
        return Q("")


s.supabase = FakeSupa()
s._TIMEOUT_LEVE = 0.2

# 1) sem mudança: não sincroniza; faz várias consultas leves em 5 min
s._VERSAO_APLICADA = 10
s._ULTIMO_SYNC_COMPLETO = relogio["t"]
s.esperar_proximo_ciclo(300)
ok(syncs == [], "1. sem mudança no servidor: nenhuma sincronização pesada")
ok(8 <= servidor["consultas"] <= 16, "1b. consultas leves em 5 min: %d (esperado ~13)" % servidor["consultas"])
ok(relogio["t"] - 1000 >= 300, "1c. espera respeita os 5 min do ciclo")

# 2) mudança detectada: sincroniza uma vez, rápido
syncs.clear(); servidor["consultas"] = 0
s._ULTIMO_SYNC_COMPLETO = relogio["t"] - 120
t0 = relogio["t"]
servidor["versao"] = 11
s.esperar_proximo_ciclo(300)
ok(len(syncs) == 1, "2. mudança de versão -> exatamente 1 sincronização (%d)" % len(syncs))
ok(syncs and syncs[0] - t0 <= 45, "2b. sincronizou em %ss após o início da espera" % (syncs[0] - t0 if syncs else None))

# 3) várias mudanças seguidas: no máx. 1 sincronização pesada por minuto
syncs.clear()
s._ULTIMO_SYNC_COMPLETO = relogio["t"]
orig = Q.execute


def muda_sempre(self):
    servidor["versao"] += 1
    return orig(self)


Q.execute = muda_sempre
s.esperar_proximo_ciclo(300)
Q.execute = orig
gaps = [b - a for a, b in zip(syncs, syncs[1:])]
ok(len(syncs) <= 5 and all(g >= 60 for g in gaps), "3. mudanças a cada consulta -> %d syncs, intervalos %s (>= 60 s)" % (len(syncs), gaps))

# 4) servidor pede para desligar (0): volta ao comportamento do v8
syncs.clear(); servidor["intervalo"] = 0; servidor["versao"] += 5
s._ULTIMO_SYNC_COMPLETO = relogio["t"] - 999
s.esperar_proximo_ciclo(300)
ok(syncs == [], "4. sync_intervalo_seg = 0 -> nenhuma sincronização fora do ciclo de 5 min")
servidor["intervalo"] = None

# 5) rede caindo: modo seguro após 3 erros, sem exceção
syncs.clear(); servidor["erro"] = True; servidor["consultas"] = 0
try:
    s.esperar_proximo_ciclo(300)
    ok(True, "5. rede caída não derruba o atualizador")
except Exception as e:
    ok(False, "5. rede caída levantou exceção: %s" % e)
ok(servidor["consultas"] <= 4, "5b. modo seguro: só %d tentativas em 5 min (pausa de 15 min após 3 erros)" % servidor["consultas"])
servidor["erro"] = False

# 6) rede pendurada: a consulta desiste no limite e o laço segue
servidor["trava"] = True
inicio_real = time.time()
try:
    s._consultar_versao_leve()
    ok(False, "6. consulta pendurada deveria estourar o limite")
except Exception as e:
    ok("passou de" in str(e) and time.time() - inicio_real < 2, "6. consulta pendurada desiste em %.1fs: %s" % (time.time() - inicio_real, e))
servidor["trava"] = False

# 7) download interrompido não deixa arquivo pela metade; download completo vira arquivo final
import requests  # noqa: E402

alvo = os.path.join(BASE, "cache", "Propagandas", "teste.mp4")
if os.path.exists(alvo):
    os.remove(alvo)


class Resp:
    def __init__(self, partes, tamanho, quebra=False):
        self.status_code = 200
        self.headers = {"Content-Length": str(tamanho)}
        self.partes, self.quebra = partes, quebra

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False

    def iter_content(self, n):
        for i, p in enumerate(self.partes):
            if self.quebra and i == 1:
                raise ConnectionError("internet caiu no meio")
            yield p


s.time.sleep = lambda *_: None
requests.get = lambda *a, **k: Resp([b"a" * 10, b"b" * 10], 20, quebra=True)
r1 = s.baixar_arquivo("http://x/teste.mp4", alvo, tentativas=2)
ok(not r1 and not os.path.exists(alvo) and not os.path.exists(alvo + ".part"), "7. queda no meio do download: nenhum arquivo pela metade")
requests.get = lambda *a, **k: Resp([b"a" * 10, b"b" * 5], 20)
r2 = s.baixar_arquivo("http://x/teste.mp4", alvo, tentativas=1)
ok(not r2 and not os.path.exists(alvo), "7b. tamanho diferente do anunciado: recusado")
requests.get = lambda *a, **k: Resp([b"a" * 10, b"b" * 10], 20)
r3 = s.baixar_arquivo("http://x/teste.mp4", alvo, tentativas=1)
ok(r3 and os.path.getsize(alvo) == 20 and not os.path.exists(alvo + ".part"), "7c. download completo vira o arquivo final")

# 8) atualizador.py compila e tem a queda segura para o v8
src = open(os.path.join(BASE, "atualizador.py"), encoding="utf-8").read()
compile(src, "atualizador.py", "exec")
ok("sistema.esperar_proximo_ciclo(tempo_espera)" in src and "seguindo como v8" in src, "8. atualizador usa a espera v9 e cai no v8 se ela falhar")

print("\nRESULTADO: %s" % ("TODOS OS TESTES PASSARAM" if not falhas else "%d FALHA(S)" % len(falhas)))
