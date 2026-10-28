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
__COLETOR__
EOF_PY
python3 -m py_compile "$APP/exa_saude.py.tmp" && mv "$APP/exa_saude.py.tmp" "$APP/exa_saude.py"
rm -rf "$APP/__pycache__/exa_saude"* 2>/dev/null || true

# 3) agenda a cada 15 min, com prioridade mínima e limite de 90 s (nunca roda dois ao mesmo tempo)
LINHA="*/15 * * * * cd $APP && flock -n /tmp/exa_saude.lock timeout 90 nice -n 19 ionice -c3 python3 $APP/exa_saude.py >/tmp/exa_saude.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'exa_saude.py' || true ; echo "$LINHA" ) | crontab -
if [ "$(crontab -l 2>/dev/null | grep -c exa_saude.py)" = "1" ]; then echo "Agendado a cada 15 min: OK"; else echo "ERRO: o agendamento NAO ficou gravado (crontab). Mande um print para a EXA."; fi

# 4) primeira coleta agora, para conferir
cd "$APP" && timeout 90 nice -n 19 python3 "$APP/exa_saude.py" --mostrar | tail -n 45
EOF_NUC
