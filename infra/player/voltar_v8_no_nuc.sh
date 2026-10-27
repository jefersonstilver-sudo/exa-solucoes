bash <<'EOF_VOLTA'
cd ~/Documentos/appUbuntu || { echo "ABORTADO: pasta do app nao encontrada"; exit 1; }
B=$(ls -d backup_v8_* 2>/dev/null | tail -1); [ -n "$B" ] || { echo "ABORTADO: nao achei a copia do v8"; exit 1; }
grep -q 'APP_VERSAO = "exa2-v8"' "$B/atualizadores/sistema.py" || { echo "ABORTADO: a copia nao e o v8"; exit 1; }
cp "$B/atualizador.py" atualizador.py && cp "$B/atualizadores/sistema.py" atualizadores/sistema.py && echo "VOLTOU PARA O v8 (de $B). Reativando (a tela recarrega uma vez)..." && pkill -f "atualizador.py"; sleep 20; pgrep -af "atualizador.py|main.py" | grep -v pgrep
EOF_VOLTA
