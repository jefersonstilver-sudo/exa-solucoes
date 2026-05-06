## Diagnóstico

Sim, identifiquei a tabela no Notion (`Prédios Painéis`, ID `1d6f9e03-8d81-813f-ad60-ff2fa347c3f5`). Ela tem uma propriedade do tipo `select` chamada **AIRBNB** com as opções `SIM` e `NAO`.

Testei a edge function `catalogo-predios` em produção e ela já está retornando `temAirbnb: true` para os prédios marcados como `SIM` no Notion — atualmente **5 prédios** (ex.: Cheverny 2, Saint Peter, etc.) de 101 retornam o flag corretamente.

A página `/catalogo` (`src/pages/Catalogo.tsx`, linhas 137-141) já renderiza o `<SeloAirbnb size="xl" />` no canto superior direito do card quando `p.temAirbnb` é `true`, usando o **mesmo componente** da loja pública (`src/components/shared/SeloAirbnb.tsx` → `/selos/airbnb.png`).

Ou seja: o pipeline Notion → edge function → frontend já está completo e funcionando. Se o selo não está aparecendo no seu navegador, é provavelmente cache da edge function (a resposta tem `Cache-Control: max-age=600`).

## Plano

1. **Forçar refresh do cache** — adicionar um query param `?v=timestamp` na chamada do `catalogo-predios` no frontend para invalidar cache antigo de respostas sem `temAirbnb`, OU reduzir o `max-age` para 60s.
2. **Garantir que o selo fique visível por cima do gradient overlay** — o `.cat-card-photo::after` (gradient escuro) pode estar competindo no z-index. Reforçar `zIndex` do wrapper do selo para `5` e adicionar `pointer-events:none` ao overlay (já tem).
3. **Verificar visualmente** após deploy se os 5 prédios marcados como `AIRBNB = SIM` no Notion aparecem com o selo no `/catalogo`.

Nenhuma alteração de UI/workflow não relacionada será feita.
