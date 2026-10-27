# -*- coding: utf-8 -*-
"""Teste de regressao do v8 rodando sobre o v9 (roda no CloudShell em /tmp/v9test, sem rede e sem tocar em NUC)."""
import importlib
import json
import os
import sys
import time
import types

BASE = "/tmp/v9test"
os.chdir(BASE)
sys.path.insert(0, BASE)

# Stubs mínimos: sem credenciais o player usa supabase = None (comportamento real quando .env falta)
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


from db.propagandas_db import criar_tabela_propagandas, salvar_propagandas_local  # noqa: E402
import atualizadores.sistema as s  # noqa: E402

criar_tabela_propagandas()
DIA = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"][time.localtime().tm_wday]
PED = "3f4e727b-teste"
itens = [
    {"video": "Propagandas/v1.mp4", "titulo": "V1 master", "id_pedido": PED, "master": True,
     "data_ini": "2026-01-01T00:00:00", "data_fim": "2030-01-01T00:00:00", "programacao": {}},
    {"video": "Propagandas/v2.mp4", "titulo": "V2 outro dia", "id_pedido": PED, "master": False,
     "data_ini": "2026-01-01T00:00:00", "data_fim": "2030-01-01T00:00:00",
     "programacao": {("sabado" if DIA != "sabado" else "domingo"): [{"inicio": "00:00", "fim": "23:59"}]}},
    {"video": "Propagandas/p1.mp4", "titulo": "P1 hoje", "id_pedido": "outro-pedido", "master": False,
     "data_ini": "2026-01-01T00:00:00", "data_fim": "2030-01-01T00:00:00",
     "programacao": {DIA: [{"inicio": "00:00", "fim": "23:59"}]}},
    {"video": "Propagandas/venc.mp4", "titulo": "Vencido", "id_pedido": "pedido-vencido", "master": True,
     "data_ini": "2025-01-01T00:00:00", "data_fim": "2025-12-31T00:00:00", "programacao": {}},
]
salvar_propagandas_local(s.CLIENTE_ID, itens)
META = {"pasta_s3": "101_Teste", "ScreenName": "Tela Teste", "cliente_id": "101"}
arq = os.path.join(s.CACHE_DIR, "updates.json")

# 1) playlist correta
s._refresh_updates_json(supabase_meta=META)
j = json.load(open(arq, encoding="utf-8"))
titulos = [p.get("titulo") for p in j.get("PlaylistPronta", [])]
ok(sorted(titulos) == ["P1 hoje", "V1 master"], "1. playlist = V1 (master) + P1 (programado hoje); vencido fora: %s" % titulos)
origens = {x["titulo"]: x["origem"] for x in s._ULTIMA_PLAYLIST}
ok(origens.get("V1 master") == "Master" and origens.get("P1") is None and origens.get("P1 hoje") == "Programado",
   "1b. resumo para confirmação registra a origem: %s" % origens)
ok(j.get("ScreenName") == "Tela Teste", "1c. nome da tela mantido")

# 2) não regrava sem mudança
m1 = os.path.getmtime(arq)
time.sleep(1.2)
s._refresh_updates_json(parcial=False, so_se_mudou=True)
ok(os.path.getmtime(arq) == m1, "2. refresh de 60s sem mudança NÃO regrava o arquivo da tela")

# 3) regrava quando muda
itens[2]["programacao"] = {}
salvar_propagandas_local(s.CLIENTE_ID, itens)
s._refresh_updates_json(parcial=False, so_se_mudou=True)
j = json.load(open(arq, encoding="utf-8"))
ok(os.path.getmtime(arq) > m1 and "P1 hoje" in [p.get("titulo") for p in j["PlaylistPronta"]],
   "3. mudança real é gravada (P1 sem programação vira fallback do próprio pedido)")

# 4) reinício offline: módulo recarregado não tem meta em memória -> lê do disco
s = importlib.reload(s)
s._refresh_updates_json(parcial=False, so_se_mudou=True)
j = json.load(open(arq, encoding="utf-8"))
ok(j.get("ScreenName") == "Tela Teste" and j.get("pasta_s3") == "101_Teste", "4. reinício sem internet preserva nome/pasta da tela")

# 5) sem internet: sincronização falha sem derrubar nada
try:
    s.verificar_atualizacao_servidor()
    ok(True, "5. sincronização sem servidor não derruba o player")
except Exception as e:  # pragma: no cover
    ok(False, "5. sincronização sem servidor levantou exceção: %s" % e)

# 6) confirmação bem formada
capturado = {}


class FakeRPC:
    def __init__(self, nome, args):
        capturado["nome"], capturado["args"] = nome, args

    def execute(self):
        return None


class FakeSupa:
    def rpc(self, nome, args):
        return FakeRPC(nome, args)


s.supabase = FakeSupa()
s._checar_relogio = lambda: 0
s.registrar_heartbeat(7, [], sync_ok=True)
p = capturado.get("args", {}).get("p", {})
ok(capturado.get("nome") == "telas_registrar_heartbeat" and p.get("manifest_versao") == 7 and p.get("arquivos_faltando") == 0
   and p.get("app_versao") == "exa2-v9" and isinstance(p.get("playlist"), list), "6. confirmação enviada com versão, faltando=0 e playlist")
json.dumps(p)
ok(True, "6b. confirmação é JSON válido")

print("\nRESULTADO: %s" % ("TODOS OS TESTES PASSARAM" if not falhas else "%d FALHA(S)" % len(falhas)))
