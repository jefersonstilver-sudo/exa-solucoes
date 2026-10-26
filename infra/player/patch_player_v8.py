# -*- coding: utf-8 -*-
"""
EXA 2.0 — Remendo do player dos NUCs (v7 -> v8 "exa2").

Roda no CloudShell sobre a cópia original do pacote global (TelasV.2.0 extraído em ~/ui/t)
e gera ~/exa2/v8/ com os arquivos alterados + um diff para revisão.

Cada substituição exige que o trecho original apareça EXATAMENTE 1 vez; se não, aborta sem gerar nada.

O que muda:
  1. Confirmação real: a tela informa (heartbeat) a VERSÃO do manifesto que aplicou, arquivos faltando,
     a playlist que está tocando e o desvio do relógio. Só confirma quando nenhum arquivo falta.
  2. Playlist recalculada a cada 60s (antes: 5 min) — troca de horário na hora certa.
  3. Sem internet a playlist continua andando com o horário (antes: congelava).
  4. O arquivo da tela só é regravado quando a playlist muda (sem reinício de vídeo à toa).
  5. Relógio desviado > 2 min: pede ressincronização (sudo -n systemctl, já liberado no NUC) no máx. 1x/h.
NÃO muda: regras de escolha (programação > master > fallback), desempate, datas, mesclagem 1 plus : 3 normais.
"""
import difflib
import os
import sys

SRC = os.path.expanduser("~/ui/t")
DST = os.path.expanduser("~/exa2/v8")


def ler(rel):
    with open(os.path.join(SRC, rel), encoding="utf-8") as f:
        return f.read()


def trocar(txt, antigo, novo, nome):
    n = txt.count(antigo)
    if n == 1:
        return txt.replace(antigo, novo)
    print("ABORTADO: trecho '%s' encontrado %d vezes (esperado 1)" % (nome, n))
    sys.exit(1)


# ------------------------------------------------------------------ sistema.py
s0 = ler("atualizadores/sistema.py")
s = s0

s = trocar(s,
    "from datetime import datetime\n",
    "from datetime import datetime\nimport hashlib\nimport subprocess\n",
    "imports")

s = trocar(s,
    'CLIENTE_ID = str(config["tela_id"]) if config else "101"\n',
    'CLIENTE_ID = str(config["tela_id"]) if config else "101"\n'
    '\n'
    '# --- EXA 2.0: estado para confirmação de entrega ---\n'
    'APP_VERSAO = "exa2-v8"\n'
    '_ULTIMO_META = None\n'
    '_ULTIMA_PLAYLIST = []\n'
    '_ULTIMA_ASSINATURA = None\n'
    '_ULTIMO_AJUSTE_RELOGIO = 0\n',
    "globais")

s = trocar(s,
    '    """Gera a fila final de vídeos filtrada e ordenada (3 normais : 1 plus)."""\n',
    '    """Gera a fila final de vídeos filtrada e ordenada (3 normais : 1 plus)."""\n'
    '    global _ULTIMA_PLAYLIST\n'
    '    resumo = []\n',
    "inicio_gerar_playlist")

s = trocar(s,
    '            print(f"  ✅ {titulo} ({tipo}) [{origem}]")\n',
    '            print(f"  ✅ {titulo} ({tipo}) [{origem}]")\n'
    '            resumo.append({"titulo": titulo, "id_pedido": str(p.get("id_pedido") or ""), "origem": origem.split(" ")[0]})\n',
    "resumo_playlist")

s = trocar(s,
    '    # Separação por categoria para a mesclagem\n',
    '    _ULTIMA_PLAYLIST = resumo\n'
    '\n'
    '    # Separação por categoria para a mesclagem\n',
    "guardar_playlist")

s = trocar(s,
    'def _refresh_updates_json(parcial=False, supabase_meta=None):\n',
    'def _meta_do_disco():\n'
    '    """EXA 2.0: recupera pasta_s3/ScreenName/cliente_id do updates.json atual (modo offline)."""\n'
    '    try:\n'
    '        with open(os.path.join(CACHE_DIR, "updates.json"), "r", encoding="utf-8") as f:\n'
    '            d = json.load(f)\n'
    '        if not d.get("pasta_s3"):\n'
    '            return None\n'
    '        return {"pasta_s3": d.get("pasta_s3"), "ScreenName": d.get("ScreenName"), "cliente_id": d.get("cliente_id")}\n'
    '    except Exception:\n'
    '        return None\n'
    '\n'
    '\n'
    'def _refresh_updates_json(parcial=False, supabase_meta=None, so_se_mudou=False):\n',
    "assinatura_refresh")

