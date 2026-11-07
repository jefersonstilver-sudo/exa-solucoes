#!/bin/bash
# Pacote do painel v41 (07/11/2026): clima v12.1 + quadro de câmbio (K2 · Fortuna Jebai · cripto) no lugar das
# Notícias Brasil em voltas alternadas — só liga nos clientes da lista CLIENTES_NUC do scripts/peca.js (teste: Renoir cd19).
# O zip tem só ui/scripts/clima.js e ui/scripts/peca.js. O quadro abre de https://examidia.com.br/painel-web/pecas/cambio.html.
# Rodar no CloudShell:  bash <(curl -fsS https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v41/publicar_v41.sh)
set -euo pipefail
RAW=https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v41
rm -rf ~/ui/pkg_v41 && mkdir -p ~/ui/pkg_v41 && cd ~/ui/pkg_v41
curl -fsS "$RAW/ui_v41_cambio.zip" -o ui_v41_cambio.zip
curl -fsS "$RAW/ui_v41_cambio.zip.sha256" -o ui_v41_cambio.zip.sha256
sha256sum -c ui_v41_cambio.zip.sha256
unzip -l ui_v41_cambio.zip | tail -1
unzip -p ui_v41_cambio.zip ui/scripts/peca.js | grep -c cd19
aws s3 cp ui_v41_cambio.zip s3://sistema-update/ui_v41_cambio.zip --only-show-errors
curl -sI https://sistema-update.s3.sa-east-1.amazonaws.com/ui_v41_cambio.zip | head -1
echo "OK: pacote no S3."
