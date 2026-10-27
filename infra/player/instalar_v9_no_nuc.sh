bash <<'EOF_NUC'
cd ~/Documentos/appUbuntu || { echo "ABORTADO: pasta do app nao encontrada"; exit 1; }
if grep -q 'APP_VERSAO = "exa2-v9"' atualizadores/sistema.py; then echo "JA ESTA NO v9 - nada a fazer"; exit 0; fi
grep -q 'APP_VERSAO = "exa2-v8"' atualizadores/sistema.py || { echo "ABORTADO: este NUC nao esta no v8 - nada foi alterado"; exit 1; }
BK=~/Documentos/appUbuntu/backup_v8_$(date +%Y%m%d_%H%M%S) && mkdir -p "$BK/atualizadores" && cp atualizador.py "$BK/" && cp atualizadores/sistema.py "$BK/atualizadores/" && echo "COPIA DE SEGURANCA: $BK"
python3 - <<'PYV9'
import os, sys
APP = os.path.expanduser("~/Documentos/appUbuntu")
SRC = DST = APP

def ler(rel):
    with open(os.path.join(SRC, rel), encoding="utf-8") as f:
        return f.read()

def trocar(txt, antigo, novo, nome):
    n = txt.count(antigo)
    if n == 1:
        return txt.replace(antigo, novo)
    print("ABORTADO: trecho '%s' encontrado %d vezes (esperado 1). Nada foi alterado." % (nome, n))
    sys.exit(1)

# ------------------------------------------------------------------ sistema.py
s0 = ler("atualizadores/sistema.py")
s = s0

s = trocar(s, "import hashlib\nimport subprocess\n",
           "import hashlib\nimport subprocess\nimport random\nimport threading\n", "imports")

s = trocar(s, 'APP_VERSAO = "exa2-v8"\n',
           'APP_VERSAO = "exa2-v9"\n'
           '_VERSAO_APLICADA = None       # v9: versão do manifesto já sincronizada nesta execução\n'
           '_ULTIMO_SYNC_COMPLETO = 0.0   # v9: horário da última sincronização completa\n'
           '_agora = time.time            # v9: injetáveis para teste\n'
           '_dormir = time.sleep\n'
           '_TIMEOUT_LEVE = 10\n',
           "versao_app")

s = trocar(s,
    'def baixar_arquivo(url, destino, tentativas=3):\n'
    '    """Download robusto com retentativas."""\n'
    '    for tentativa in range(1, tentativas + 1):\n'
    '        try:\n'
    '            with requests.get(url, stream=True, timeout=20) as r:\n'
    '                if r.status_code == 200:\n'
    '                    os.makedirs(os.path.dirname(destino), exist_ok=True)\n'
    '                    with open(destino, "wb") as f:\n'
    '                        for chunk in r.iter_content(1024 * 1024):\n'
    '                            if chunk:\n'
    '                                f.write(chunk)\n'
    '                    return True\n'
    '        except Exception:\n'
    '            time.sleep(2)\n'
    '    return False\n',
    'def baixar_arquivo(url, destino, tentativas=3):\n'
    '    """Download robusto com retentativas. v9: grava em .part e só troca pelo final quando completo."""\n'
    '    parcial = destino + ".part"\n'
    '    for tentativa in range(1, tentativas + 1):\n'
    '        try:\n'
    '            with requests.get(url, stream=True, timeout=20) as r:\n'
    '                if r.status_code == 200:\n'
    '                    os.makedirs(os.path.dirname(destino), exist_ok=True)\n'
    '                    esperado = int(r.headers.get("Content-Length") or 0)\n'
    '                    recebido = 0\n'
    '                    with open(parcial, "wb") as f:\n'
    '                        for chunk in r.iter_content(1024 * 1024):\n'
    '                            if chunk:\n'
    '                                f.write(chunk)\n'
    '                                recebido += len(chunk)\n'
    '                        f.flush()\n'
    '                        os.fsync(f.fileno())\n'
    '                    if recebido == 0 or (esperado and recebido != esperado):\n'
    '                        raise IOError("download incompleto: %d de %d bytes" % (recebido, esperado))\n'
    '                    os.replace(parcial, destino)\n'
    '                    return True\n'
    '        except Exception:\n'
    '            time.sleep(2)\n'
    '        finally:\n'
    '            try:\n'
    '                if os.path.exists(parcial):\n'
    '                    os.remove(parcial)\n'
    '            except Exception:\n'
    '                pass\n'
    '    return False\n',
    "download_parcial")

