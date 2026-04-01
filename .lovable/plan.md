

# Plano: Eliminar Dados Fictícios do Relatório de Campanha

## Problema

A função `calculateDisplayHours` (linha 145-178 de `useVideoReportData.ts`) gera valores fictícios quando não existem logs reais de playback. Ela assume 245 exibições/dia/tela, produzindo "40m50s" para um vídeo que tocou menos de 1 minuto na realidade.

A condição na linha 340-342 usa logs reais **quando existem**, mas o fallback na linha 344-353 inventa números.

## Solução

Eliminar a função `calculateDisplayHours` e o fallback fictício. Quando não há logs reais (`videoLogs.length === 0`), `horasExibidas = 0`.

### Arquivo: `src/hooks/useVideoReportData.ts`

1. **Linhas 336-354**: Substituir o bloco condicional:
   - Se `videoLogs.length > 0`: manter cálculo real (soma de `duration_seconds`)
   - Se `videoLogs.length === 0`: `horasExibidas = 0` (sem estimativa)

2. **Linhas 145-178**: Remover a função `calculateDisplayHours` (não será mais usada)

3. **Linhas 430-445**: Ajustar o cálculo de `totalExibicoes` que também usa estimativas fictícias (`totalTelas * 245 * diasAtivos`) — usar apenas COUNT real dos logs

4. **Adicionar badge "Sem dados"**: No `VideoListItem.tsx`, quando `horasExibidas === 0` e o vídeo está ativo/exibindo, mostrar "aguardando dados" em vez de "0s" para que o anunciante saiba que dados reais virão

## Impacto
- Apenas a seção de relatórios do anunciante
- Nenhuma mudança de UI, funcionalidade ou workflow fora do relatório

