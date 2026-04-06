

# Plano: Pedido Master (Auto-Aprovação de Vídeos)

## Resumo

Adicionar uma flag `is_master` na tabela `pedidos`. Quando ativada pelo admin, vídeos enviados para esse pedido são automaticamente aprovados (sem passar pela fila de aprovação). Um emblema dourado "MASTER" será exibido no relatório do pedido e na lista de pedidos.

## Arquitetura

```text
[Admin clica "Ativar Master"] 
    → Edge Function toggle-pedido-master
    → UPDATE pedidos SET is_master = true
    → Log em user_activity_logs

[Cliente faz upload de vídeo]
    → videoUploadService.ts verifica pedido.is_master
    → Se master: approval_status = 'approved' (em vez de 'pending')
    → Vídeo já fica disponível sem aprovação manual
```

## Etapas

### 1. Migração SQL
- Adicionar coluna `is_master BOOLEAN DEFAULT FALSE` na tabela `pedidos`
- Sem RLS adicional necessária (tabela já possui políticas de admin)

### 2. Edge Function `toggle-pedido-master`
- Recebe `{ pedido_id, is_master }` 
- Valida JWT e verifica role admin via `has_role`
- Faz UPDATE em `pedidos.is_master`
- Registra ação em `user_activity_logs`
- Retorna o estado atualizado

### 3. Upload Service (`src/services/videoUploadService.ts`)
- Antes do upsert em `pedido_videos`, consultar `pedidos.is_master`
- Se `is_master === true`: usar `approval_status: 'approved'` no insert
- Caso contrário: manter `approval_status: 'pending'` (comportamento atual)

### 4. Hook `useRealOrderDetails.ts`
- Incluir `is_master` na query do pedido e expor no retorno

### 5. UI — Botão Toggle + Emblema (`ProfessionalOrderReport.tsx`)
- Na seção de header (após o badge de status), adicionar:
  - Emblema dourado "MASTER" quando `is_master === true`
  - Botão toggle "Ativar/Desativar Master" na seção de informações do pedido
  - Ícone de coroa/escudo dourado para diferenciação visual
- O toggle chama a Edge Function e atualiza via `refetch`

### 6. Interface `OrderData`
- Adicionar `is_master?: boolean` nas interfaces de `ProfessionalOrderReport.tsx` e `useRealOrderDetails.ts`

## Arquivos afetados

| Arquivo | Alteração |
|---|---|
| **Migração SQL** (nova) | `ALTER TABLE pedidos ADD COLUMN is_master` |
| `supabase/functions/toggle-pedido-master/index.ts` | Nova Edge Function |
| `src/services/videoUploadService.ts` | Checar `is_master` antes do upsert |
| `src/hooks/useRealOrderDetails.ts` | Expor `is_master` na query |
| `src/components/admin/orders/ProfessionalOrderReport.tsx` | Badge + botão toggle |

## O que NÃO será alterado
- Fluxo de aprovação manual existente
- Páginas de aprovação (`RealPendingVideosSection`, etc.)
- UI do cliente/anunciante
- Qualquer outra interface ou funcionalidade existente

