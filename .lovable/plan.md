

# Plano: Sincronização Automática Completa + Auditoria Master AWS

## Resumo

Garantir que TODOS os prédios de cada pedido recebam o vídeo correto na API AWS, com sincronização automática em tempo real a cada ação crítica, botão de auditoria global no header, cron job a cada 2 horas, e tabela de logs completa.

## O que será feito

### 1. Tabela de logs de auditoria (Migration SQL)
Criar tabela `api_sync_logs` com campos completos:
- `id`, `pedido_id`, `building_id`, `video_name`, `action` (add/remove/audit)
- `status` (success/error/skipped), `source` (manual/auto/cron/audit)
- `executed_by` (user_id, nullable para cron), `aws_response` (JSONB com resposta raw)
- `error_message`, `created_at`
- RLS: somente super_admin pode ler

### 2. Edge Function: `audit-sync-all-active-orders`
Nova Edge Function que:
- Busca todos os pedidos com status IN ('ativo', 'video_aprovado')
- Para pedidos com `is_master = true`, também inclui prédios dos sub-pedidos vinculados
- Para cada pedido, busca vídeos aprovados e `lista_predios`
- Chama `sync-buildings-external-api` (action: 'add') para cada pedido
- Se o prédio já tem o vídeo, a API AWS ignora silenciosamente (sem erro)
- Registra resultado completo na tabela `api_sync_logs`
- Retorna relatório: `{ total_orders, synced, failed, details[] }`

### 3. Cron Job: auditoria automática a cada 2 horas
- Usar `pg_cron` + `pg_net` para chamar `audit-sync-all-active-orders` a cada 2 horas
- Source registrado como 'cron' nos logs

### 4. Auto-sync no Frontend (após cada ação crítica)
Adicionar chamada automática ao `sync-buildings-external-api` após:

**a) `setBaseVideo`** (em `src/services/videoBaseService.ts`):
- Após a notificação via `sync-video-status-to-aws` ser bem-sucedida, adicionar uma chamada extra para `sync-buildings-external-api` com action='add' e TODOS os prédios do pedido
- Isso garante que o vídeo novo seja enviado para todos os prédios

**b) Aprovação de vídeo** (em `src/components/admin/approvals/RealPendingVideosSection.tsx`):
- Após o `auto-activate-first-video` retornar sucesso, chamar `sync-buildings-external-api` com todos os prédios
- Para vídeos subsequentes (não o primeiro), também disparar sync

**c) `addBuildings`** (em `src/hooks/useOrderBuildingsManagement.ts`):
- Já chama `sync-buildings-external-api` — apenas adicionar logging na tabela `api_sync_logs`

**d) `removeBuilding`** (em `src/hooks/useOrderBuildingsManagement.ts`):
- Já chama com action='remove' — adicionar logging e garantir remoção na AWS

### 5. Botão "Auditoria Geral API" no Header
Adicionar no `OrdersCompactHeader.tsx`:
- Novo item no DropdownMenu: "Auditoria Geral API" (ícone ShieldCheck, cor azul)
- Visível apenas para super_admin (verificar role do usuário)
- Ao clicar, abre `AuditSyncModal.tsx`

### 6. Modal de Auditoria (`AuditSyncModal.tsx`)
Novo componente com:
- Botão "Iniciar Auditoria" para confirmar
- Progress bar em tempo real durante a execução
- Lista de resultados: pedidos processados, prédios sincronizados, erros
- Ícones de status (check verde / X vermelho) por pedido
- Botão para fechar após conclusão

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| Migration SQL | **Criar** — tabela `api_sync_logs` + RLS |
| `supabase/functions/audit-sync-all-active-orders/index.ts` | **Criar** |
| `src/components/admin/orders/AuditSyncModal.tsx` | **Criar** |
| `src/components/admin/orders/OrdersCompactHeader.tsx` | **Editar** — adicionar item "Auditoria Geral API" |
| `src/services/videoBaseService.ts` | **Editar** — adicionar sync completo após setBaseVideo |
| `src/components/admin/approvals/RealPendingVideosSection.tsx` | **Editar** — adicionar sync após aprovação |
| `src/hooks/useOrderBuildingsManagement.ts` | **Editar** — adicionar logging de sync |
| SQL Insert (pg_cron) | **Executar** — cron job a cada 2 horas |

## Detalhes técnicos

### Fluxo do auto-sync (frontend)
```text
Ação do admin (ex: setBaseVideo)
  → RPC no banco (safe_set_base_video)
  → sync-video-status-to-aws (PATCH ativo/batch)
  → sync-buildings-external-api (POST add-to-specific-buildings) ← NOVO
  → Log na tabela api_sync_logs ← NOVO
```

### Pedidos Master
Para pedidos com `is_master = true`, a Edge Function de auditoria buscará pedidos filhos e incluirá seus `lista_predios` na sincronização, garantindo cobertura total.

