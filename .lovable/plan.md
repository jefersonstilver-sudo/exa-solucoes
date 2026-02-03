

# Plano: Corrigir Label do Documento Conforme o Pais

## Problema Identificado

Na pagina publica da proposta comercial (`PropostaPublicaPage.tsx`), na linha 1789, o label do documento esta hardcoded como "CNPJ":

```tsx
<div className="text-white/80">CNPJ: <strong>{proposal.client_cnpj}</strong></div>
```

Isso esta incorreto porque o sistema suporta tres paises:

| Pais | Codigo | Documento Correto |
|------|--------|-------------------|
| Brasil | BR | CNPJ |
| Argentina | AR | CUIT |
| Paraguai | PY | RUC |

## Documentacao Existente no Sistema

O sistema ja possui a logica correta implementada em dois lugares:

**1. NovaPropostaPage.tsx (linhas 113-124):**
```typescript
const getDocumentLabel = () => {
  switch (clientData.country) {
    case 'BR': return 'CNPJ';
    case 'AR': return 'CUIT';
    case 'PY': return 'RUC';
    default: return 'Documento';
  }
};
```

**2. ProposalPDFExporter.tsx (linhas 435-442):**
```typescript
private getDocumentLabel(country?: 'BR' | 'AR' | 'PY' | null): string {
  switch (country) {
    case 'BR': return 'CNPJ';
    case 'AR': return 'CUIT';
    case 'PY': return 'RUC';
    default: return 'CNPJ/Documento';
  }
}
```

## Alteracoes Necessarias

### Arquivo: `src/pages/public/PropostaPublicaPage.tsx`

#### 1. Adicionar campo `client_country` na interface Proposal (linha 40)

O campo `client_country` existe no banco de dados e e carregado via `select('*')` (linha 352), mas nao esta declarado na interface TypeScript.

**Antes (linha 40):**
```typescript
client_cnpj: string | null;
```

**Depois:**
```typescript
client_cnpj: string | null;
client_country?: 'BR' | 'AR' | 'PY' | null;
```

#### 2. Criar funcao helper para obter label do documento (apos a linha 100)

Adicionar funcao que retorna o label correto baseado no pais:

```typescript
// Helper para obter label do documento baseado no pais
const getDocumentLabel = (country?: 'BR' | 'AR' | 'PY' | null): string => {
  switch (country) {
    case 'BR': return 'CNPJ';
    case 'AR': return 'CUIT';
    case 'PY': return 'RUC';
    default: return 'CNPJ';
  }
};
```

#### 3. Atualizar exibicao do documento (linha 1789)

**Antes:**
```tsx
{proposal.client_cnpj && (
  <div className="text-white/80">CNPJ: <strong>{proposal.client_cnpj}</strong></div>
)}
```

**Depois:**
```tsx
{proposal.client_cnpj && (
  <div className="text-white/80">{getDocumentLabel(proposal.client_country)}: <strong>{proposal.client_cnpj}</strong></div>
)}
```

## Resultado Esperado

- Para clientes brasileiros: exibira "CNPJ: 12.345.678/0001-90"
- Para clientes argentinos: exibira "CUIT: 20-12345678-3"
- Para clientes paraguaios: exibira "RUC: 80012345-6"

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/public/PropostaPublicaPage.tsx` | Adicionar campo na interface + criar helper + atualizar linha 1789 |

