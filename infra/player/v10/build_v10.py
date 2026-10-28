# -*- coding: utf-8 -*-
"""Monta o player v10 a partir do v9 (base_v9/) + padrão EXA. Uso: python3 build_v10.py  -> dist/ e exa2_player_v11.zip"""
import os, sys, zipfile
AQUI = os.path.dirname(os.path.abspath(__file__))
P = os.path.dirname(AQUI)
def ler(c): return open(c, encoding="utf-8").read()
def trocar(t, a, n, nome):
    if t.count(a) != 1:
        sys.exit("ABORTADO: trecho %s aparece %d vezes" % (nome, t.count(a)))
    return t.replace(a, n)
pad = ler(os.path.join(AQUI, "padrao_exa_modelo.py"))
pad = trocar(pad, "COLETOR = __COLETOR__", "COLETOR = " + repr(ler(os.path.join(P, "exa_saude.py"))), "coletor")
pad = trocar(pad, "VIGIA = __VIGIA__", "VIGIA = " + repr(ler(os.path.join(P, "exa_vigia_rede.sh"))), "vigia")
s = trocar(ler(os.path.join(AQUI, "base_v9/atualizadores/sistema.py")), 'APP_VERSAO = "exa2-v9"', 'APP_VERSAO = "exa2-v11"', "versao")
# v10.1: o atualizador antigo NÃO reinicia depois do OTA (recarrega o módulo sistema), então o gancho também fica no sistema
s = trocar(s,
    "    global _VERSAO_APLICADA, _ULTIMO_SYNC_COMPLETO\n    _ULTIMO_SYNC_COMPLETO = _agora()\n",
    "    global _VERSAO_APLICADA, _ULTIMO_SYNC_COMPLETO\n    _ULTIMO_SYNC_COMPLETO = _agora()\n"
    "    _iniciar_padrao_exa()\n", "gancho_sistema")
s = trocar(s,
    "def verificar_atualizacao_servidor(callback=None):\n",
    "def _iniciar_padrao_exa():\n"
    "    \"\"\"EXA 2.0 v10: garante o padrão EXA (coletor, vigia, bloqueios) em segundo plano. Nunca derruba o player.\"\"\"\n"
    "    try:\n"
    "        try:\n"
    "            from . import padrao_exa\n"
    "        except ImportError:\n"
    "            import padrao_exa\n"
    "        padrao_exa.iniciar(CLIENTE_ID, atraso=20)\n"
    "    except Exception as e:\n"
    "        print(f\"Padrao EXA nao iniciado: {e}\")\n\n\n"
    "def verificar_atualizacao_servidor(callback=None):\n", "funcao_gancho")
# v11: resultado do padrão EXA vai junto na confirmação do player (falha de instalação nunca fica invisível)
s = trocar(s, '            "erro": (erro or "")[:300],\n', '            "erro": (erro or _padrao_resumo())[:300],\n', "heartbeat_padrao")
s = trocar(s, "def registrar_heartbeat(versao, faltando, sync_ok=True, erro=None):\n",
    "def _padrao_resumo():\n"
    "    \"\"\"v11: texto curto só quando o padrão EXA tem pendência (vazio = tudo ok).\"\"\"\n"
    "    try:\n"
    "        with open(os.path.expanduser('~/.exa_padrao.json'), encoding='utf-8') as f:\n"
    "            e = json.load(f)\n"
    "        if e.get('ok') is False:\n"
    "            return 'padrao EXA pendente: ' + json.dumps(e.get('erros'), ensure_ascii=False)\n"
    "    except Exception:\n"
    "        pass\n"
    "    return ''\n\n\n"
    "def registrar_heartbeat(versao, faltando, sync_ok=True, erro=None):\n", "funcao_resumo")
a = trocar(ler(os.path.join(AQUI, "base_v9/atualizador.py")),
    "    atexit.register(limpar_lockfile)\n",
    "    atexit.register(limpar_lockfile)\n\n"
    "    # EXA 2.0 v10: garante o padrão EXA (coletor, vigia de rede, bloqueios) em segundo plano; nunca derruba o player\n"
    "    try:\n"
    "        from atualizadores import padrao_exa\n"
    "        padrao_exa.iniciar(sistema.CLIENTE_ID)\n"
    "    except Exception as e:\n"
    "        print(f\"⚠️ Padrão EXA não iniciado: {e}\")\n", "gancho")
arqs = {"atualizador.py": a, "atualizadores/sistema.py": s, "atualizadores/padrao_exa.py": pad}
for rel, txt in arqs.items():
    compile(txt, rel, "exec")
    d = os.path.join(AQUI, "dist", rel); os.makedirs(os.path.dirname(d), exist_ok=True)
    open(d, "w", encoding="utf-8").write(txt)
z = os.path.join(AQUI, "exa2_player_v11.zip")
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("atualizadores/", "")
    for rel in arqs:
        zf.write(os.path.join(AQUI, "dist", rel), rel)
print("OK_V10", os.path.getsize(z), "bytes")
