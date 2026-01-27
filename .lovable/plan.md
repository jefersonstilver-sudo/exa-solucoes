

# Plano: Corrigir Header Corrompido do Contrato

## Problema Identificado

### Causa Raiz
A URL da imagem do header do contrato aponta para um bucket **privado**:
```
https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png
```

**Erro retornado:** `{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`

O bucket `arquivos` foi configurado como `public: false`, quebrando todas as URLs publicas de imagens que dependem dele.

### Arquivos Afetados
| Arquivo | Problema |
|---------|----------|
| `supabase/functions/create-contract-from-proposal/index.ts` | URL da imagem quebrada (linha 1081) |
| `supabase/functions/clicksign-create-contract/index.ts` | URL da imagem quebrada (linhas 1136 e 1535) |
| `src/components/admin/contracts/ContractPreview.tsx` | URL da imagem quebrada (linha 50) |
| `src/components/admin/contracts/ComodatoTemplate.tsx` | URL da imagem quebrada (linha 51) |

### Componente que Funciona (Referencia)
O arquivo `src/components/legal-flow/LiveContractPreview.tsx` usa a abordagem correta:
```typescript
import exaContractHeader from '@/assets/exa-contract-header.png';
```

---

## Solucao Proposta

### Etapa 1: Upload da Imagem para Bucket Publico
Fazer upload de `src/assets/exa-contract-header.png` para o bucket `email-assets` (que e publico).

Nova URL:
```
https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-contract-header.png
```

### Etapa 2: Atualizar Edge Functions
Alterar todas as Edge Functions para usar a nova URL publica:

**create-contract-from-proposal/index.ts (linha 1081):**
```html
<!-- ANTES -->
src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png"

<!-- DEPOIS -->
src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/email-assets/exa-contract-header.png"
```

**clicksign-create-contract/index.ts (linhas 1136 e 1535):**
Mesma alteracao.

### Etapa 3: Atualizar Componentes Frontend
Alterar os componentes que usam URL hardcoded:

**ContractPreview.tsx (linha 50):**
```typescript
// ANTES
const EXA_CONTRACT_HEADER_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png";

// DEPOIS - Usar import local (mais seguro)
import exaContractHeader from '@/assets/exa-contract-header.png';
```

**ComodatoTemplate.tsx (linha 51):**
Mesma alteracao.

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/create-contract-from-proposal/index.ts` | Nova URL publica |
| `supabase/functions/clicksign-create-contract/index.ts` | Nova URL publica |
| `src/components/admin/contracts/ContractPreview.tsx` | Import local ou nova URL |
| `src/components/admin/contracts/ComodatoTemplate.tsx` | Import local ou nova URL |

---

## Acao Imediata (SQL ou Dashboard)

Para corrigir imediatamente, fazer upload da imagem para o bucket `email-assets` via Supabase Dashboard:
1. Acessar Storage no Supabase
2. Abrir bucket `email-assets`
3. Upload de `exa-contract-header.png`

---

## Resultado Esperado

```text
ANTES:
┌─────────────────────────────────────────┐
│ [EXA Header]  ← Texto quebrado (404)    │
│ CONTRATO DE PRESTACAO DE SERVICOS...    │
└─────────────────────────────────────────┘

DEPOIS:
┌─────────────────────────────────────────┐
│ ██████████████████████████████████████  │
│ █    exa                              █ │  ← Imagem oficial
│ █    Ecosistema de midia e tecnologia █ │
│ ██████████████████████████████████████  │
│ CONTRATO DE PRESTACAO DE SERVICOS...    │
└─────────────────────────────────────────┘
```

