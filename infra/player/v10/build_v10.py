# -*- coding: utf-8 -*-
"""Monta o player v10 a partir do v9 (base_v9/) + padrão EXA. Uso: python3 build_v10.py  -> dist/ e exa2_player_v10.zip"""
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
s = trocar(ler(os.path.join(AQUI, "base_v9/atualizadores/sistema.py")), 'APP_VERSAO = "exa2-v9"', 'APP_VERSAO = "exa2-v10"', "versao")
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
z = os.path.join(AQUI, "exa2_player_v10.zip")
with zipfile.ZipFile(z, "w", zipfile.ZIP_DEFLATED) as zf:
    zf.writestr("atualizadores/", "")
    for rel in arqs:
        zf.write(os.path.join(AQUI, "dist", rel), rel)
print("OK_V10", os.path.getsize(z), "bytes")
