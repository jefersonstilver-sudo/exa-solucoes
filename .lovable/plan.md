

# Plano: Corrigir sincronizacao do video ativo com a API externa

## Problema

O banco de dados mostra `selected_for_display: true` para VIDEO 1 KAMMER, mas o sistema de agendamento (RPC `get_current_display_video`) determina que VIDEO 2 KAMMER e o video em exibicao. A Edge Function `sync-buildings-external-api` usa `pv.selected_for_display` para definir `ativo`, enviando VIDEO 1 como ativo=true -- incorreto.

Alem disso, a sincronizacao so ocorre quando predios sao adicionados/removidos. Nao ha mecanismo para re-sincronizar quando o video em exibicao muda.

## Alteracoes

### 1. Edge Function `sync-buildings-external-api/index.ts` - Usar RPC para determinar `ativo`

No bloco `action === 'add'`, apos buscar os videos:
- Chamar a RPC `get_current_display_video` com o `pedido_id`
- Usar o `video_id` retornado pela RPC para definir `ativo: true` apenas no video correto
- Todos os outros videos recebem `ativo: false`

```text
// Antes (errado):
ativo: pv.selected_for_display === true

// Depois (correto):
const currentDisplay = await supabase.rpc('get_current_display_video', { p_pedido_id })
ativo: currentDisplayVideoId === pv.video_id
```

### 2. Nova action `update_status` na Edge Function

Adicionar uma terceira action alem de `add` e `remove` para permitir re-sincronizar o status ativo dos videos sem re-enviar os arquivos. Esta action:
- Chama a API externa com endpoint de atualizacao de metadados (ou re-envia com os mesmos arquivos)
- Usa a RPC para determinar qual video esta ativo agora

### 3. Hook `useOrderBuildingsManagement.ts` - Expor funcao de re-sync

Adicionar funcao `resyncVideoStatus` que chama a edge function com `action: 'add'` e os `building_ids` do pedido atual, forcando re-envio com metadados corretos.

### 4. Trigger automatico (opcional)

Adicionar chamada de re-sync no hook de agendamento quando o video em exibicao muda, ou expor um botao "Resincronizar API" no painel admin.

## Arquivos alterados

1. `supabase/functions/sync-buildings-external-api/index.ts` - usar RPC para `ativo`
2. `src/hooks/useOrderBuildingsManagement.ts` - adicionar `resyncVideoStatus`

