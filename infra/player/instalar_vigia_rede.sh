bash <<'EOF_NUC'
# EXA 2.0 — instala o VIGIA DE REDE (religa a rede/NUC sozinho se o cabo não subir). Não mexe no player.
APP="$HOME/Documentos/appUbuntu"
cat > "$APP/exa_vigia_rede.sh" <<'EOF_VIG'
#!/bin/bash
# EXA 2.0 — vigia de rede (vigia-v1). Roda pelo crontab do usuário exa a cada 5 min.
# Motivo: Foz Residence 23/10 — no boot das 02:35 a placa Realtek (r8169) não iniciou o PHY,
# o cabo nunca subiu e o NUC ficou 5 dias "ligado e mudo" até alguém apertar o botão.
# Regras:
#  - internet ok                      -> nada
#  - internet fora, gateway responde  -> problema da operadora/antena: só registra, NÃO reinicia
#  - nem o gateway responde           -> problema no NUC: 2ª falha (10 min) reinicia a rede;
#                                        4ª falha (20 min) reinicia o NUC (no máx. 1x a cada 2 h e 4x por dia,
#                                        e só se o NUC estiver ligado há mais de 20 min)
# Teste sem agir:  bash exa_vigia_rede.sh --teste
EST="$HOME/.exa_vigia"; mkdir -p "$EST"; LOG="$EST/vigia.log"
TESTE=0; [ "$1" = "--teste" ] && TESTE=1
agora=$(date +%s); up=$(cut -d. -f1 /proc/uptime)
log(){ echo "$(date '+%F %T') $*" >> "$LOG"; [ $TESTE = 1 ] && echo "$*"; tail -n 300 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"; }
GW=$(ip route 2>/dev/null | awk '/^default/{print $3; exit}')
CABO=$(cat /sys/class/net/en*/carrier 2>/dev/null | head -n1)
net_ok(){
  ping -c2 -W3 1.1.1.1 >/dev/null 2>&1 && return 0
  ping -c2 -W3 8.8.8.8 >/dev/null 2>&1 && return 0
  timeout 5 bash -c '</dev/tcp/18.228.252.149/8000' >/dev/null 2>&1 && return 0
  return 1
}
gw_ok(){ [ -n "$GW" ] && ping -c3 -W2 "$GW" >/dev/null 2>&1; }

if net_ok; then
  [ -s "$EST/falhas" ] && log "internet voltou (depois de $(cat "$EST/falhas") falha(s))"
  rm -f "$EST/falhas"; [ $TESTE = 1 ] && echo "OK: internet funcionando (gateway ${GW:-?}, cabo=${CABO:-?})"; exit 0
fi
if gw_ok; then
  log "internet FORA, mas gateway $GW responde -> operadora/antena (nao reinicio nada)"
  rm -f "$EST/falhas"; exit 0
fi
n=$(( $(cat "$EST/falhas" 2>/dev/null || echo 0) + 1 )); echo $n > "$EST/falhas"
log "SEM REDE no NUC (falha $n): gateway=${GW:-nenhum} cabo=${CABO:-?} uptime=${up}s"
[ $TESTE = 1 ] && { echo "(modo teste: nao executo nada)"; exit 0; }
if [ $n -eq 2 ] || [ $n -eq 3 ]; then
  log "reiniciando a rede (systemd-networkd)"; sudo -n systemctl restart systemd-networkd >/dev/null 2>&1
fi
if [ $n -ge 4 ] && [ "$up" -gt 1200 ]; then
  ult=$(cat "$EST/ultimo_reboot" 2>/dev/null || echo 0)
  hoje=$(date +%F); qtd=$(grep -c "^$hoje .*REINICIANDO O NUC" "$LOG" 2>/dev/null)
  if [ $((agora - ult)) -gt 7200 ] && [ "${qtd:-0}" -lt 4 ]; then
    echo "$agora" > "$EST/ultimo_reboot"; rm -f "$EST/falhas"
    log "REINICIANDO O NUC (sem rede ha ~$((n*5)) min)"; sync; sudo -n systemctl reboot
  fi
fi
EOF_VIG
chmod +x "$APP/exa_vigia_rede.sh" && bash -n "$APP/exa_vigia_rede.sh" && echo "Vigia gravado: OK"
LINHA="*/5 * * * * flock -n /tmp/exa_vigia.lock timeout 120 bash $APP/exa_vigia_rede.sh >/dev/null 2>&1"
( crontab -l 2>/dev/null | grep -v 'exa_vigia_rede.sh' || true ; echo "$LINHA" ) | crontab -
echo "Vigia agendado a cada 5 min: $( [ "$(crontab -l | grep -c exa_vigia_rede.sh)" = 1 ] && echo OK || echo ERRO )"
echo "Coletor de saude agendado: $( [ "$(crontab -l | grep -c exa_saude.py)" = 1 ] && echo OK || echo FALTA )"
echo "Desligamento 01:00: $(systemctl is-enabled poweroff.target 2>/dev/null)"
bash "$APP/exa_vigia_rede.sh" --teste
EOF_NUC
