bash <<'EOF_NUC'
# EXA 2.0 — instala o coletor de saúde (auditoria automática a cada 15 min) neste NUC.
# NÃO mexe no player: não para, não reinicia, não altera nenhum arquivo dele.
# Desfazer: crontab -l | grep -v exa_saude.py | crontab -   (e apagar ~/Documentos/appUbuntu/exa_saude.py)
set -e
APP="$HOME/Documentos/appUbuntu"
[ -d "$APP" ] || { echo "ABORTADO: pasta $APP nao existe"; exit 1; }

# 1) descobre o código da tela usando o próprio player (só leitura)
if [ ! -s "$HOME/.exa_saude.json" ]; then
  ID=$(cd "$APP" && timeout 40 nice -n 19 python3 -c 'import sys; sys.path.insert(0,"."); import atualizadores.sistema as s; print(s.CLIENTE_ID)' 2>/dev/null | tail -n1 | tr -d '[:space:]')
  if [ -z "$ID" ] || [ "$ID" = "101" ]; then echo "ABORTADO: nao consegui descobrir o codigo da tela (veio '$ID')"; exit 1; fi
  printf '{"cliente_id": "%s"}\n' "$ID" > "$HOME/.exa_saude.json"
fi
echo "Tela: $(cat "$HOME/.exa_saude.json")"

# 2) grava o coletor (conteúdo abaixo)
cat > "$APP/exa_saude.py.tmp" <<'EOF_PY'
__COLETOR__
EOF_PY
python3 -m py_compile "$APP/exa_saude.py.tmp" && mv "$APP/exa_saude.py.tmp" "$APP/exa_saude.py"
rm -rf "$APP/__pycache__/exa_saude"* 2>/dev/null || true

# 3) agenda a cada 15 min, com prioridade mínima e limite de 90 s (nunca roda dois ao mesmo tempo)
LINHA="*/15 * * * * cd $APP && flock -n /tmp/exa_saude.lock timeout 90 nice -n 19 ionice -c3 python3 $APP/exa_saude.py >/tmp/exa_saude.log 2>&1"
( crontab -l 2>/dev/null | grep -v 'exa_saude.py' ; echo "$LINHA" ) | crontab -
echo "Agendado: $(crontab -l | grep exa_saude.py | cut -c1-40)..."

# 4) primeira coleta agora, para conferir
cd "$APP" && timeout 90 nice -n 19 python3 "$APP/exa_saude.py" --mostrar | tail -n 45
EOF_NUC