s = trocar(s,
    '    # Mantém metadados se fornecidos\n'
    '    if supabase_meta:\n',
    '    # Mantém metadados se fornecidos (EXA 2.0: usa o último conhecido quando offline)\n'
    '    global _ULTIMO_META, _ULTIMA_ASSINATURA\n'
    '    if supabase_meta:\n'
    '        _ULTIMO_META = supabase_meta\n'
    '    else:\n'
    '        supabase_meta = _ULTIMO_META or _meta_do_disco()\n'
    '    if supabase_meta:\n',
    "meta_refresh")

s = trocar(s,
    '    j["backend_url"] = os.getenv("API_BASE_URL", "")\n'
    '\n'
    '    salvar_json_updates(j)\n',
    '    j["backend_url"] = os.getenv("API_BASE_URL", "")\n'
    '\n'
    '    # EXA 2.0: só regrava o arquivo da tela quando algo mudou (evita reinício de vídeo à toa)\n'
    '    try:\n'
    '        assinatura = hashlib.md5(json.dumps(j, sort_keys=True, default=str).encode("utf-8")).hexdigest()\n'
    '    except Exception:\n'
    '        assinatura = None\n'
    '    if so_se_mudou and assinatura and assinatura == _ULTIMA_ASSINATURA:\n'
    '        return\n'
    '    _ULTIMA_ASSINATURA = assinatura\n'
    '\n'
    '    salvar_json_updates(j)\n',
    "salvar_so_se_mudou")

s = trocar(s,
    '# --- 🔄 Fluxos de Atualização ---\n',
    'def _checar_relogio():\n'
    '    """EXA 2.0: desvio (s) do relógio local vs servidor (cabeçalho Date). Corrige no máx. 1x/h."""\n'
    '    global _ULTIMO_AJUSTE_RELOGIO\n'
    '    try:\n'
    '        url = os.getenv("SUPABASE_URL") or ""\n'
    '        if not url:\n'
    '            return None\n'
    '        r = requests.head(url, timeout=8)\n'
    '        data_srv = r.headers.get("Date")\n'
    '        if not data_srv:\n'
    '            return None\n'
    '        from email.utils import parsedate_to_datetime\n'
    '        drift = int(time.time() - parsedate_to_datetime(data_srv).timestamp())\n'
    '        if abs(drift) > 120 and time.time() - _ULTIMO_AJUSTE_RELOGIO > 3600:\n'
    '            _ULTIMO_AJUSTE_RELOGIO = time.time()\n'
    '            try:\n'
    '                subprocess.run(["sudo", "-n", "systemctl", "restart", "systemd-timesyncd"], timeout=20, capture_output=True)\n'
    '                print(f"⏰ Relógio desviado {drift}s — ressincronização solicitada.")\n'
    '            except Exception:\n'
    '                pass\n'
    '        return drift\n'
    '    except Exception:\n'
    '        return None\n'
    '\n'
    '\n'
    'def registrar_heartbeat(versao, faltando, sync_ok=True, erro=None):\n'
    '    """EXA 2.0: informa ao servidor o que esta tela aplicou e está tocando. Nunca derruba o player."""\n'
    '    try:\n'
    '        if supabase is None:\n'
    '            return\n'
    '        payload = {\n'
    '            "cliente_id": CLIENTE_ID,\n'
    '            "manifest_versao": versao,\n'
    '            "arquivos_faltando": len(faltando) if faltando is not None else None,\n'
    '            "faltando": [c for _, c in (faltando or [])][:20],\n'
    '            "playlist": _ULTIMA_PLAYLIST[:60],\n'
    '            "relogio_nuc": datetime.now().isoformat(),\n'
    '            "drift_seg": _checar_relogio(),\n'
    '            "sync_ok": bool(sync_ok),\n'
    '            "erro": (erro or "")[:300],\n'
    '            "app_versao": APP_VERSAO,\n'
    '        }\n'
    '        supabase.rpc("telas_registrar_heartbeat", {"p": payload}).execute()\n'
    '    except Exception as e:\n'
    '        print(f"⚠️ Heartbeat não enviado: {e}")\n'
    '\n'
    '\n'
    '# --- 🔄 Fluxos de Atualização ---\n',
    "funcoes_heartbeat")

