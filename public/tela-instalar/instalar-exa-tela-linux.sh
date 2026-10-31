#!/usr/bin/env bash
# =====================================================================
#  EXA Tela - instalador para Ubuntu / Linux com tela (GNOME, XFCE, LXDE...)
#  Deixa este computador como tela da EXA: abre sozinho ao entrar na
#  sessão, em tela cheia (Chromium/Chrome, ou Firefox), sem apagar a tela.
#
#  Uso (na conta que fica logada na TV, NÃO como root):
#    curl -fsSL https://examidia.com.br/tela-instalar/instalar-exa-tela-linux.sh | bash
#  Desfazer:
#    curl -fsSL https://examidia.com.br/tela-instalar/instalar-exa-tela-linux.sh | bash -s -- --desinstalar
#  Responder "sim" a tudo sem perguntar: EXA_SIM=1
# =====================================================================
set -u

URL="https://examidia.com.br/tela/?plataforma=linux&app=linux-1"
DIR="$HOME/.exa-tela"
BIN="$HOME/.local/bin/exa-tela.sh"
AUTO="$HOME/.config/autostart/exa-tela.desktop"

verde() { printf '\033[32m    OK  %s\033[0m\n' "$*"; }
amarelo() { printf '\033[33m    !   %s\033[0m\n' "$*"; }
passo() { printf '\n\033[36m[%s] %s\033[0m\n' "$1" "$2"; }
pergunta() { # pergunta "texto" -> 0 se sim
  [ "${EXA_SIM:-0}" = 1 ] && return 0
  local r=""
  if [ -r /dev/tty ]; then read -r -p "    $1 (s/N) " r </dev/tty || true; fi
  [[ "$r" =~ ^[sSyY] ]]
}
tem_sudo() { command -v sudo >/dev/null 2>&1; }

if [ "$(id -u)" = 0 ]; then
  echo "Rode como o usuário que fica logado na TV (não como root). O script pede a senha de sudo só se precisar."
  exit 1
fi

# --------------------------- desinstalar ---------------------------
if [ "${1:-}" = "--desinstalar" ]; then
  pkill -f "$BIN" 2>/dev/null || true
  pkill -f "$DIR/perfil" 2>/dev/null || true
  rm -f "$AUTO" "$BIN"
  rm -rf "$DIR"
  verde "EXA Tela removida desta conta (login automático e atualizações do sistema não foram mexidos aqui)."
  echo "    Se você ligou o login automático: edite /etc/gdm3/custom.conf e apague AutomaticLogin."
  echo "    Para religar as atualizações: sudo systemctl enable --now unattended-upgrades apt-daily.timer apt-daily-upgrade.timer"
  exit 0
fi

echo
echo "  EXA Tela - instalação neste computador"
echo "  Ao terminar, a tela abre sozinha mostrando um CÓDIGO."
echo "  Digite esse código no painel EXA: Telas > Adicionar tela."

# --------------------------- 1. navegador ---------------------------
passo 1 "Procurando um navegador (Chromium/Chrome ou Firefox)"
NAV=""
for c in chromium chromium-browser google-chrome-stable google-chrome; do
  if command -v "$c" >/dev/null 2>&1; then NAV="$c"; break; fi
done
if [ -z "$NAV" ] && tem_sudo && command -v apt-get >/dev/null 2>&1; then
  if pergunta "Não achei o Chromium. Instalar agora (precisa da senha de sudo)?"; then
    sudo apt-get update -qq && (sudo apt-get install -y chromium-browser || sudo apt-get install -y chromium) >/dev/null 2>&1
    for c in chromium chromium-browser; do command -v "$c" >/dev/null 2>&1 && NAV="$c" && break; done
  fi
fi
if [ -z "$NAV" ] && command -v firefox >/dev/null 2>&1; then NAV="firefox"; fi
if [ -z "$NAV" ]; then
  echo "    ERRO: sem Chromium, Chrome nem Firefox. Instale um deles e rode de novo."
  exit 1
fi
verde "$NAV"

mkdir -p "$DIR/perfil" "$HOME/.local/bin" "$HOME/.config/autostart"

# Firefox: liga o vídeo tocando sozinho, sem restaurar sessão, sem atualização automática
if [ "$NAV" = "firefox" ]; then
  cat > "$DIR/perfil/user.js" <<'EOF'
user_pref("media.autoplay.default", 0);
user_pref("media.autoplay.blocking_policy", 0);
user_pref("browser.sessionstore.resume_from_crash", false);
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("app.update.auto", false);
user_pref("browser.aboutwelcome.enabled", false);
user_pref("datareporting.policy.dataSubmissionEnabled", false);
user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("full-screen-api.warning.timeout", 0);
EOF
fi

