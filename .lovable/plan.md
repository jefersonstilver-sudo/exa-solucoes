

# Fix: Status "pago" e "pago_pendente_video" bloqueando upload de vídeo

## Causa raiz

O `getOrderSecurityStatus()` em `videoUploadSecurityService.ts` (linhas 72-117) tem um mapa de status, mas **nao inclui `pago` nem `pago_pendente_video`**. Esses status caem no default:

```typescript
return { level: 'blocked', message: 'Status desconhecido', ... }
```

O componente `VideoManagementCard.tsx` (linha 42) verifica:
```typescript
const uploadAllowed = security.level === 'allowed' || security.level === 'active';
```

Como `pago`/`pago_pendente_video` retornam `blocked`, o upload fica bloqueado mesmo para pedidos pagos criados pelo admin.

Igualmente, `validateVideoUploadPermission()` (linha 35) lista os `allowedStatuses` sem incluir esses dois status.

## Correções

### 1. `videoUploadSecurityService.ts`
- Adicionar `pago` e `pago_pendente_video` ao `securityMap` com `level: 'allowed'`
- Adicionar ambos ao array `allowedStatuses` na funcao `validateVideoUploadPermission`

### 2. Nenhuma outra mudanca necessaria
O `VideoManagementCard.tsx` ja verifica `security.level === 'allowed'`, entao basta corrigir o mapeamento.

| Arquivo | Mudanca |
|---------|---------|
| `src/services/videoUploadSecurityService.ts` | Adicionar `pago` e `pago_pendente_video` ao mapa de seguranca e allowedStatuses |

