#!/bin/bash
# Pacote do painel v40 (07/11/2026): clima v12.1 — igual ao v39 + o alerta de chuva/tempestade só toma o card inteiro se o tempo estiver ruim agora ou nas próximas 3 h.
# - "agora" pelo Open-Meteo a cada 10 min, olhando a próxima hora (a API antiga dizia "chuva passageira fraca" em tempestade)
# - alerta ativo do INMET/Defesa Civil para Foz (IBGE 4108304): faixa com a cor oficial e, a cada 3 s, o card inteiro vira o alerta
# O zip tem só ui/scripts/clima.js: o resto da tela não muda.
# Rodar no CloudShell:  bash <(curl -fsS https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v40/publicar_v40.sh)
set -euo pipefail
RAW=https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/main/painel-nuc/v40
rm -rf ~/ui/pkg_v40 && mkdir -p ~/ui/pkg_v40 && cd ~/ui/pkg_v40
curl -fsS "$RAW/ui_v40_clima.zip" -o ui_v40_clima.zip
curl -fsS "$RAW/ui_v40_clima.zip.sha256" -o ui_v40_clima.zip.sha256
sha256sum -c ui_v40_clima.zip.sha256
unzip -l ui_v40_clima.zip | tail -1
unzip -p ui_v40_clima.zip ui/scripts/clima.js | grep -c apiprevmet3
aws s3 cp ui_v40_clima.zip s3://sistema-update/ui_v40_clima.zip --only-show-errors
curl -sI https://sistema-update.s3.sa-east-1.amazonaws.com/ui_v40_clima.zip | head -1
echo "OK: pacote no S3. Próximo passo: release no ExaSistema (teste em 1 prédio, depois a frota)."
