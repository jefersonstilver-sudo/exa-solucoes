

# Auditoria: `tipo_produto` ignorado em toda a cadeia de vídeo

## Diagnóstico

O pedido `7bac058a` foi criado como `tipo_produto: "vertical_premium"`, mas **toda a cadeia de upload e validação ignora esse campo**. O sistema trata TODOS os pedidos como horizontais.

### Pontos de falha identificados

```text
OrderDetails.tsx
  └─ loadOrderDetails() → pega `tipo_produto` do banco ✅
  └─ NÃO repassa `tipo_produto` para VideoManagementCard ❌

VideoManagementCard.tsx
  └─ NÃO recebe prop `tipo_produto` ❌
  └─ Texto hardcoded: "máx. 10s, horizontal, 100MB" ❌

VideoSlotGrid.tsx
  └─ NÃO recebe prop `tipo_produto` ❌

videoStorageService.ts (validateVideoFile)
  └─ Linha 85: `if (orientation !== 'horizontal')` HARDCODED ❌
  └─ Linha 80: `maxDuration = 10` HARDCODED ❌

videoUploadService.ts (uploadVideo)
  └─ NÃO recebe `tipo_produto` ❌
  └─ Chama validateVideoFile sem contexto de tipo ❌

videoValidationService.ts
  └─ JÁ suporta param `tipo` ✅ (mas nunca é usado pelo fluxo principal)

VideoManagementCard.tsx instruções
  └─ Linha 113: "Envie até 10 vídeos (máx. 10s, horizontal, 100MB)" HARDCODED ❌

VideoInstructionsModal.tsx
  └─ Linha 22: `specifications?.horizontal?.duracaoSegundos` HARDCODED ❌
```

## Plano de correção

### 1. Propagar `tipo_produto` pela cadeia completa

**`OrderDetails.tsx`** → adicionar `tipo_produto` ao state e repassar como prop para `VideoManagementCard`

**`VideoManagementCard.tsx`** → receber prop `tipoProduto`, ajustar textos dinâmicos, repassar para `VideoSlotGrid`

**`VideoSlotGrid.tsx`** → receber e repassar `tipoProduto` para `VideoSlotCard`

### 2. Corrigir validação de vídeo

**`videoStorageService.ts`** (`validateVideoFile`) → receber param `tipo: 'horizontal' | 'vertical'`:
- Se vertical: aceitar `orientation === 'vertical'`, buscar duração do produto vertical
- Se horizontal: manter lógica atual

**`videoUploadService.ts`** (`uploadVideo`) → receber `tipoProduto` e repassar para `validateVideoFile`

### 3. Corrigir textos hardcoded

**`VideoManagementCard.tsx`** → textos dinâmicos baseados em `tipoProduto`:
- Vertical: "máx. 15s, vertical, 100MB"
- Horizontal: "máx. 10s, horizontal, 100MB"

**`VideoInstructionsModal.tsx`** → receber `tipoProduto` e usar `specifications?.vertical` quando aplicável

### 4. Cadeia de hooks

**`useVideoManagement.tsx`** → `handleUpload` precisa receber `tipoProduto` e repassar para `uploadVideo`

**`useOrderVideoManagement.tsx`** → buscar `tipo_produto` do pedido (já busca status, adicionar tipo) e repassar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/advertiser/OrderDetails.tsx` | Repassar `tipo_produto` do pedido para VideoManagementCard |
| `src/components/order/VideoManagementCard.tsx` | Receber `tipoProduto`, textos dinâmicos, repassar para grid |
| `src/components/video-management/VideoSlotGrid.tsx` | Receber e repassar `tipoProduto` |
| `src/services/videoStorageService.ts` | `validateVideoFile` aceitar param tipo, validar orientação dinâmica |
| `src/services/videoUploadService.ts` | `uploadVideo` receber e repassar `tipoProduto` |
| `src/hooks/useVideoManagement.tsx` | `handleUpload` repassar tipo |
| `src/hooks/useOrderVideoManagement.tsx` | Buscar `tipo_produto` do pedido, expor no retorno |
| `src/components/video-management/VideoInstructionsModal.tsx` | Receber `tipoProduto`, usar specs corretas |