# --------------------------- 2. lançador ---------------------------
passo 2 "Criando o lançador (abre em tela cheia e reabre se fechar)"
cat > "$BIN" <<EOF
#!/usr/bin/env bash
# EXA Tela - abre o player em tela cheia e reabre se o navegador fechar
URL="$URL"
NAV="$NAV"
PERFIL="$DIR/perfil"
sem_apagar() {
  xset s off -dpms s noblank 2>/dev/null
  gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null
  gsettings set org.gnome.desktop.screensaver lock-enabled false 2>/dev/null
  gsettings set org.gnome.desktop.screensaver idle-activation-enabled false 2>/dev/null
  gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null
  gsettings set org.gnome.settings-daemon.plugins.power idle-dim false 2>/dev/null
  gsettings set org.gnome.desktop.notifications show-banners false 2>/dev/null
}
sleep 6
command -v unclutter >/dev/null 2>&1 && (pgrep -x unclutter >/dev/null || unclutter -idle 1 -root >/dev/null 2>&1 &)
while true; do
  sem_apagar
  if [ "\$NAV" = "firefox" ]; then
    firefox --kiosk --no-remote --profile "\$PERFIL" "\$URL" >/dev/null 2>&1
  else
    # limpa o aviso de "o navegador não foi fechado corretamente"
    sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[A-Za-z]*"/"exit_type":"Normal"/' "\$PERFIL/Default/Preferences" 2>/dev/null
    "\$NAV" --kiosk "\$URL" --user-data-dir="\$PERFIL" --no-first-run --noerrdialogs --disable-infobars \\
      --autoplay-policy=no-user-gesture-required --disable-session-crashed-bubble --hide-crash-restore-bubble \\
      --disable-features=Translate --check-for-update-interval=31536000 --password-store=basic \\
      --overscroll-history-navigation=0 --disable-pinch >/dev/null 2>&1
  fi
  sleep 5
done
EOF
chmod +x "$BIN"
verde "$BIN"

# --------------------------- 3. autostart ---------------------------
passo 3 "Abrir sozinho ao entrar na sessão"
cat > "$AUTO" <<EOF
[Desktop Entry]
Type=Application
Name=EXA Tela
Comment=Player da EXA em tela cheia
Exec=$BIN
X-GNOME-Autostart-enabled=true
X-GNOME-Autostart-Delay=3
NoDisplay=false
Terminal=false
EOF
verde "$AUTO"

# --------------------------- 4. tela sempre ligada ---------------------------
passo 4 "Tela sempre ligada (sem proteção de tela, sem suspensão)"
gsettings set org.gnome.desktop.session idle-delay 0 2>/dev/null && verde "GNOME: sem apagar a tela" || amarelo "sem GNOME; o lançador usa xset a cada abertura"
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing' 2>/dev/null || true
if tem_sudo && pergunta "Bloquear a suspensão do computador de vez (precisa de sudo)?"; then
  sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target >/dev/null 2>&1 && verde "suspensão bloqueada"
fi
command -v unclutter >/dev/null 2>&1 || {
  if tem_sudo && command -v apt-get >/dev/null 2>&1 && pergunta "Instalar o 'unclutter' para esconder o ponteiro do mouse?"; then
    sudo apt-get install -y unclutter >/dev/null 2>&1 && verde "ponteiro escondido"
  fi
}

# --------------------------- 5. login automático ---------------------------
passo 5 "Entrar sozinho na sessão ao ligar (opcional)"
echo "    Sem isso, depois de faltar energia a tela fica parada na senha."
if [ -f /etc/gdm3/custom.conf ] && tem_sudo; then
  if pergunta "Ligar o login automático do usuário '$USER' (GDM, precisa de sudo)?"; then
    sudo sed -i '/^\s*AutomaticLogin\(Enable\)\?\s*=/d' /etc/gdm3/custom.conf
    sudo sed -i "s/^\[daemon\]/[daemon]\nAutomaticLoginEnable=True\nAutomaticLogin=$USER/" /etc/gdm3/custom.conf
    verde "login automático ligado"
  fi
elif [ -d /etc/lightdm ] && tem_sudo; then
  if pergunta "Ligar o login automático do usuário '$USER' (LightDM, precisa de sudo)?"; then
    printf '[Seat:*]\nautologin-user=%s\nautologin-user-timeout=0\n' "$USER" | sudo tee /etc/lightdm/lightdm.conf.d/50-exa-tela.conf >/dev/null 2>&1 \
      || { sudo mkdir -p /etc/lightdm/lightdm.conf.d && printf '[Seat:*]\nautologin-user=%s\nautologin-user-timeout=0\n' "$USER" | sudo tee /etc/lightdm/lightdm.conf.d/50-exa-tela.conf >/dev/null; }
    verde "login automático ligado"
  fi
else
  amarelo "ligue o login automático nas Configurações do sistema (Usuários > Login automático)"
fi

# --------------------------- 6. atualizações ---------------------------
passo 6 "Atualizações automáticas do sistema (opcional)"
if tem_sudo && pergunta "Desligar as atualizações automáticas (evita reinício e janelas na tela; precisa de sudo)?"; then
  sudo systemctl disable --now unattended-upgrades apt-daily.timer apt-daily-upgrade.timer >/dev/null 2>&1 || true
  command -v update-notifier >/dev/null 2>&1 && sudo apt-get remove -y update-notifier >/dev/null 2>&1 || true
  if command -v snap >/dev/null 2>&1; then sudo snap refresh --hold >/dev/null 2>&1 || true; fi
  verde "atualizações automáticas desligadas"
fi

# --------------------------- 7. abre agora ---------------------------
passo 7 "Abrindo a tela agora"
if [ -n "${DISPLAY:-}${WAYLAND_DISPLAY:-}" ]; then
  nohup "$BIN" >/dev/null 2>&1 &
  disown || true
  verde "tela abrindo"
else
  amarelo "sem sessão gráfica neste terminal: a tela abre no próximo login"
fi

echo
printf '\033[32m  Pronto. Em alguns segundos aparece o CÓDIGO na tela.\n  No painel EXA: Telas > Adicionar tela > digite o código.\033[0m\n'
echo "  Para desfazer: curl -fsSL https://examidia.com.br/tela-instalar/instalar-exa-tela-linux.sh | bash -s -- --desinstalar"
