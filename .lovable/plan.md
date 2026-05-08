# Liberar todos os 10 slots de vídeo para pedidos verticais

## Causa raiz

A função `validateSlotCapacity` em `src/services/videoUploadService.ts` (linha 52-66) lê `produtos_exa.max_videos_por_pedido` e bloqueia qualquer slot acima desse valor.

Estado atual no banco:
- `horizontal` → `max_videos_por_pedido = 10` ✅
- `vertical_premium` → `max_videos_por_pedido = 1` ❌ (causa do erro)

O pedido `b4b2f33a-d37d-40a8-98fb-77177fa0b35f` é `vertical_premium`, daí o bloqueio do Slot 2.

## Correção (1 alteração, sem mexer em UI/lógica)

**Migração SQL** atualizando o produto vertical para o mesmo padrão do horizontal (alinhado à política "Max 10 video slots per order"):

```sql
UPDATE produtos_exa
SET max_videos_por_pedido = 10
WHERE codigo = 'vertical_premium';
```

## Validação

Após aplicar a migração:
1. Recarregar `/anunciante/pedido/b4b2f33a-d37d-40a8-98fb-77177fa0b35f`
2. Tentar upload no Slot 2 — deve aceitar (e até o Slot 10)
3. Verificar que pedidos `horizontal` continuam aceitando 10 slots (sem regressão)

## Fora do escopo

- Não alterar nenhuma UI, fluxo de upload, trimmer ou validações de status do pedido.
- Não mexer em `videoUploadService.ts` — a lógica está correta; apenas o dado do produto está errado.