NOVAS = '''
# --- EXA 2.0 v9: verificação leve de mudanças (atualizador; o player da tela não é tocado) ---
def _consultar_versao_leve():
    """Lê só manifest_versao (e o ritmo pedido pelo servidor). Limite de _TIMEOUT_LEVE s; nunca fica pendurado."""
    if supabase is None:
        raise RuntimeError("sem conexao com o servidor")
    res = {}

    def _q():
        try:
            try:
                r = supabase.table("updates_clientes").select("manifest_versao,sync_intervalo_seg")\\
                    .eq("cliente_id", CLIENTE_ID).limit(1).execute()
            except Exception as e1:
                if "sync_intervalo_seg" not in str(e1):
                    raise
                r = supabase.table("updates_clientes").select("manifest_versao")\\
                    .eq("cliente_id", CLIENTE_ID).limit(1).execute()
            res["d"] = (r.data or [None])[0]
        except Exception as e:
            res["e"] = str(e)

    t = threading.Thread(target=_q, daemon=True)
    t.start()
    t.join(_TIMEOUT_LEVE)
    if t.is_alive():
        raise TimeoutError("consulta leve passou de %ss" % _TIMEOUT_LEVE)
    if "e" in res:
        raise RuntimeError(res["e"])
    return res.get("d") or {}


def esperar_proximo_ciclo(tempo_espera):
    """v9: espera o próximo ciclo completo, mas sincroniza na hora quando o manifesto muda.
    - verificação leve a cada ~20 s (ou o que o servidor mandar em sync_intervalo_seg; 0 = desligado)
    - no máximo 1 sincronização completa por minuto
    - 3 erros seguidos -> pausa de 15 min (comportamento igual ao v8)
    - refresh local da playlist a cada 60 s (igual ao v8)"""
    global _ULTIMO_SYNC_COMPLETO
    inicio = _agora()
    ultimo_local = inicio
    intervalo = 20
    erros = 0
    pausa_ate = 0.0
    try:
        defasagem = int(hashlib.md5(str(CLIENTE_ID).encode()).hexdigest(), 16) % 15
    except Exception:
        defasagem = 0
    proxima_leve = inicio + defasagem + intervalo
    while _agora() - inicio < tempo_espera:
        _dormir(5)
        agora = _agora()
        if agora - ultimo_local >= 60:
            ultimo_local = agora
            try:
                _refresh_updates_json(parcial=False, so_se_mudou=True)
            except Exception as e:
                print(f"Refresh local falhou: {e}")
        if agora < proxima_leve or agora < pausa_ate:
            continue
        try:
            d = _consultar_versao_leve()
            erros = 0
            pedido = d.get("sync_intervalo_seg")
            if pedido is None:
                intervalo = 20
            else:
                intervalo = int(pedido)
                if intervalo > 0:
                    intervalo = max(10, min(300, intervalo))
            v = d.get("manifest_versao")
            if intervalo > 0 and v is not None and _VERSAO_APLICADA is not None and v != _VERSAO_APLICADA \\
                    and agora - _ULTIMO_SYNC_COMPLETO >= 60:
                print(f"Mudanca detectada (versao {_VERSAO_APLICADA} -> {v}). Sincronizando agora...")
                verificar_atualizacao_servidor()
        except Exception as e:
            erros += 1
            print(f"Verificacao leve falhou ({erros}/3): {e}")
            if erros >= 3:
                erros = 0
                pausa_ate = agora + 900
                print("Modo seguro: verificacao leve pausada por 15 min (ciclo de 5 min continua).")
        espera = intervalo if intervalo > 0 else 60
        proxima_leve = _agora() + espera + random.uniform(0, 3)


'''

s = trocar(s,
    'def verificar_atualizacao_servidor(callback=None):\n'
    '    """Sincroniza o SQLite local com o Supabase e baixa arquivos novos."""\n'
    '    try:\n',
    NOVAS.lstrip("\n") +
    'def verificar_atualizacao_servidor(callback=None):\n'
    '    """Sincroniza o SQLite local com o Supabase e baixa arquivos novos."""\n'
    '    global _VERSAO_APLICADA, _ULTIMO_SYNC_COMPLETO\n'
    '    _ULTIMO_SYNC_COMPLETO = _agora()\n'
    '    try:\n',
    "inicio_sync")

s = trocar(s,
    '        registrar_heartbeat(versao_remota, faltando_final, sync_ok=True)\n',
    '        registrar_heartbeat(versao_remota, faltando_final, sync_ok=True)\n'
    '        _VERSAO_APLICADA = versao_remota  # v9: base da verificação leve\n',
    "versao_aplicada")

# ------------------------------------------------------------------ atualizador.py
a0 = ler("atualizador.py")
a = trocar(a0,
    '            inicio_espera = time.time()\n'
    '            while time.time() - inicio_espera < tempo_espera:\n'
    '                time.sleep(60)\n',
    '            inicio_espera = time.time()\n'
    '            # EXA 2.0 v9: espera inteligente (sincroniza na hora quando o servidor muda); se falhar, segue o v8\n'
    '            try:\n'
    '                sistema.esperar_proximo_ciclo(tempo_espera)\n'
    '            except Exception as e:\n'
    '                print(f"Espera v9 falhou, seguindo como v8: {e}")\n'
    '            while time.time() - inicio_espera < tempo_espera:\n'
    '                time.sleep(60)\n',
    "laco_v9")

# grava primeiro em .v9tmp, confere sintaxe dos dois e so entao troca (troca atomica)
novos = (("atualizadores/sistema.py", s), ("atualizador.py", a))
for rel, novo in novos:
    compile(novo, rel, "exec")
for rel, novo in novos:
    tmp = os.path.join(DST, rel) + ".v9tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(novo)
for rel, novo in novos:
    os.replace(os.path.join(DST, rel) + ".v9tmp", os.path.join(DST, rel))
print("OK_V9_APLICADO")
PYV9
grep -q 'APP_VERSAO = "exa2-v9"' atualizadores/sistema.py && echo "ARQUIVOS NO v9. Ativando (a tela recarrega uma vez, ~30 s)..." && pkill -f "atualizador.py"; sleep 20; pgrep -af "atualizador.py|main.py" | grep -v pgrep
EOF_NUC
