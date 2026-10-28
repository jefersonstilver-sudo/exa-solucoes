#!/bin/bash
# EXA 2.0 — vigia de rede (vigia-v2). Roda pelo crontab do usuário exa a CADA MINUTO.
# 1) DIÁRIO DE CONEXÃO (~/.exa_vigia/diario.log): grava cada MUDANÇA de estado, com hora, mesmo sem internet.
#    O coletor envia o diário quando a conexão volta -> cada queda chega explicada:
#      OK           internet funcionando
#      OPERADORA    cabo ok, roteador responde, internet não  -> operadora / link do prédio
#      SEM_GATEWAY  cabo com sinal, roteador não responde     -> roteador/antena/rede local (ou placa do NUC)
#      SEM_CABO     placa sem sinal no cabo                    -> antena/PoE desligada, cabo, ou placa do NUC
#      SEM_ROTA     sem endereço/rota configurada              -> rede do NUC não subiu
#      BOOT         NUC ligou (anterior_visto = último minuto em que o vigia viu o NUC vivo antes)
# 2) RECUPERAÇÃO (caso Foz Residence 23/10: placa Realtek não subiu no boot, 5 dias mudo):
#    falha do lado do NUC (SEM_GATEWAY/SEM_CABO/SEM_ROTA) por 10 min -> reinicia a rede;
#    por 20 min -> reinicia o NUC (máx. 1x a cada 2 h e 4x por dia; só se ligado há > 20 min).
#    OPERADORA nunca reinicia nada (não adiantaria).
# Teste sem agir:  bash exa_vigia_rede.sh --teste
EST="$HOME/.exa_vigia"; mkdir -p "$EST"; LOG="$EST/vigia.log"; DIA="$EST/diario.log"
TESTE=0; [ "$1" = "--teste" ] && TESTE=1
agora=$(date +%s); up=$(cut -d. -f1 /proc/uptime)
corta(){ [ -f "$1" ] && [ "$(wc -l < "$1")" -gt "$2" ] && tail -n "$2" "$1" > "$1.tmp" && mv "$1.tmp" "$1"; }
log(){ echo "$(date '+%F %T') $*" >> "$LOG"; [ $TESTE = 1 ] && echo "acao: $*"; corta "$LOG" 300; }
diario(){ echo "$(date '+%F %T') $*" >> "$DIA"; [ $TESTE = 1 ] && echo "diario: $*"; corta "$DIA" 3000; }

# NUC ligou?
BID=$(cat /proc/sys/kernel/random/boot_id 2>/dev/null)
if [ -n "$BID" ] && [ "$(cat "$EST/boot_id" 2>/dev/null)" != "$BID" ]; then
  ant=$(cat "$EST/visto" 2>/dev/null)
  if [ -f "$EST/boot_id" ]; then
    diario "BOOT uptime=${up}s anterior_visto=$( [ -n "$ant" ] && date -d @"$ant" '+%F %T' || echo '?')"
  else
    diario "INICIO_DIARIO uptime=${up}s"   # primeira execução do vigia-v2 neste NUC (não é religamento)
  fi
  echo "$BID" > "$EST/boot_id"; rm -f "$EST/estado" "$EST/falhas"
fi

GW=$(ip route 2>/dev/null | awk '/^default/{print $3; exit}')
CABO=$(cat /sys/class/net/en*/carrier 2>/dev/null | head -n1)
net_ok(){
  ping -c1 -W2 1.1.1.1 >/dev/null 2>&1 && return 0
  ping -c1 -W2 8.8.8.8 >/dev/null 2>&1 && return 0
  timeout 5 bash -c '</dev/tcp/18.228.252.149/8000' >/dev/null 2>&1 && return 0
  return 1
}
gw_ok(){ [ -n "$GW" ] && { ping -c2 -W2 "$GW" >/dev/null 2>&1 || ping -c2 -W2 "$GW" >/dev/null 2>&1; }; }

if net_ok; then ESTADO=OK
elif [ "$CABO" = "0" ]; then ESTADO=SEM_CABO
elif [ -z "$GW" ]; then ESTADO=SEM_ROTA
elif gw_ok; then ESTADO=OPERADORA
else ESTADO=SEM_GATEWAY; fi
echo "$agora" > "$EST/visto"

ANT=$(cat "$EST/estado" 2>/dev/null)
if [ "$ESTADO" != "$ANT" ]; then
  diario "$ESTADO cabo=${CABO:-?} gw=${GW:-nenhum}"
  echo "$ESTADO" > "$EST/estado"
fi
[ $TESTE = 1 ] && echo "estado: $ESTADO (cabo=${CABO:-?} gateway=${GW:-nenhum} uptime=${up}s)"

case "$ESTADO" in
  OK|OPERADORA) rm -f "$EST/falhas"; exit 0 ;;
esac
n=$(( $(cat "$EST/falhas" 2>/dev/null || echo 0) + 1 )); echo $n > "$EST/falhas"
[ $TESTE = 1 ] && { echo "(modo teste: nao executo nada; falha do NUC ha $n min)"; exit 0; }
if [ $n -eq 10 ] || [ $n -eq 15 ]; then
  log "SEM REDE no NUC ha $n min ($ESTADO): reiniciando a rede (systemd-networkd)"
  sudo -n systemctl restart systemd-networkd >/dev/null 2>&1
fi
if [ $n -ge 20 ] && [ "$up" -gt 1200 ]; then
  ult=$(cat "$EST/ultimo_reboot" 2>/dev/null || echo 0)
  hoje=$(date +%F); qtd=$(grep -c "^$hoje .*REINICIANDO O NUC" "$LOG" 2>/dev/null)
  if [ $((agora - ult)) -gt 7200 ] && [ "${qtd:-0}" -lt 4 ]; then
    echo "$agora" > "$EST/ultimo_reboot"; rm -f "$EST/falhas"
    log "REINICIANDO O NUC (sem rede ha $n min, $ESTADO)"; diario "VIGIA_REINICIOU_NUC $ESTADO ha $n min"
    sync; sudo -n systemctl reboot
  fi
fi
