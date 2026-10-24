# Painel do elevador (NUC) – arquivos alterados para o Nando

Cópia dos arquivos do pacote do painel (`ui_vNN_nando.zip`, bucket `sistema-update`) que mudaram por causa do Nando.
Não é publicado pelo site: serve para montar o pacote no CloudShell com a mesma versão conferida.

- `ui/scripts/avisos.js` – v30: reconhece `CondominiumNotices/nando_*.png`, lê o aviso dentro do PNG, corta as margens brancas do PDF.
- `ui/scripts/aviso-nando.js` e `ui/aviso-nando.css` – cópias EXATAS de `public/nando/` (mesmo desenhador da prévia do site).
  O CSS tem as regras da camada do painel (`.aviso-nando-camada`). Sem elas o aviso aparece gigante e cortado (erro da v30).
  Antes de subir um pacote, confira: `grep -c aviso-nando-camada ui/aviso-nando.css` tem que dar 2 ou mais.
