<final-text>
## Objetivo
Fazer o relatório parar de zerar pedidos ativos com vídeo e passar a mostrar exibições em tempo real conforme a lógica real do sistema, multiplicadas pelo número de painéis, sem mexer em fluxos fora desse problema.

## Causa raiz confirmada
1. `useVideoReportData.ts` hoje zera tudo quando `video_playback_logs` está vazio.
2. As rotas públicas mais usadas (`/:slug/:code` e `/comercial/:slug/:code`) renderizam `BuildingDisplayCommercial`, e esse fluxo não usa `usePlaybackLogger`; só o `/painel/...` registra playback.
3. O texto “dados disponíveis até ontem” e o corte em ontem fazem sentido para auditoria por logs, mas não para o número operacional que o usuário quer ver subindo em tempo real.
4. `video_management_logs` só é lido; não há inserts reais das ações de agendamento/base.

## Plano de implementação
### 1) Trocar a métrica principal do relatório
Em `src/hooks/useVideoReportData.ts`, substituir o modelo “só logs reais” por “exibições do sistema” como fonte principal do card e da lista de vídeos.

O cálculo virá de:
- `produtos_exa` + `configuracoes_exibicao` (mesma lógica já usada em Produtos/Exibições)
- vídeos aprovados e elegíveis para exibição
- regras de agendamento
- vídeo base como fallback
- `quantidade_telas` dos prédios do pedido

Resultado: pedido ativo com vídeo exibível deixa de aparecer zerado.

### 2) Calcular exibições por vídeo de forma operacional
Para cada vídeo:
- vídeo agendado: contar a cobertura do horário/dia em que ele realmente entra
- vídeo base: usar o tempo restante não ocupado pelos vídeos agendados
- multiplicar sempre por `totalTelas`

Isso alimentará:
- número total da campanha
- número por vídeo
- gráfico diário/timeline

### 3) Fazer o número subir em tempo real
Remover o bloqueio da métrica principal “até ontem” e recalcular o acumulado incluindo o dia atual.
Para não sobrecarregar:
- recalcular localmente a cada 60s
- continuar usando realtime/refetch apenas quando pedidos, vídeos ou agendamentos mudarem

Se quiser manter a noção de auditoria, ela vira secundária:
- “Logs confirmados” separado
- não mais como trava do número principal

### 4) Corrigir a captura de playback real nas telas públicas
Expandir o logger para o fluxo comercial:
- ligar `usePlaybackLogger` também em `BuildingDisplayCommercial` / `CommercialVideoHero`
- manter `MinimalDisplayPanel` logando
- preservar `sendBeacon`/flush de saída

Isso não será a métrica principal do relatório, mas passa a alimentar a auditoria real do que tocou.

### 5) Registrar todo agendamento no histórico
Adicionar inserts reais em `video_management_logs` para:
- criar/editar programação
- ativar/desativar regra
- trocar vídeo base

Assim o “Log de Agendamentos” deixa de ser só uma tela vazia e passa a refletir o que ocorreu.

### 6) Ajustar apenas a UI diretamente ligada ao problema
Atualizar somente os componentes do relatório:
- `CampaignReportCard`
- `VideoListItem`
- `CampaignPerformanceChart`
- `MyVideos`

Mudanças:
- “Exibições” vira a métrica principal
- remover o estado visual enganoso de zero por falta de logs
- se houver mensagem sobre “até ontem”, deixá-la apenas para o bloco de logs/auditoria, não para o contador principal

## Fórmula técnica
```text
exibicoesPorDiaPorTela = cálculo oficial já existente em Produtos/Exibições

exibicoesVideoNoPeriodo =
  soma(dia a dia)(
    exibicoesPorDiaPorTela
    x coberturaDoVideoNoDia
    x totalTelas
  )

coberturaDoVideoNoDia:
- agendado = fração do dia coberta pela(s) regra(s)
- base = 1 - fração ocupada pelos agendados do mesmo pedido
```

## Arquivos-alvo
- `src/hooks/useVideoReportData.ts`
- `src/pages/advertiser/MyVideos.tsx`
- `src/components/advertiser/CampaignReportCard.tsx`
- `src/components/advertiser/VideoListItem.tsx`
- `src/components/advertiser/CampaignPerformanceChart.tsx`
- `src/hooks/usePlaybackLogger.ts`
- `src/pages/public/BuildingDisplayCommercial.tsx`
- `src/components/commercial/CommercialVideoHero.tsx`
- `src/services/videoScheduleManagementService.ts`
- `src/services/videoBaseService.ts`

## Impacto
- Resolve o problema central: pedido ativo com vídeo não fica zerado
- O número passa a subir conforme a programação real do sistema
- Playback logs continuam existindo, mas como auditoria secundária
- Sem alterar fluxos não relacionados
- Sem migration prevista, a menos que a tabela `video_management_logs` esteja faltando algum campo obrigatório para os inserts
</final-text>