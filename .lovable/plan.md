

# Corrigir Pipeline de Logs de Reprodução + Visual de Agendamento

## Causa Raiz dos Zeros

A edge function `log-video-playback` funciona (testei agora e inseriu com sucesso), os painéis estão online, MAS a edge function **nunca recebeu uma chamada real**. O problema está no `usePlaybackLogger.ts`:

1. Os `.catch(() => {})` engolem erros silenciosamente — nunca sabemos se falhou
2. O `flushBuffer` faz `supabase.functions.invoke()` que pode estar falhando por timeout ou erro de rede nos painéis físicos, sem nenhum log
3. O `onVideoEnd` limpa `currentVideoRef` antes do flush terminar — race condition

## Mudanças

### 1. Corrigir `usePlaybackLogger.ts` — Pipeline de Logging
- Remover todos os `.catch(() => {})` e substituir por `console.error`
- Adicionar `console.log` no `onVideoStart` e `flushBuffer` para diagnóstico
- Corrigir race condition: garantir que o delta é calculado e enfileirado **antes** de limpar os refs
- Nos handlers de `visibilitychange`/`pagehide`, usar `navigator.sendBeacon` como fallback (mais confiável que `supabase.functions.invoke` em contexto de saída de página)

### 2. Multiplicar Exibições por Número de Painéis (`useVideoReportData.ts`)
- Cada log representa 1 reprodução em 1 painel
- Se o prédio tem `quantidade_telas > 1`, os logs já devem vir separados por painel
- MAS se o sistema grava 1 log por building (não por tela), multiplicar:
  ```
  exibicoesPorVideo = logsDoVideo.length * totalTelasDosPredios
  ```
- Usar `buildingInfos` para somar `quantidade_telas` e multiplicar as métricas totais

### 3. Visual de Vídeo Agendado (`VideoListItem.tsx`)
- Quando `scheduleInfo` começa com "Agendado", aplicar borda colorida visível:
  - `border-2 border-blue-400 bg-blue-50/30` para cards agendados
  - `border-2 border-yellow-400 bg-yellow-50/30` para vídeo base
- O card fica visualmente distinto dos inativos e dos 24/7

### 4. Logs de Agendamento (`VideoManagementLogs.tsx`)
- Já existe a tabela `video_management_logs` e o componente `VideoManagementLogs`
- Garantir que ações de agendamento (criar, editar, ativar, desativar regra) são registradas
- Verificar se o hook de schedule update faz `insert` na tabela de logs

### 5. Registro de Exibições no Display (`MinimalDisplayPanel.tsx`)
- Adicionar logging de diagnóstico: `console.log` quando `onPlay` dispara
- Garantir que `onVideoEnd` chama `onVideoEnd()` do logger corretamente

## Arquivos Modificados

1. **`src/hooks/usePlaybackLogger.ts`** — Corrigir flush silencioso, adicionar console logs, sendBeacon fallback
2. **`src/hooks/useVideoReportData.ts`** — Multiplicar exibições por `quantidade_telas` dos prédios
3. **`src/components/advertiser/VideoListItem.tsx`** — Borda colorida para vídeos agendados
4. **`src/pages/public/MinimalDisplayPanel.tsx`** — Console logs de diagnóstico no player

## Detalhes Técnicos

### Multiplicação por painéis
```text
totalTelas = soma(building.quantidade_telas) para cada prédio do pedido
exibicoesPorVideo = playbackLogs.filter(video_id).length * totalTelas
totalExibicoes = allLogs.length * totalTelas
```

### Visual do card agendado
```text
Agendado:  border-2 border-blue-400 bg-blue-50/50 (contorno azul visível)
Base:      border-2 border-yellow-400 bg-yellow-50/50 (contorno amarelo)
24/7:      border padrão (sem destaque extra)
Inativo:   opacity-60 bg-muted/30 (como está)
```

### sendBeacon fallback para flush
```text
// Em pagehide/visibilitychange hidden:
const url = `${SUPABASE_URL}/functions/v1/log-video-playback`;
navigator.sendBeacon(url, JSON.stringify({ logs }));
// Mais confiável que fetch/invoke em contexto de saída
```

## Impacto
- 4 arquivos modificados
- Nenhuma migration
- Corrige o pipeline de dados que está impedindo logs reais
- Adiciona multiplicação por painéis nas métricas

