

# Plano: Corrigir Preview Branco + Alinhar Prédios da Proposta com Loja Pública

## Diagnóstico

### Preview branco
Provável erro de build transitório. Vou verificar se há erro de sintaxe nas edições recentes e corrigir se necessário.

### Divergência de prédios (problema principal)

A proposta e a loja pública usam **queries diferentes** que retornam **conjuntos diferentes** de prédios:

```text
PROPOSTA (NovaPropostaPage.tsx):
  SELECT ... FROM buildings WHERE status IN ('ativo', 'interno')
  → 14 prédios: 11 ativos + 3 internos (COMERCIAL TABLET, ENTRADA, SALA REUNIÃO)

LOJA PÚBLICA (get_buildings_for_public_store RPC):
  SELECT ... FROM buildings WHERE status IN ('ativo', 'instalação', 'instalacao')
  → 14 prédios: 11 ativos + 3 em instalação (Cheverny, Bella Vita, Miró)
```

São conjuntos diferentes — a proposta inclui prédios internos (administrativos) que NÃO existem na loja pública, e NÃO inclui prédios em instalação que ESTÃO na loja pública.

O cliente vê a proposta pública com os prédios da loja pública, mas o vendedor seleciona de uma lista diferente. Isso causa inconsistência na contagem.

## Correção

### 1. Alinhar query da proposta com loja pública

**Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`** (linha 481)

Alterar a query de prédios para incluir os mesmos status da loja pública:

```typescript
// ANTES:
.in('status', ['ativo', 'interno'])

// DEPOIS:
.in('status', ['ativo', 'interno', 'instalação', 'instalacao'])
```

Isso garante que o vendedor veja TODOS os prédios que o cliente verá na proposta pública, mais os internos (para uso administrativo, conforme governança existente).

### 2. Corrigir grid dinâmico do Tailwind (possível causa do preview branco)

**Arquivo: `src/pages/admin/proposals/PropostasPage.tsx`** (linha 932)

O Tailwind não suporta classes dinâmicas como `` grid-cols-${n} ``. Substituir por classe fixa com lógica condicional:

```typescript
// ANTES:
<div className={`grid grid-cols-${Math.min(sellersData.length, 3)} gap-2`}>

// DEPOIS:
<div className={`grid gap-2 ${
  sellersData.length === 1 ? 'grid-cols-1' : 
  sellersData.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
}`}>
```

Classes dinâmicas no Tailwind são eliminadas pelo purge/JIT e resultam em layout quebrado, que pode contribuir para o problema visual.

### 3. Verificar build

Confirmar que o preview carrega corretamente após as correções.

## Arquivos a editar
- `src/pages/admin/proposals/NovaPropostaPage.tsx` — query de prédios
- `src/pages/admin/proposals/PropostasPage.tsx` — fix grid Tailwind

## Impacto
- Proposta agora mostra os mesmos prédios da loja pública + internos
- Grid de vendedores renderiza corretamente
- Nenhuma alteração na UI pública, RPC ou funcionalidades existentes

