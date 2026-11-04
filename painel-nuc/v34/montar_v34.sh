#!/bin/bash
# Monta o pacote do painel v34 (faixa "Nesta tela") a partir do pacote no ar (ui_v33_nando.zip). Rodar no CloudShell.
# Só ACRESCENTA: o bloco CSS v34 no fim do style.css, o scripts/marcas.js e 1 linha <script> no index.html.
set -euo pipefail
C=01faa53   # commit conferido
RAW=https://raw.githubusercontent.com/jefersonstilver-sudo/exa-solucoes/$C/painel-nuc/v34
rm -rf ~/ui/pkg_v34 && mkdir -p ~/ui/pkg_v34 && cd ~/ui/pkg_v34
aws s3 cp s3://sistema-update/ui_v33_nando.zip base.zip --only-show-errors
unzip -q base.zip -d pkg && rm base.zip
CSS=$(find pkg -path '*ui/style.css' | head -1); IDX=$(dirname "$CSS")/index.html; SCR=$(dirname "$CSS")/scripts
[ -f "$CSS" ] && [ -f "$IDX" ] && [ -d "$SCR" ] || { echo "ABORTADO: não achei ui/style.css, index.html ou scripts/"; exit 1; }
grep -q 'v34: faixa' "$CSS" && { echo "ABORTADO: o pacote base já tem o v34"; exit 1; }
[ "$(grep -c 'scripts/cotacao.js' "$IDX")" = "1" ] || { echo "ABORTADO: linha do cotacao.js não é única no index.html"; exit 1; }
curl -fsS "$RAW/v34.css" >> "$CSS"
curl -fsS "$RAW/marcas.js" -o "$SCR/marcas.js"
sed -i 's#\(.*\)<script src="./scripts/cotacao.js"></script>#&\n\1<script src="./scripts/marcas.js"></script>#' "$IDX"
grep -n 'marcas.js' "$IDX"; grep -c 'body.com-marcas' "$CSS"; grep -c 'aviso-nando-camada' "$(dirname "$CSS")/aviso-nando.css"
(cd pkg && zip -qr ../ui_v34_marcas.zip .)
unzip -l ui_v34_marcas.zip | tail -1
sha256sum ui_v34_marcas.zip
aws s3 cp ui_v34_marcas.zip s3://sistema-update/ui_v34_marcas.zip --only-show-errors
curl -sI https://sistema-update.s3.sa-east-1.amazonaws.com/ui_v34_marcas.zip | head -1
echo "OK: pacote no S3. Próximo passo: SQL da release no ExaSistema (canal de teste do Las Brisas)."
