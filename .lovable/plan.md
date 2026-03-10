

# Fix: CHECK constraint bloqueando criação de pedidos + Confirmação de senha para status "Pago"

## Causa raiz

A constraint `pedidos_status_check` no banco permite apenas:
```
pendente, aguardando_contrato, aguardando_video, video_enviado, 
video_aprovado, ativo, finalizado, cancelado, cancelado_automaticamente, bloqueado
```

Mas o sistema inteiro usa `pago` e `pago_pendente_video` — que **não estão na constraint**. Qualquer insert com esses status falha.

## Correções

### 1. Migration: Atualizar CHECK constraint
Dropar e recriar `pedidos_status_check` incluindo `pago` e `pago_pendente_video`.

### 2. `OrderConfigSection.tsx` — Senha admin para status "Pago"
Quando o usuário selecionar "Pago (Aguard. Vídeo)" como status inicial:
- Exibir um Dialog inline pedindo a senha do admin master
- Validar a senha antes de permitir o status
- Se a senha estiver errada, reverter para "Pendente"

### 3. `useAdminCreateOrder.ts` — Log de auditoria para pagamento manual
Quando o pedido for criado com status pago:
- Inserir registro em `log_eventos_sistema` com tipo `MANUAL_PAYMENT_MARK`
- Registrar quem marcou, quando, e o valor

### 4. Status options cleanup
Ajustar as opções do select:
- `pendente` → Pendente (sem restrição)
- `pago_pendente_video` → Pago (Aguard. Vídeo) — **requer senha admin**

Remover opção `pago` avulsa (o fluxo correto é `pago_pendente_video`).

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Atualizar CHECK constraint com `pago` e `pago_pendente_video` |
| `OrderConfigSection.tsx` | Dialog de senha admin ao selecionar status pago |
| `useAdminCreateOrder.ts` | Log de auditoria para marcação manual de pagamento |

