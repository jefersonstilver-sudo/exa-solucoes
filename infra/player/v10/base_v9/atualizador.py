import os
import atexit
import time
import sys
import psutil
from atualizadores import sistema, noticias_update, live_update, cotacoes_update

BASE_DIR = getattr(sys, '_MEIPASS', os.path.abspath("."))
CACHE_DIR = os.path.join(BASE_DIR, "cache")
LOCKFILE = os.path.join(CACHE_DIR, "atualizador.lock")

os.makedirs(CACHE_DIR, exist_ok=True)

def limpar_lockfile():
    if os.path.exists(LOCKFILE):
        os.remove(LOCKFILE)

if __name__ == "__main__":
    tempo_espera = 300 # 5 minutos

    # Verifica se já está rodando
    if os.path.exists(LOCKFILE):
        try:
            with open(LOCKFILE, "r") as f:
                pid = int(f.read())
            if psutil.pid_exists(pid):
                print("🚫 O atualizador já está em execução (processo ativo). Abortando.")
                sys.exit(0)
            else:
                print("⚠️ Lockfile encontrado, mas processo inativo. Limpando lockfile antigo.")
                os.remove(LOCKFILE)
        except Exception as e:
            print(f"⚠️ Erro ao validar lockfile: {e}. Limpando mesmo assim.")
            os.remove(LOCKFILE)

    with open(LOCKFILE, "w") as f:
        f.write(str(os.getpid()))

    atexit.register(limpar_lockfile)

    # 🔁 Execução imediata (logo que iniciar)
    print("\n🧪 Executando atualização imediata ao iniciar...")
    sistema.verificar_atualizacao_servidor()
    live_update.verificar_e_atualizar_lives()
    cotacoes_update.verificar_e_atualizar_cotacao()
    noticias_update.verificar_e_atualizar_noticias()
    
    while True:
        try:
            print("\n🧪 Verificando atualizações gerais do sistema...")
            sistema.verificar_atualizacao_servidor()

            print("📺 Verificando atualizações de lives...")
            live_update.verificar_e_atualizar_lives()

            print("💲 Verificando atualizações das cotações...")
            cotacoes_update.verificar_e_atualizar_cotacao()

            print("📰 Verificando atualizações das notícias...")
            noticias_update.verificar_e_atualizar_noticias()

            print("✅ Fim do ciclo. Aguardando próximo...")
            # EXA 2.0: recalcula a playlist a cada 60s (troca de horário na hora certa, mesmo offline)
            inicio_espera = time.time()
            # EXA 2.0 v9: espera inteligente (sincroniza na hora quando o servidor muda); se falhar, segue o v8
            try:
                sistema.esperar_proximo_ciclo(tempo_espera)
            except Exception as e:
                print(f"Espera v9 falhou, seguindo como v8: {e}")
            while time.time() - inicio_espera < tempo_espera:
                time.sleep(60)
                try:
                    sistema._refresh_updates_json(parcial=False, so_se_mudou=True)
                except Exception as e:
                    print(f"⚠️ Refresh local falhou: {e}")

        except Exception as e:
            print(f"❌ Erro inesperado no loop principal: {e}")
            print("⏳ Aguardando 30s antes de tentar novamente...")
            time.sleep(30)

