

# Diagnóstico e Plano: Sincronização AWS + Botão "Sincronizar API"

## Problemas Encontrados

### 1. Programação hardcoded só com dias úteis na `sync-buildings-external-api`
A Edge Function `sync-buildings-external-api` (linhas 142-148) envia a programação hardcoded **apenas segunda a sexta**, ignorando sábado e domingo:
```
programacao: {
  segunda: [{ inicio: "00:00", fim: "23:59" }],
  terca: [{ inicio: "00:00", fim: "23:59" }],
  quarta: [{ inicio: "00:00", fim: "23:59" }],
  quinta: [{ inicio: "00:00", fim: "23:59" }],
  sexta: [{ inicio: "00:00", fim: "23:59" }]
  // ❌ FALTA: sabado e domingo
}
```
Enquanto a `upload-video-to-external-api` usa `getDefaultSchedule()` que envia **todos os 7 dias** corretamente (usando o `dayMap` com domingo a sábado). Essa inconsistência faz com que vídeos sincronizados via `sync-buildings` percam a programação de fim de semana.

### 2. Nomes de dias com acento vs sem acento
Na `upload-video-to-external-api`, o `dayMap` usa `'terça'` e `'sábado'` (com acentos), enquanto na `sync-buildings-external-api` usa `'terca'` e `'sexta'` (sem acentos). Se a API AWS espera um formato específico, essa diferença pode causar conflitos.

### 3. Botão "Sincronizar API" não existe
Não há nenhum botão de resincronização na lista de pedidos admin (`MinimalOrderCard`). O hook `useOrderBuildingsManagement.ts` tem a função `resyncVideoStatus` pronta, mas não é chamada em nenhum componente da lista.

## Plano de Correção

### Arquivo 1: `supabase/functions/sync-buildings-external-api/index.ts`
- Substituir o bloco hardcoded de `programacao` (linhas 142-148) por uma programação completa de 7 dias, incluindo sábado e domingo
- Padronizar os nomes dos dias para o mesmo formato usado pela `upload-video-to-external-api` (com acentos: `terça`, `sábado`)

### Arquivo 2: `src/components/admin/orders/components/MinimalOrderCard.tsx`
- Adicionar um botão "Sincronizar API" (ícone `RefreshCw`) ao lado do botão "Ver", visível apenas para pedidos com status ativo
- O botão invocará `supabase.functions.invoke('sync-buildings-external-api', { body: { pedido_id, action: 'add', building_ids: lista_predios } })`
- Mostrar toast de sucesso/erro
- Spinner durante a operação

### Arquivo 3: `src/components/admin/orders/OrderMobileCard.tsx`
- Adicionar o mesmo botão "Sincronizar API" na versão mobile do card

### Detalhes técnicos da programação corrigida
```typescript
// sync-buildings-external-api - bloco corrigido
programacao: {
  domingo: [{ inicio: "00:00", fim: "23:59" }],
  segunda: [{ inicio: "00:00", fim: "23:59" }],
  terça: [{ inicio: "00:00", fim: "23:59" }],
  quarta: [{ inicio: "00:00", fim: "23:59" }],
  quinta: [{ inicio: "00:00", fim: "23:59" }],
  sexta: [{ inicio: "00:00", fim: "23:59" }],
  sábado: [{ inicio: "00:00", fim: "23:59" }]
}
```

### Arquivos modificados
1. `supabase/functions/sync-buildings-external-api/index.ts` — corrigir programação
2. `src/components/admin/orders/components/MinimalOrderCard.tsx` — adicionar botão sync
3. `src/components/admin/orders/OrderMobileCard.tsx` — adicionar botão sync mobile

