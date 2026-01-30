
# Plano: Sistema Inteligente de Contratos Vinculados a Propostas

## Problema Identificado

Atualmente existem 3 problemas no fluxo de contratos:

1. **Duplicacao**: A Edge Function `create-contract-from-proposal` cria um novo contrato toda vez que e chamada, sem verificar se ja existe um para a proposta
2. **Falta de Rastreamento na UI**: A proposta publica nao verifica se ja existe contrato gerado antes de exibir o botao "Ver Contrato"
3. **Desconexao no Juridico**: O modulo Juridico (`ContratosPage.tsx`) lista todos os contratos sem indicar claramente quais vieram de propostas

---

## Dados Atuais do Sistema

| Tabela | Campo | Uso |
|--------|-------|-----|
| `proposals` | `metadata.contract_id` | Armazena ID do contrato gerado |
| `proposals` | `metadata.contract_created_at` | Timestamp da geracao |
| `contratos_legais` | `proposta_id` | FK para proposta de origem |

```text
FLUXO ATUAL (problematico):
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Proposta      │───>│ Edge Function   │───>│ Novo Contrato   │
│   (pendente)    │    │ (sempre cria)   │    │ (duplicado!)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────┐
                       │ Juridico lista TODOS    │
                       │ (sem distinguir origem) │
                       └─────────────────────────┘
```

---

## Solucao Proposta

### Fase 1: Edge Function Inteligente (Idempotente)

**Arquivo**: `supabase/functions/create-contract-from-proposal/index.ts`

**Logica Nova**:
```text
1. Buscar proposta
2. VERIFICAR se ja existe contrato para esta proposta
   - Se SIM (nao preview):
     a. Checar se proposta foi alterada desde geracao
     b. Se inalterada: retornar contrato existente
     c. Se alterada: regenerar HTML e atualizar contrato existente
   - Se NAO: criar novo contrato normalmente
3. Usar UPSERT com conflict em proposta_id
```

**Codigo a Adicionar (apos buscar proposta)**:
```typescript
// VERIFICAR SE JA EXISTE CONTRATO PARA ESTA PROPOSTA
if (!preview_only) {
  const { data: existingContract } = await supabase
    .from('contratos_legais')
    .select('id, numero_contrato, status, created_at')
    .eq('proposta_id', proposalId)
    .maybeSingle();

  if (existingContract) {
    console.log("📄 Contrato existente encontrado:", existingContract.numero_contrato);
    
    // Verificar se proposta foi modificada apos contrato
    const proposalModified = proposal.last_modified_at 
      ? new Date(proposal.last_modified_at) > new Date(existingContract.created_at)
      : false;
    
    if (!proposalModified) {
      // Retornar contrato existente sem duplicar
      const contractHtml = generateContractHtml(existingContract, ...);
      return Response({ success: true, contrato: existingContract, contractHtml });
    }
    
    // Se modificada, atualizar contrato existente
    // ... logica de update ao inves de insert
  }
}
```

---

### Fase 2: Proposta Publica - Exibir Contrato Existente

**Arquivo**: `src/pages/public/PropostaPublicaPage.tsx`

**Mudancas**:

1. **Verificar metadata ao carregar proposta**:
   - Se `metadata.contract_id` existe: mostrar botao "Visualizar Contrato" (em vez de "Gerar")
   - Armazenar `hasExistingContract` e `existingContractId` no state

2. **Handler `handleViewContract`**:
   - Se contrato existente: buscar HTML do contrato existente
   - Se nao existe: iniciar fluxo de coleta de dados + geracao

3. **Indicador Visual**:
   - Badge "Contrato ja gerado" na interface
   - Botao diferenciado para visualizar vs gerar

```text
ANTES:                              DEPOIS:
┌────────────────────────┐          ┌────────────────────────┐
│ [Ver Contrato]         │          │ ✓ Contrato Gerado      │
│ (sempre gera novo)     │          │ [Visualizar Contrato]  │
└────────────────────────┘          │ (abre existente)       │
                                    │                        │
                                    │ [Regenerar] (se alt.)  │
                                    └────────────────────────┘
```

---

### Fase 3: Pagina de Propostas Admin - Vinculo Visual

**Arquivo**: `src/pages/admin/proposals/PropostasPage.tsx`

**Mudancas**:
- Na listagem, exibir badge se proposta tem `metadata.contract_id`
- Botao rapido para "Ver Contrato" que navega para `/juridico/{contract_id}`

---

### Fase 4: Modulo Juridico - Filtrar Origem

**Arquivo**: `src/pages/admin/contracts/ContratosPage.tsx`

**Mudancas**:

1. **Novo Filtro**: Adicionar filtro "Origem"
   - Todos
   - De Propostas (proposta_id nao nulo)
   - Manual (proposta_id nulo)

2. **Badge Visual**: Em cada card de contrato, mostrar:
   - "Via Proposta EXA-2026-XXXX" se veio de proposta
   - Link clicavel para a proposta de origem

3. **Evitar Duplicacao na Criacao Manual**:
   - Se usuario tenta criar contrato para cliente que ja tem proposta com contrato: alertar

---

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/create-contract-from-proposal/index.ts` | Edge Function | Adicionar verificacao de contrato existente e logica de upsert |
| `src/pages/public/PropostaPublicaPage.tsx` | React | Verificar e exibir contrato existente |
| `src/pages/admin/proposals/PropostasPage.tsx` | React | Badge de contrato vinculado |
| `src/pages/admin/contracts/ContratosPage.tsx` | React | Filtro por origem e badge visual |

---

## Fluxo Final Esperado

```text
FLUXO NOVO (inteligente):
┌─────────────────┐    ┌─────────────────────────┐    ┌─────────────────┐
│   Proposta      │───>│ Contrato existe?        │───>│ Abrir Existente │
│   (pendente)    │    │ (verifica proposta_id)  │    │ (sem duplicar)  │
└─────────────────┘    └─────────────────────────┘    └─────────────────┘
                                  │ NAO
                                  ▼
                       ┌─────────────────────────┐
                       │ Coletar dados + Gerar   │
                       │ (primeiro contrato)     │
                       └─────────────────────────┘
                                  │
                                  ▼
                       ┌─────────────────────────┐
                       │ Juridico mostra badge:  │
                       │ "Via Proposta EXA-XXX"  │
                       └─────────────────────────┘
```

---

## Deteccao de Alteracoes na Proposta

Para saber se o contrato precisa ser regenerado:

| Campo Verificado | Impacto |
|------------------|---------|
| `fidel_monthly_value` | Valor financeiro mudou |
| `duration_months` | Prazo mudou |
| `selected_buildings` | Predios mudaram |
| `exclusividade_segmento` | Clausula de exclusividade |
| `venda_futura` | Condicoes de cortesia |
| `last_modified_at` | Timestamp geral |

Se qualquer campo critico mudou apos `metadata.contract_created_at`, exibir botao "Regenerar Contrato" na proposta.

---

## Resultado Final

1. **Zero Duplicacao**: Cada proposta tem no maximo 1 contrato vinculado
2. **Rastreabilidade**: UI mostra claramente se contrato ja foi gerado
3. **Flexibilidade**: Se proposta for alterada, usuario pode regenerar
4. **Juridico Organizado**: Filtro por origem facilita gestao
