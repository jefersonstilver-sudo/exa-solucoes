

# Auditoria Profunda: Video Management (Delete, Real-time, Performance, UX)

## Problemas Identificados

### 1. Botão de deletar vídeo rejeitado NÃO FUNCIONA (Alta Severidade)

**Causa raiz**: Em `useOrderVideoManagement.tsx` linha 265, o `removeVideo` chama `supabase.rpc('can_remove_video')` antes de permitir a remoção. Se essa RPC retorna `false` para vídeos rejeitados (ou se ela nem existe no banco), a remoção é bloqueada silenciosamente -- o erro é capturado no `catch` (linha 283) mas o toast não é exibido ao usuário porque o `throw error` propaga para `VideoManagementCard.tsx` que não trata o erro.

Além disso, em `useVideoManagement.tsx` linha 173, o `disabled={slot.is_base_video}` no botão pode estar incorretamente desabilitando o botão se o campo `is_base_video` estiver `true` mesmo para vídeos rejeitados.

**Correção**:
- No `removeVideo` do `useOrderVideoManagement.tsx`: para vídeos rejeitados (`approval_status === 'rejected'`), pular a validação da RPC e permitir remoção direta
- No `VideoSlotActions.tsx` linha 173: permitir remover vídeos rejeitados independente de `is_base_video`
- Adicionar toast.error no catch para feedback ao usuário

### 2. Chamadas RPC excessivas -- LOOP de Performance (Alta Severidade)

**Evidência**: O network log mostra 20+ chamadas a `get_current_display_video` por segundo, todas para o mesmo `pedido_id`.

**Causa raiz**: 
- Cada `VideoSlotCard` instancia `useCurrentVideoDisplay` (linha 82-87), que faz uma chamada RPC + interval de 60s
- O `VideoSlotGrid` também instancia `useCurrentVideoDisplay` (linha 68)
- O `useEffect` na linha 108-113 do Grid chama `refreshCurrentVideo()` quando `videoSlots` muda, causando re-renders em cascata

**Correção**:
- Mover `useCurrentVideoDisplay` para APENAS o `VideoSlotGrid` (1 instância por pedido)
- Passar `currentDisplayVideoId` como prop ao `VideoSlotCard` (já existe a prop, mas o card ignora e cria seu próprio hook)
- Remover o `useCurrentVideoDisplay` de dentro do `VideoSlotCard`

### 3. Sem real-time updates nem animações (Média Severidade)

**Estado atual**: Não há subscription Supabase na página de gestão de vídeos. Mudanças (aprovação, rejeição, novos uploads) só aparecem com reload manual.

**Correção**:
- Em `useVideoManagement.tsx`: adicionar subscription Supabase em `pedido_videos` para o `orderId` com auto-refresh dos slots
- Adicionar animações CSS minimalistas: `animate-fade-in` quando um slot muda de estado, pulse verde para aprovação, pulse vermelho para rejeição

### 4. Console.log excessivo (Baixa Severidade)

Cada render do `VideoSlotCard` emite 2 console.logs (linhas 122-134 e 154-164). Com 10 slots, são 20 logs por render, contribuindo para lentidão.

**Correção**: Remover ou converter para `devLog` condicional.

## Plano de Implementação

### Arquivo 1: `src/hooks/useVideoManagement.tsx`
- Adicionar subscription real-time em `pedido_videos` filtrado por `orderId`
- No callback, recarregar slots automaticamente com debounce de 500ms
- Para vídeos rejeitados no `handleRemove`: pular validação de `is_base_video`

### Arquivo 2: `src/hooks/useOrderVideoManagement.tsx`
- No `removeVideo`: se `slot.approval_status === 'rejected'`, pular a chamada `can_remove_video` e ir direto para `handleRemove`
- Adicionar toast.error no catch para feedback ao usuário

### Arquivo 3: `src/components/video-management/VideoSlotActions.tsx`
- Linha 173: mudar `disabled={slot.is_base_video}` para `disabled={slot.is_base_video && slot.approval_status === 'approved'}`

### Arquivo 4: `src/components/video-management/VideoSlotCard.tsx`
- Remover import e uso de `useCurrentVideoDisplay` (usar prop `currentDisplayVideoId` que já recebe)
- Remover console.logs de debug (linhas 122-134, 154-164)
- Adicionar classes de animação: `animate-fade-in` no card wrapper

### Arquivo 5: `src/components/video-management/VideoSlotGrid.tsx`
- Manter `useCurrentVideoDisplay` aqui (já existe)
- Remover `useEffect` que causa re-render loop (linhas 108-113) -- o real-time subscription no hook já cuida disso
- Remover console.logs de debug

### Arquivo 6: `src/components/order/VideoManagementCard.tsx`
- Sem mudanças estruturais, apenas garantir que `onRemove` propague erros corretamente com toast

| Arquivo | Mudança | Impacto |
|---------|---------|---------|
| `useVideoManagement.tsx` | Real-time subscription + fix delete rejected | Alto |
| `useOrderVideoManagement.tsx` | Skip RPC for rejected + toast errors | Alto |
| `VideoSlotActions.tsx` | Allow delete rejected videos | Alto |
| `VideoSlotCard.tsx` | Remove duplicate hook + logs + add animations | Alto (performance) |
| `VideoSlotGrid.tsx` | Remove re-render loop + logs | Alto (performance) |

