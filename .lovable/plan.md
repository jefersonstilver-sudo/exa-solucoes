

# Corrigir Exibições: Fórmula do Ciclo Real + Bugs de Zero

## Problemas Encontrados

### 1. `quantidade_telas = 0` mata tudo
Três prédios no banco têm `quantidade_telas = 0` (ENTRADA, COMERCIAL TABLET, SALA REUNIÃO). Como `totalTelas = soma(quantidade_telas)`, se um pedido só tem esses prédios, o total fica 0 e **todas as exibições = 0**.

**Fix**: `Math.max(1, b.quantidade_telas || 1)` ao mapear buildings.

### 2. Fórmula atual está errada
O código atual usa:
```
exibicoesPorDiaPorTela = (21h × 3600) / (10s × 15) = 504
```
Isso ignora os vídeos verticais intercalados no loop. A estrutura real é:

```text
1 ciclo = [15H × 10s] + [1V × 10s] + [15H × 10s] + [1V × 10s] + [15H × 10s] + [1V × 10s]
        = (15 × 10 × 3) + (3 × 10) = 480s = 8 min

Ciclos/dia (21h) = 75.600 / 480 = 157
Horizontal: 157 × 3 = 471 exibições/dia/tela
Vertical:   157 × 1 = 157 exibições/dia/tela
```

**Fix**: Implementar fórmula do ciclo completo usando ambos os produtos (horizontal + vertical_premium).

### 3. Gráfico mostra linha reta
Como o cálculo é operacional (mesmo valor todo dia), o gráfico fica flat. Precisa mostrar **acumulado** para que o número "suba" ao longo do período.

### 4. Status `video_aprovado` não está no filtro
O query filtra `.in('status', ['ativo', 'pendente', 'pago_pendente_video'])` — falta `video_aprovado`.

## Mudanças

### `src/hooks/useVideoReportData.ts`
1. **Default `quantidade_telas`** para `Math.max(1, valor)` (linha ~266)
2. **Substituir fórmula simples** pela fórmula de ciclo real:
   ```
   cycleTime = maxV × (maxH × duracaoH + duracaoV)
   cyclesPerDay = floor(horasOperacao × 3600 / cycleTime)
   exibH = cyclesPerDay × maxV (aparece em cada round)
   exibV = cyclesPerDay × 1
   ```
3. **Adicionar `video_aprovado`** ao filtro de status (linha ~182)
4. **Gráfico acumulativo**: cada ponto do timeline mostra total acumulado até aquele dia

### `src/components/advertiser/CampaignPerformanceChart.tsx`
- Tooltip e label ajustados para "Exibições acumuladas"

### `src/pages/advertiser/MyVideos.tsx`
- Incluir hoje no `dateRange.end` (atualmente é `subDays(new Date(), 1)` = ontem). Mudar para `new Date()`.

## Fórmula Técnica Final

```text
# Dados do banco
maxH = 15 (horizontal.max_clientes_por_painel)
maxV = 3  (vertical_premium.max_clientes_por_painel)
duracaoH = 10s
duracaoV = 15s (ou 10s conforme produto)
horasOp = 21h

# Ciclo
cycleTime = maxV × (maxH × duracaoH + duracaoV)
         = 3 × (15 × 10 + 10) = 480s

cyclesPerDay = floor(75600 / 480) = 157

# Por vídeo por tela por dia
exibicoesDiaH = 157 × 3 = 471
exibicoesDiaV = 157 × 1 = 157

# Total por vídeo (período × telas)
exibicoesVideo = exibicoesDia × diasAtivos × totalTelas × coverage
```

## Arquivos Modificados
- `src/hooks/useVideoReportData.ts` — Fórmula ciclo, default telas, status filter, acumulado
- `src/components/advertiser/CampaignPerformanceChart.tsx` — Labels acumulado
- `src/pages/advertiser/MyVideos.tsx` — dateRange inclui hoje

## Impacto
- Zero exibições eliminado definitivamente
- Números batem com a lógica real do loop H+V
- Gráfico mostra crescimento ao longo do tempo
- Sem migration

