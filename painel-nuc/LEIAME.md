# Painel do elevador (NUC) – arquivos alterados para o Nando

Cópia dos arquivos do pacote do painel (`ui_vNN_nando.zip`, bucket `sistema-update`) que mudaram por causa do Nando.
Não é publicado pelo site: serve para montar o pacote no CloudShell com a mesma versão conferida.

- `ui/scripts/avisos.js` – v30: reconhece `CondominiumNotices/nando_*.png`, lê o aviso dentro do PNG, corta as margens brancas do PDF.
- `ui/scripts/aviso-nando.js` e `ui/aviso-nando.css` – cópias EXATAS de `public/nando/` (mesmo desenhador da prévia do site).
  O CSS tem as regras da camada do painel (`.aviso-nando-camada`). Sem elas o aviso aparece gigante e cortado (erro da v30).
  Antes de subir um pacote, confira: `grep -c aviso-nando-camada ui/aviso-nando.css` tem que dar 2 ou mais.

## v38 (05/11/2026) – desenhista dos avisos v37
- `v38/ui_v38_nando.zip` tem SÓ `ui/aviso-nando.css` e `ui/scripts/aviso-nando.js` (cópias de `public/nando/`). O NUC extrai por cima: o resto da tela fica como está.
- Até aqui as telas estavam com o desenhista do v33 (24/10): logo do condomínio (v35), fundo branco (v36) e estilo suave (v37) não apareciam no elevador.
- Publicar: `v38/publicar_v38.sh` no CloudShell → release `version 47` primeiro no canal `ui_teste_v38` (só o Omoiru) → conferir → release `version 47` no `ui_teste_v10` (frota) e devolver o Omoiru ao `ui_teste_v10`.
- Regra daqui em diante: toda mudança no renderizador do Nando sai com um pacote `ui_vNN_nando.zip` só com esses 2 arquivos, no mesmo dia.