s = trocar(s,
    '        response = supabase.table("updates_clientes").select("json_data")\\\n',
    '        response = supabase.table("updates_clientes").select("*")\\\n',
    "select_manifesto")

s = trocar(s,
    '        json_remote = response.data[0]["json_data"] or {}\n'
    '\n'
    '        # 1. Salva no banco local (SQLite)\n',
    '        json_remote = response.data[0]["json_data"] or {}\n'
    '        versao_remota = response.data[0].get("manifest_versao")\n'
    '\n'
    '        # 1. Salva no banco local (SQLite)\n',
    "versao_remota")

s = trocar(s,
    '            confirmar_atualizacao(CLIENTE_ID)\n'
    '\n'
    '        deletar_arquivos_removidos(json_local)\n'
    '        _refresh_updates_json(parcial=False, supabase_meta=json_remote)\n'
    '\n'
    '    except Exception as e:\n'
    '        print(f"❌ Erro na sincronização com servidor: {e}")\n',
    '\n'
    '        deletar_arquivos_removidos(json_local)\n'
    '        _refresh_updates_json(parcial=False, supabase_meta=json_remote)\n'
    '\n'
    '        # EXA 2.0: confirmação real — só confirma quando NENHUM arquivo está faltando\n'
    '        faltando_final = verificar_integridade_arquivos(montar_json_data())\n'
    '        if faltando and not faltando_final:\n'
    '            confirmar_atualizacao(CLIENTE_ID)\n'
    '        registrar_heartbeat(versao_remota, faltando_final, sync_ok=True)\n'
    '\n'
    '    except Exception as e:\n'
    '        print(f"❌ Erro na sincronização com servidor: {e}")\n'
    '        # EXA 2.0: sem internet a playlist continua andando com o horário (dados locais)\n'
    '        try:\n'
    '            _refresh_updates_json(parcial=False, so_se_mudou=True)\n'
    '        except Exception as e2:\n'
    '            print(f"⚠️ Refresh local falhou: {e2}")\n'
    '        registrar_heartbeat(None, None, sync_ok=False, erro=str(e))\n',
    "confirmacao_real")

# ------------------------------------------------------------------ atualizador.py
a0 = ler("atualizador.py")
a = trocar(a0,
    '            print("✅ Fim do ciclo. Aguardando próximo...")\n'
    '            time.sleep(tempo_espera)\n',
    '            print("✅ Fim do ciclo. Aguardando próximo...")\n'
    '            # EXA 2.0: recalcula a playlist a cada 60s (troca de horário na hora certa, mesmo offline)\n'
    '            inicio_espera = time.time()\n'
    '            while time.time() - inicio_espera < tempo_espera:\n'
    '                time.sleep(60)\n'
    '                try:\n'
    '                    sistema._refresh_updates_json(parcial=False, so_se_mudou=True)\n'
    '                except Exception as e:\n'
    '                    print(f"⚠️ Refresh local falhou: {e}")\n',
    "laco_60s")

# ------------------------------------------------------------------ saída
for rel, novo in (("atualizadores/sistema.py", s), ("atualizador.py", a)):
    compile(novo, rel, "exec")  # aborta se houver erro de sintaxe
    destino = os.path.join(DST, rel)
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    with open(destino, "w", encoding="utf-8") as f:
        f.write(novo)

with open(os.path.join(DST, "version_app.txt"), "w") as f:
    f.write("exa2-v8\n")

diff = list(difflib.unified_diff(s0.splitlines(), s.splitlines(), "sistema.py (v7)", "sistema.py (v8)", lineterm="", n=1))
diff += list(difflib.unified_diff(a0.splitlines(), a.splitlines(), "atualizador.py (v7)", "atualizador.py (v8)", lineterm="", n=1))
with open(os.path.join(DST, "diff.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(diff))
print("OK_V8 linhas_diff=%d" % len(diff))
