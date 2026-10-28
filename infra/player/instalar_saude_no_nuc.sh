bash <<'EOF_NUC'
# EXA 2.0 — instala o coletor de saúde (auditoria automática a cada 15 min) neste NUC.
# NÃO mexe no player: não para, não reinicia, não altera nenhum arquivo dele.
# Desfazer: crontab -l | grep -v exa_saude.py | crontab -   (e apagar ~/Documentos/appUbuntu/exa_saude.py)
set -e
APP="$HOME/Documentos/appUbuntu"
[ -d "$APP" ] || { echo "ABORTADO: pasta $APP nao existe"; exit 1; }

# 1) descobre o código da tela usando o próprio player (só leitura)
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
