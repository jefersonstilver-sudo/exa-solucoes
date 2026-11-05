#!/bin/bash
# Pacote do painel v38 (05/11/2026): SÓ o desenhista dos avisos do Nando (renderer v37).
# Traz para as telas o que nunca tinha chegado desde o v33 (24/10): logo do condomínio (v35),
# fundo branco "claro" (v36) e o estilo "suave" animado (v37, cartões do Omoiru).
# O zip tem só ui/aviso-nando.css e ui/scripts/aviso-nando.js: o resto da tela não muda.
# Rodar no CloudShell:  bash <(curl -fsS https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v38/publicar_v38.sh)
set -euo pipefail
RAW=https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v38
rm -rf ~/ui/pkg_v38 && mkdir -p ~/ui/pkg_v38 && cd ~/ui/pkg_v38
curl -fsS "$RAW/ui_v38_nando.zip" -o ui_v38_nando.zip
curl -fsS "$RAW/ui_v38_nando.zip.sha256" -o ui_v38_nando.zip.sha256
sha256sum -c ui_v38_nando.zip.sha256
unzip -l ui_v38_nando.zip | tail -1
unzip -p ui_v38_nando.zip ui/aviso-nando.css | grep -c aviso-nando-camada
aws s3 cp ui_v38_nando.zip s3://sistema-update/ui_v38_nando.zip --only-show-errors
curl -sI https://sistema-update.s3.sa-east-1.amazonaws.com/ui_v38_nando.zip | head -1
echo "OK: pacote no S3. Próximo passo: SQL da release (teste no Omoiru) no ExaSistema."
