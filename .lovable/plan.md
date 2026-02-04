

# Analise Completa: Botoes Externos da Proposta

## Diagnostico Principal

### ERRO CRITICO IDENTIFICADO: Duplicacao de Proposta

Ao analisar os logs do banco de dados, encontrei a **causa raiz** do erro:

```
duplicate key value violates unique constraint "proposals_access_token_key"
```

**Problema**: O campo `access_token` possui constraint UNIQUE no banco de dados. Quando a funcao `handleDuplicateProposal` copia todos os campos da proposta original, ela **nao exclui** o `access_token`, causando violacao de unicidade.

---

## Analise da Funcao de Duplicacao (Linhas 668-732)

### Campos que ESTAO sendo excluidos:
| Campo | Status |
|-------|--------|
| id | Excluido |
| number | Excluido (novo gerado) |
| status | Excluido (resetado para 'pendente') |
| created_at | Excluido |
| sent_at | Excluido |
| view_count | Excluido |
| total_time_spent_seconds | Excluido |
| first_viewed_at | Excluido |
| last_viewed_at | Excluido |
| is_viewing | Excluido |
| last_heartbeat_at | Excluido |
| converted_order_id | Excluido |
| metadata | Excluido |
| expires_at | Excluido (novo calculado) |
| seller_name/phone/email | Excluido (dados do usuario) |

### Campos que DEVEM ser excluidos mas NAO estao:
| Campo | Problema |
|-------|----------|
| `access_token` | UNIQUE constraint - causa erro de duplicacao |
| `updated_at` | Pode causar conflito |
| `viewed_at` | Dados de visualizacao antigos |
| `responded_at` | Resposta da proposta original |
| `contract_accepted_at` | Aceite do contrato original |
| `contract_accepted_ip` | IP do aceite original |
| `contract_accepted_user_agent` | User-agent do aceite original |
| `contract_terms_version` | Versao do contrato original |
| `needs_reacceptance` | Flag de re-aceite original |
| `last_modified_at` | Data de modificacao original |
| `modified_by` | Usuario que modificou original |

---

## Logica de Negocios para Proposta Aceita

Quando uma proposta **ACEITA** e duplicada:

1. A nova proposta deve ter status `pendente`
2. Todos os campos de aceite devem ser limpos (contract_accepted_at, etc)
3. Um novo `access_token` deve ser gerado automaticamente pelo banco
4. O novo cliente precisara aceitar novamente a proposta

Isso **JA** esta parcialmente implementado (status = 'pendente'), mas faltam os campos de limpeza de aceite.

---

## Inventario Completo dos Botoes Externos

### Menu Dropdown (Desktop - Linhas 1200-1254)

| Botao | Funcao | Status |
|-------|--------|--------|
| Ver Preview | `setPreviewProposal(proposal)` | OK |
| Ver Detalhes | `navigate(buildPath(...))` | OK |
| Editar Proposta | `navigate(buildPath(...editar))` | OK |
| **Duplicar Proposta** | `handleDuplicateProposal(proposal)` | **ERRO** |
| Copiar Link | `handleCopyLink(proposal)` | OK |
| Revalidar Proposta | `handleOpenRevalidate(proposal)` | OK (so aparece para expiradas) |
| Reenviar WhatsApp | `handleResend(proposal, 'whatsapp')` | OK |
| Reenviar para outro numero | `handleResendToOtherNumber(proposal)` | OK |
| Reenviar Email | `handleResend(proposal, 'email')` | OK |
| Gerar Contrato PDF | `handleGenerateContractPDF(proposal)` | OK |

### Bulk Actions (Desktop - Linhas 1018-1051)

| Acao | Funcao | Status |
|------|--------|--------|
| Duplicar (1 item) | `handleDuplicateProposal(proposal)` | **ERRO** |
| Limpar selecao | `clearSelection()` | OK |
| Excluir | `setShowDeleteDialog(true)` | OK |

### Mobile (ProposalMobileCard)

- Card clicavel para ver detalhes: OK
- Long press para selecao: OK

---

## Correcoes Necessarias

### 1. Corrigir handleDuplicateProposal (PropostasPage.tsx)

Adicionar os campos faltantes na desestruturacao:

```typescript
const { 
  id, 
  number, 
  status, 
  created_at, 
  sent_at, 
  view_count, 
  total_time_spent_seconds, 
  first_viewed_at, 
  last_viewed_at, 
  is_viewing, 
  last_heartbeat_at, 
  converted_order_id, 
  metadata,
  expires_at,
  seller_name,
  seller_phone,
  seller_email,
  // NOVOS - Campos que devem ser excluidos:
  access_token,        // CRITICO - causa erro de unicidade
  updated_at,
  viewed_at,
  responded_at,
  contract_accepted_at,
  contract_accepted_ip,
  contract_accepted_user_agent,
  needs_reacceptance,
  last_modified_at,
  modified_by,
  ...dataToCopy 
} = proposal as any; // Cast para any porque a interface nao tem todos os campos
```

### 2. Limpar campos de aceite na insercao

```typescript
const { data: newProposal, error } = await supabase
  .from('proposals')
  .insert({
    ...dataToCopy,
    number: newNumber,
    status: 'pendente',
    metadata: {},
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    // Garantir que campos de aceite estao limpos:
    contract_accepted_at: null,
    contract_accepted_ip: null,
    contract_accepted_user_agent: null,
    needs_reacceptance: false,
    // access_token sera gerado automaticamente pelo banco
  })
  .select()
  .single();
```

### 3. Atualizar interface Proposal (Linhas 31-74)

A interface esta incompleta e nao reflete todos os campos do banco. Como a query usa `select('*')`, o objeto retornado tem mais campos que a interface declara.

---

## Resumo das Acoes

### Arquivo: `src/pages/admin/proposals/PropostasPage.tsx`

| Linha | Acao |
|-------|------|
| 676-697 | Adicionar campos faltantes na desestruturacao |
| 700-710 | Garantir limpeza dos campos de aceite |
| 31-74 | (Opcional) Expandir interface Proposal |

---

## Resultado Esperado Apos Correcao

1. Duplicacao de propostas funcionara sem erro
2. Propostas duplicadas terao novo `access_token` unico
3. Propostas aceitas, quando duplicadas, terao status `pendente` e campos de aceite limpos
4. O novo cliente precisara passar pelo fluxo de aceite novamente

