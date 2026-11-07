#!/bin/bash
# Pacote do painel v39 (07/11/2026): SÓ o widget de clima (scripts/clima.js v12).
# - "agora" pelo Open-Meteo a cada 10 min, olhando a próxima hora (a API antiga dizia "chuva passageira fraca" em tempestade)
# - alerta ativo do INMET/Defesa Civil para Foz (IBGE 4108304): faixa com a cor oficial e, a cada 3 s, o card inteiro vira o alerta
# O zip tem só ui/scripts/clima.js: o resto da tela não muda.
# Rodar no CloudShell:  bash <(curl -fsS https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v39/publicar_v39.sh)
set -euo pipefail
RAW=https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v39
rm -rf ~/ui/pkg_v39 && mkdir -p ~/ui/pkg_v39 && cd ~/ui/pkg_v39
curl -fsS "$RAW/ui_v39_clima.zip" -o ui_v39_clima.zip
curl -fsS "$RAW/ui_v39_clima.zip.sha256" -o ui_v39_clima.zip.sha256
sha256sum -c ui_v39_clima.zip.sha256
unzip -l ui_v39_clima.zip | tail -1
unzip -p ui_v39_clima.zip ui/scripts/clima.js | grep -c apiprevmet3
aws s3 cp ui_v39_clima.zip s3://sistema-update/ui_v39_clima.zip --only-show-errors
curl -sI https://sistema-update.s3.sa-east-1.amazonaws.com/ui_v39_clima.zip | head -1
echo "OK: pacote no S3. Próximo passo: release no ExaSistema (teste em 1 prédio, depois a frota)."
