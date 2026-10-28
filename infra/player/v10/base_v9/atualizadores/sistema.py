from db.avisos_db import salvar_avisos_local, carregar_avisos_local
from db.propagandas_db import salvar_propagandas_local, carregar_propagandas_local
from db.banners_db import salvar_banners_local, carregar_banners_local
from db.config_db import carregar_config
from config.database import supabase
import sys
import os
import time
try:
    from . import autoupdate
except ImportError:
    import autoupdate

import requests
import json
from datetime import datetime
import hashlib
import subprocess
import random
import threading

sys.stdout.reconfigure(encoding='utf-8')

# Configura caminho e importa módulos locais
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Diretórios
BASE_DIR = getattr(sys, "_MEIPASS", os.path.abspath("."))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
S3_BASE_URL = os.getenv("S3_CLIENTES_URL", "")
os.makedirs(CACHE_DIR, exist_ok=True)

# Cliente
config = carregar_config()
CLIENTE_ID = str(config["tela_id"]) if config else "101"

# --- EXA 2.0: estado para confirmação de entrega ---
APP_VERSAO = "exa2-v9"
_VERSAO_APLICADA = None       # v9: versão do manifesto já sincronizada nesta execução
_ULTIMO_SYNC_COMPLETO = 0.0   # v9: horário da última sincronização completa
_agora = time.time            # v9: injetáveis para teste
_dormir = time.sleep
_TIMEOUT_LEVE = 10
_ULTIMO_META = None
_ULTIMA_PLAYLIST = []
_ULTIMA_ASSINATURA = None
_ULTIMO_AJUSTE_RELOGIO = 0

# --- 🧠 Lógica de Playlist e Filtragem (Cérebro do Sistema) ---


# A função eh_ativo foi removida pois a lógica agora utiliza master e programação por id_pedido.


def normalizar_programacao(programacao):
    """Normaliza as chaves de dias da semana (adiciona acentos onde necessário)."""
    if not programacao or not isinstance(programacao, dict):
        return programacao

    # Mapa de conversão sem acento -> com acento
    acentos = {
        "terca": "terça",
        "sabado": "sábado"
    }

    programacao_normalizada = dict(programacao)
    for sem, com_acento in acentos.items():
        if sem in programacao_normalizada and com_acento not in programacao_normalizada:
            programacao_normalizada[com_acento] = programacao_normalizada.pop(
                sem)

    return programacao_normalizada


def esta_no_horario(programacao):
    """Verifica se a propaganda pode rodar no dia e hora atuais."""
    if not programacao:
        return False
    agora = datetime.now()
    # Dias da semana em português conforme configurado no banco
    dias = ["segunda", "terça", "quarta",
            "quinta", "sexta", "sábado", "domingo"]
    dia_hoje = dias[agora.weekday()]

    # Tenta encontrar o horário com ou sem acentos
    horarios = programacao.get(dia_hoje, [])
    if not horarios:
        # Tenta versão sem acentos (para compatibilidade)
        dia_hoje_sem_acento = dia_hoje.replace(
            "ç", "c").replace("á", "a").replace("é", "e")
        horarios = programacao.get(dia_hoje_sem_acento, [])
    minutos_agora = agora.hour * 60 + agora.minute

    for h in horarios:
        try:
            h_ini, m_ini = map(int, str(h['inicio']).split(':'))
            h_fim, m_fim = map(int, str(h['fim']).split(':'))
            t_ini = h_ini * 60 + m_ini
            t_fim = h_fim * 60 + m_fim

            if t_ini <= t_fim:
                if t_ini <= minutos_agora <= t_fim:
                    return True
            else:  # Horário que vira a noite (ex: 22:00 às 02:00)
                if minutos_agora >= t_ini or minutos_agora <= t_fim:
                    return True
        except Exception:
            continue
    return False


