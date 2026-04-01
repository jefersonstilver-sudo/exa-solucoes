

# Plano: Corrigir Erro de Upload — Constraint `slot_position` (1-4)

## Problema Identificado

O erro `"pedido_videos_slot_position_check"` ocorre porque:

1. O banco de dados tem uma constraint: `slot_position >= 1 AND slot_position <= 4`
2. O produto "Horizontal" define `max_videos_por_pedido: 4`
3. **MAS** o código inicializa `maxVideos` com valor **10** (padrão) antes de carregar o produto do banco
4. Isso faz a UI mostrar 10 slots (incluindo slots 5-10), e quando o usuário tenta fazer upload no slot 5+, o banco rejeita

O usuário tentou fazer upload no **slot 8** ("Vídeo 8" na screenshot), que viola a constraint.

## Correção

### 1. `src/hooks/useOrderVideoManagement.tsx`
- Mudar o valor padrão de `maxVideos` de **10** para **4** (linha 27)
- Isso garante que mesmo antes do produto carregar, a UI só mostra 4 slots

### 2. `src/services/videoSlotService.ts`
- Mudar o valor padrão de `maxSlots` de **10** para **4** (linha 5)
- Adicionar validação: `const safeMaxSlots = Math.min(maxSlots, 4)` para nunca ultrapassar o limite do banco

### 3. `src/services/videoUploadService.ts`
- Adicionar validação antes do upsert (antes da linha 242): se `slotPosition > 4`, rejeitar com mensagem clara ao invés de deixar o banco retornar erro críptico

## Impacto
- Apenas corrige o bug de slots excedendo o limite
- Nenhuma mudança de UI, funcionalidade ou workflow existente