def gerar_playlist_pronta(lista_propagandas):
    """Gera a fila final de vídeos filtrada e ordenada (3 normais : 1 plus)."""
    global _ULTIMA_PLAYLIST
    resumo = []
    agora = datetime.now()

    # 1. Agrupar por id_pedido para garantir apenas um vídeo por pedido ativo
    grupos = {}
    for p in lista_propagandas:
        id_pedido = p.get("id_pedido")
        # Se id_pedido não existe, tratamos como item individual único
        if id_pedido is None:
            id_pedido = f"ref_{id(p)}"

        if id_pedido not in grupos:
            grupos[id_pedido] = []
        grupos[id_pedido].append(p)

    validas = []

    for id_p, videos in grupos.items():
        vencedor = None
        master_video = None
        programado_ativo = None
        fallback_video = None

        for p in videos:
            titulo = p.get("titulo", "?")

            # A. Verificação de Status básico
            if p.get("status") in ["deleted", "disabled"]:
                continue

            # B. Filtro de Período (Datas)
            try:
                if p.get("data_ini"):
                    dt_ini = datetime.fromisoformat(
                        p["data_ini"].replace('Z', ''))
                    if agora < dt_ini:
                        continue
                if p.get("data_fim"):
                    dt_fim = datetime.fromisoformat(
                        p["data_fim"].replace('Z', ''))
                    if agora > dt_fim:
                        continue
            except Exception:
                continue

            # C. Identifica se é Master
            is_master = p.get("master", False)
            if isinstance(is_master, str):
                is_master = is_master.lower() in ["true", "1", "yes", "on"]

            # Fallback: guarda o primeiro vídeo válido do pedido para evitar perder o grupo
            if fallback_video is None:
                fallback_video = p

            if is_master:
                master_video = p

            # D. Verifica Programação Específica
            prog_raw = p.get("programacao")
            if prog_raw:
                prog_norm = normalizar_programacao(prog_raw)
                if esta_no_horario(prog_norm):
                    programado_ativo = p

        # E. Lógica de Seleção: Programado tem prioridade sobre o Master,
        #    e se não houver master, usamos qualquer vídeo válido do pedido.
        if programado_ativo:
            vencedor = programado_ativo
        elif master_video:
            vencedor = master_video
        elif fallback_video:
            vencedor = fallback_video

        if vencedor:
            # Normalização para o frontend
            p = vencedor.copy()
            titulo = p.get("titulo", "?")

            isplus_value = p.get("isPlus", False)
            if isinstance(isplus_value, str):
                p["isPlus"] = isplus_value.lower() in ["true", "1", "yes", "on"]
            else:
                p["isPlus"] = bool(isplus_value)

            p["QRLocale"] = "".join(str(p.get("QRLocale") or "").split())
            p["redirecionamento"] = str(
                p.get("redirecionamento") or "").strip()

            # Validação de QR Code
            is_valid_qr = False
            if "," in p["QRLocale"]:
                parts = p["QRLocale"].split(",")
                if len(parts) == 2:
                    try:
                        float(parts[0])
                        float(parts[1])
                        is_valid_qr = True
                    except ValueError:
                        pass

            tipo = "PLUS 📺" if p["isPlus"] else "Normal"
            # Identifica como a vitória foi definida: programação, master ou fallback.
            if vencedor == programado_ativo:
                origem = "Programado ⏰"
            elif vencedor == master_video:
                origem = "Master 🏠"
            else:
                origem = "Fallback ♻️"
            print(f"  ✅ {titulo} ({tipo}) [{origem}]")
            resumo.append({"titulo": titulo, "id_pedido": str(p.get("id_pedido") or ""), "origem": origem.split(" ")[0]})
            if is_valid_qr and p["QRLocale"].upper() != "OFF":
                print(f"  📍 QR Code configurado em: {p['QRLocale']}")
            elif p["QRLocale"] and p["QRLocale"].upper() != "OFF" and not is_valid_qr:
                p["QRLocale"] = ""

            validas.append(p)

    _ULTIMA_PLAYLIST = resumo

    # Separação por categoria para a mesclagem
    normais = [p for p in validas if not p.get("isPlus")]
    plus = [p for p in validas if p.get("isPlus")]

    print(
        f"\n📊 Resumo: {len(normais)} Normais + {len(plus)} Plus = {len(validas)} Válidos")

    # Casos onde não há necessidade de mesclagem
    if not validas:
        return []
    if not plus:
        print("⚠️ Aviso: Nenhum vídeo Plus disponível, retornando apenas normais")
        return normais
    if not normais:
        print("⚠️ Aviso: Nenhum vídeo Normal disponível, retornando apenas Plus")
        return plus

    # --- MESCLAGEM LÓGICA: 1 plus -> 3 normais ---
    # Determina quantos blocos de 4 vídeos (1 plus : 3 normais) são necessários
    # para que todos os vídeos (normais e plus) apareçam pelo menos uma vez.
    n_total = len(normais)
    p_total = len(plus)
    num_blocos = max(p_total, (n_total + 2) // 3)

    playlist_temp = []
    for i in range(num_blocos):
        # 1. Adiciona exatamente 1 plus (ciclando a lista se necessário)
        # Colocamos o Plus no início do bloco conforme sugestão do usuário
        p_idx = i % p_total
        playlist_temp.append(plus[p_idx])

        # 2. Adiciona exatamente 3 normais (ciclando a lista se necessário)
        for j in range(3):
            n_idx = (i * 3 + j) % n_total
            playlist_temp.append(normais[n_idx])

    # --- REFINAMENTO FINAL ---
    # Limpeza de duplicatas consecutivas (ex: se n_total for 1, o loop acima repetiria o mesmo vídeo 3x)
    # Comparamos pelo campo 'video' que é o path único do arquivo
    playlist_final = []
    for item in playlist_temp:
        if not playlist_final or item.get("video") != playlist_final[-1].get("video"):
            playlist_final.append(item)

    # Proteção de Loop: Garante que o vídeo que termina NÃO é o mesmo que começa o próximo ciclo
    if len(playlist_final) > 1:
        if playlist_final[0].get("video") == playlist_final[-1].get("video"):
            print(
                f"  🔄 Removendo duplicata de loop: {playlist_final[-1].get('titulo')}")
            playlist_final.pop()

    print(f"✨ PlaylistPronta: {len(playlist_final)} vídeos")
    return playlist_final


def _timestamp_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def _version_int():
    return int(time.time())


def salvar_json_updates(json_data):
    """Gravação Atômica para evitar corrupção de arquivo na UI."""
    try:
        tmp_path = os.path.join(CACHE_DIR, "updates.tmp")
        final_path = os.path.join(CACHE_DIR, "updates.json")
        json_data["data_atualizacao"] = _timestamp_iso()
        json_data["version"] = _version_int()

        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(json_data, f, indent=4, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_path, final_path)
        print(
            f"📝 updates.json (PlaylistPronta={len(json_data.get('PlaylistPronta', []))} itens)")
    except Exception as e:
        print(f"❌ Erro ao salvar updates.json: {e}")


def montar_json_data():
    """Lê do SQLite local."""
    return {
        "Propagandas": carregar_propagandas_local(CLIENTE_ID),
        "Banners": carregar_banners_local(CLIENTE_ID),
        "CondominiumNotices": carregar_avisos_local(CLIENTE_ID)
    }


def verificar_integridade_arquivos(json_data):
    """Retorna lista de tuplas (categoria, nome_arquivo) que não existem no cache."""
    arquivos_faltando = []
    categorias = {
        "Propagandas": "video",
        "Banners": "imagem",
        "CondominiumNotices": "mensagem"
    }
    for cat, chave in categorias.items():
        for item in json_data.get(cat, []):
            if item.get("status") == "deleted":
                continue
            caminho = item.get(chave)
            if not caminho:
                continue
            if not os.path.exists(os.path.join(CACHE_DIR, caminho)):
                arquivos_faltando.append((cat, caminho))
    return arquivos_faltando


def baixar_arquivo(url, destino, tentativas=3):
    """Download robusto com retentativas. v9: grava em .part e só troca pelo final quando completo."""
    parcial = destino + ".part"
    for tentativa in range(1, tentativas + 1):
        try:
            with requests.get(url, stream=True, timeout=20) as r:
                if r.status_code == 200:
                    os.makedirs(os.path.dirname(destino), exist_ok=True)
                    esperado = int(r.headers.get("Content-Length") or 0)
                    recebido = 0
                    with open(parcial, "wb") as f:
                        for chunk in r.iter_content(1024 * 1024):
                            if chunk:
                                f.write(chunk)
                                recebido += len(chunk)
                        f.flush()
                        os.fsync(f.fileno())
                    if recebido == 0 or (esperado and recebido != esperado):
                        raise IOError("download incompleto: %d de %d bytes" % (recebido, esperado))
                    os.replace(parcial, destino)
                    return True
        except Exception:
            time.sleep(2)
        finally:
            try:
                if os.path.exists(parcial):
                    os.remove(parcial)
            except Exception:
                pass
    return False


def confirmar_atualizacao(cliente_id):
    base_url = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
    url = f"{base_url}/geral/confirm-update/{cliente_id}"
    try:
        requests.post(url, timeout=10)
        print("✅ Servidor notificado do download.")
    except:
        pass


def deletar_arquivos_removidos(json_data):
    """Remove do disco arquivos que não estão mais no JSON."""
    arquivos_validos = set()
    categorias = {"Propagandas": "video",
                  "Banners": "imagem", "CondominiumNotices": "mensagem"}

    for cat, chave in categorias.items():
        for item in json_data.get(cat, []):
            if item.get(chave) and item.get("status") != "deleted":
                arquivos_validos.add(os.path.normpath(
                    os.path.join(CACHE_DIR, item.get(chave))))

    for cat in categorias:
        pasta = os.path.join(CACHE_DIR, cat)
        if not os.path.exists(pasta):
            continue
        for root, _, files in os.walk(pasta):
            for f in files:
                abs_p = os.path.normpath(os.path.join(root, f))
                if abs_p not in arquivos_validos:
                    try:
                        os.remove(abs_p)
                        print(f"🗑️ Obsoleto: {f}")
                    except:
                        pass

def _checar_relogio():
    """EXA 2.0: desvio (s) do relógio local vs servidor (cabeçalho Date). Corrige no máx. 1x/h."""
    global _ULTIMO_AJUSTE_RELOGIO
    try:
        url = os.getenv("SUPABASE_URL") or ""
        if not url:
            return None
        r = requests.head(url, timeout=8)
        data_srv = r.headers.get("Date")
        if not data_srv:
            return None
        from email.utils import parsedate_to_datetime
        drift = int(time.time() - parsedate_to_datetime(data_srv).timestamp())
        if abs(drift) > 120 and time.time() - _ULTIMO_AJUSTE_RELOGIO > 3600:
            _ULTIMO_AJUSTE_RELOGIO = time.time()
            try:
                subprocess.run(["sudo", "-n", "systemctl", "restart", "systemd-timesyncd"], timeout=20, capture_output=True)
                print(f"⏰ Relógio desviado {drift}s — ressincronização solicitada.")
            except Exception:
                pass
        return drift
    except Exception:
        return None


def registrar_heartbeat(versao, faltando, sync_ok=True, erro=None):
    """EXA 2.0: informa ao servidor o que esta tela aplicou e está tocando. Nunca derruba o player."""
    try:
        if supabase is None:
            return
        payload = {
            "cliente_id": CLIENTE_ID,
            "manifest_versao": versao,
            "arquivos_faltando": len(faltando) if faltando is not None else None,
            "faltando": [c for _, c in (faltando or [])][:20],
            "playlist": _ULTIMA_PLAYLIST[:60],
            "relogio_nuc": datetime.now().isoformat(),
            "drift_seg": _checar_relogio(),
            "sync_ok": bool(sync_ok),
            "erro": (erro or "")[:300],
            "app_versao": APP_VERSAO,
        }
        supabase.rpc("telas_registrar_heartbeat", {"p": payload}).execute()
    except Exception as e:
        print(f"⚠️ Heartbeat não enviado: {e}")


# --- 🔄 Fluxos de Atualização ---


def _meta_do_disco():
    """EXA 2.0: recupera pasta_s3/ScreenName/cliente_id do updates.json atual (modo offline)."""
    try:
        with open(os.path.join(CACHE_DIR, "updates.json"), "r", encoding="utf-8") as f:
            d = json.load(f)
        if not d.get("pasta_s3"):
            return None
        return {"pasta_s3": d.get("pasta_s3"), "ScreenName": d.get("ScreenName"), "cliente_id": d.get("cliente_id")}
    except Exception:
        return None


def _refresh_updates_json(parcial=False, supabase_meta=None, so_se_mudou=False):
    """Lê do DB local, processa a playlist lógica e salva o arquivo final."""
    j = montar_json_data()
    # Gera a playlist pronta que o Navegador vai consumir
    j["PlaylistPronta"] = gerar_playlist_pronta(j.get("Propagandas", []))

    # Mantém metadados se fornecidos (EXA 2.0: usa o último conhecido quando offline)
    global _ULTIMO_META, _ULTIMA_ASSINATURA
    if supabase_meta:
        _ULTIMO_META = supabase_meta
    else:
        supabase_meta = _ULTIMO_META or _meta_do_disco()
    if supabase_meta:
        j["pasta_s3"] = supabase_meta.get("pasta_s3")
        j["ScreenName"] = supabase_meta.get("ScreenName")
        j["cliente_id"] = supabase_meta.get("cliente_id")

    j["backend_url"] = os.getenv("API_BASE_URL", "")

    # EXA 2.0: só regrava o arquivo da tela quando algo mudou (evita reinício de vídeo à toa)
    try:
        assinatura = hashlib.md5(json.dumps(j, sort_keys=True, default=str).encode("utf-8")).hexdigest()
    except Exception:
        assinatura = None
    if so_se_mudou and assinatura and assinatura == _ULTIMA_ASSINATURA:
        return
    _ULTIMA_ASSINATURA = assinatura

    salvar_json_updates(j)


def contar_arquivos_faltando() -> int:
    try:
        resp = supabase.table("updates_clientes")\
            .select("json_data")\
            .eq("cliente_id", CLIENTE_ID)\
            .limit(1)\
            .execute()
        if not resp.data:
            return 0

        json_remote = resp.data[0].get("json_data") or {}
        # Garante chaves vazias se não vierem
        json_remote.setdefault("Propagandas", [])
        json_remote.setdefault("Banners", [])
        json_remote.setdefault("CondominiumNotices", [])

        faltando = verificar_integridade_arquivos(json_remote)
        return len(faltando)
    except Exception as e:
        print(f"⚠️ Erro em contar_arquivos_faltando: {e}")
        return 0


def baixar_arquivos_faltando(arquivos, pasta_s3, refresh_fn, callback=None):
    if not pasta_s3 or not arquivos:
        return
    mudou = False
    for _, caminho in arquivos:
        url = f"{S3_BASE_URL}/{pasta_s3}/{caminho.replace(os.sep, '/')}"
        destino = os.path.join(CACHE_DIR, caminho)
        if baixar_arquivo(url, destino):
            mudou = True
            if callback:
                try:
                    callback()  # incrementa 1 no progresso
                except Exception:
                    pass
            # refresh parcial (opcional)
            refresh_fn(parcial=True)
    if mudou:
        # refresh final
        refresh_fn(parcial=False)


# --- EXA 2.0 v9: verificação leve de mudanças (atualizador; o player da tela não é tocado) ---
def _consultar_versao_leve():
    """Lê só manifest_versao (e o ritmo pedido pelo servidor). Limite de _TIMEOUT_LEVE s; nunca fica pendurado."""
    if supabase is None:
        raise RuntimeError("sem conexao com o servidor")
    res = {}

    def _q():
        try:
            try:
                r = supabase.table("updates_clientes").select("manifest_versao,sync_intervalo_seg")\
                    .eq("cliente_id", CLIENTE_ID).limit(1).execute()
            except Exception as e1:
                if "sync_intervalo_seg" not in str(e1):
                    raise
                r = supabase.table("updates_clientes").select("manifest_versao")\
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
            if intervalo > 0 and v is not None and _VERSAO_APLICADA is not None and v != _VERSAO_APLICADA \
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


def verificar_atualizacao_servidor(callback=None):
    """Sincroniza o SQLite local com o Supabase e baixa arquivos novos."""
    global _VERSAO_APLICADA, _ULTIMO_SYNC_COMPLETO
    _ULTIMO_SYNC_COMPLETO = _agora()
    try:
        # 0. Verifica se existe atualização de código (OTA) antes de processar dados
        if autoupdate.verificar_e_aplicar_update():
            print("🔄 Software atualizado. Reiniciando processo...")
            sys.exit(0)

        response = supabase.table("updates_clientes").select("*")\
            .eq("cliente_id", CLIENTE_ID).limit(1).execute()

        if not response.data:
            print("ℹ️ Nenhuma alteração no servidor.")
            return

        json_remote = response.data[0]["json_data"] or {}
        versao_remota = response.data[0].get("manifest_versao")

        # 1. Salva no banco local (SQLite)
        salvar_propagandas_local(
            CLIENTE_ID, json_remote.get("Propagandas", []))
        salvar_banners_local(CLIENTE_ID, json_remote.get("Banners", []))
        salvar_avisos_local(
            CLIENTE_ID, json_remote.get("CondominiumNotices", []))

        # 2. Atualiza o JSON local (incluindo a PlaylistPronta)
        _refresh_updates_json(supabase_meta=json_remote)

        # 3. Gerencia arquivos físicos
        json_local = montar_json_data()
        faltando = verificar_integridade_arquivos(json_local)

        if faltando:
            print(f"📦 Baixando {len(faltando)} novos arquivos...")
            # CORREÇÃO AQUI: Adicionado o callback=callback no final
            baixar_arquivos_faltando(
                faltando,
                json_remote.get("pasta_s3"),
                lambda parcial: _refresh_updates_json(
                    supabase_meta=json_remote),
                callback=callback
            )

        deletar_arquivos_removidos(json_local)
        _refresh_updates_json(parcial=False, supabase_meta=json_remote)

        # EXA 2.0: confirmação real — só confirma quando NENHUM arquivo está faltando
        faltando_final = verificar_integridade_arquivos(montar_json_data())
        if faltando and not faltando_final:
            confirmar_atualizacao(CLIENTE_ID)
        registrar_heartbeat(versao_remota, faltando_final, sync_ok=True)
        _VERSAO_APLICADA = versao_remota  # v9: base da verificação leve

    except Exception as e:
        print(f"❌ Erro na sincronização com servidor: {e}")
        # EXA 2.0: sem internet a playlist continua andando com o horário (dados locais)
        try:
            _refresh_updates_json(parcial=False, so_se_mudou=True)
        except Exception as e2:
            print(f"⚠️ Refresh local falhou: {e2}")
        registrar_heartbeat(None, None, sync_ok=False, erro=str(e))

# --- 🚀 Loop Principal ---


if __name__ == "__main__":
    ultimo_sync_servidor = 0
    INTERVALO_SERVER = 300  # 5 minutos (Sync completo + Downloads)
    INTERVALO_LOCAL = 60    # 1 minuto (Recalcula PlaylistPronta)

    print(f"--- ATUALIZADOR INICIADO (Cliente: {CLIENTE_ID}) ---")

    while True:
        agora = time.time()

        # 1. Sincronização Lenta (Internet)
        if agora - ultimo_sync_servidor > INTERVALO_SERVER:
            print("☁️ Verificando servidor Supabase...")
            verificar_atualizacao_servidor()
            ultimo_sync_servidor = agora

        # 2. Refresh Rápido da Playlist (Local)
        # Isso garante que se uma propaganda acaba as 14:00, as 14:01 ela sai do ar
        _refresh_updates_json()

        time.sleep(INTERVALO_LOCAL)
