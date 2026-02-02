
# Plano: Duplicar Proposta + Exibir Nome do Cliente e Empresa Juntos

## Resumo das Solicitacoes

1. **Duplicar proposta**: Ao selecionar uma proposta, deve haver a opcao de duplicar ela
2. **Mostrar nome do cliente + empresa**: Sempre exibir ambos os nomes juntos na listagem (nao apenas a empresa do lado direito)

---

## Parte 1: Exibir Nome do Cliente + Empresa Juntos

### Situacao Atual

O card de proposta na listagem (`PropostasPage.tsx`) exibe:
- **Esquerda**: Nome do cliente (`proposal.client_name`)
- **Direita**: Nome da empresa (`proposal.client_company_name`) separado

### Mudanca Proposta

Exibir **nome do cliente + empresa juntos** na mesma linha:

```
Rachad Ihbraim • Chef das Arabias
```

Ou em duas linhas:
```
Rachad Ihbraim
Chef das Arabias
```

### Arquivos a Modificar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/admin/proposals/PropostasPage.tsx` | Ajustar exibicao no card desktop (linha ~1030) |
| `src/components/admin/proposals/ProposalMobileCard.tsx` | Ajustar exibicao no card mobile (linha ~147-170) |

### Implementacao Desktop (PropostasPage.tsx)

Linha atual (~1030):
```tsx
<h3 className="font-medium text-sm truncate">{proposal.client_name}</h3>
```

Nova exibicao:
```tsx
<div className="flex items-center gap-1.5 flex-wrap">
  <h3 className="font-medium text-sm truncate">{proposal.client_name}</h3>
  {proposal.client_company_name && (
    <>
      <span className="text-xs text-muted-foreground">•</span>
      <span className="text-xs font-medium text-foreground truncate max-w-[150px]" title={proposal.client_company_name}>
        {proposal.client_company_name}
      </span>
    </>
  )}
</div>
```

### Implementacao Mobile (ProposalMobileCard.tsx)

Mesma logica: Juntar nome do cliente com a empresa no lado esquerdo, removendo a empresa do lado direito para evitar duplicacao.

---

## Parte 2: Funcionalidade de Duplicar Proposta

### Fluxo Proposto

1. Usuario seleciona proposta ou clica no menu (3 pontinhos)
2. Aparece opcao "Duplicar Proposta"
3. Ao clicar:
   - Cria nova proposta com todos os dados copiados
   - Altera numero da proposta para novo numero unico
   - Reseta status para "pendente"
   - Limpa campos de visualizacao/conversao
   - Navega para a nova proposta ou exibe toast de sucesso

### Dados a Copiar

| Campo | Comportamento |
|-------|---------------|
| `client_name`, `client_company_name`, `client_email`, `client_phone` | Copiar |
| `selected_buildings` | Copiar |
| `fidel_monthly_value`, `cash_total_value`, `duration_months` | Copiar |
| `payment_type`, `custom_installments` | Copiar |
| `tipo_produto`, `seller_name`, `seller_phone`, `seller_email` | Copiar |
| `titulo`, `exclusividade_*`, `travamento_*` | Copiar |
| `number` | Gerar NOVO |
| `status` | Resetar para "pendente" |
| `created_at` | Nova data |
| `view_count`, `total_time_spent_seconds`, `first_viewed_at`, `last_viewed_at` | Resetar para null |
| `is_viewing`, `last_heartbeat_at` | Resetar para null/false |
| `converted_order_id` | null |
| `metadata` | Limpar (remover contract_id) |

### Locais de Implementacao

#### 1. Adicionar no DropdownMenu (Desktop) - PropostasPage.tsx

Linha ~1113, adicionar apos "Editar Proposta":
```tsx
<DropdownMenuItem onClick={() => handleDuplicateProposal(proposal)}>
  <Copy className="h-4 w-4 mr-2" />
  Duplicar Proposta
</DropdownMenuItem>
```

#### 2. Criar Funcao `handleDuplicateProposal`

```typescript
const handleDuplicateProposal = async (proposal: Proposal) => {
  try {
    toast.loading('Duplicando proposta...', { id: 'duplicate' });
    
    // Gerar novo numero
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newNumber = `EXA-${year}-${randomNum}`;
    
    // Preparar dados para copia (excluir campos que nao devem ser copiados)
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
      ...dataToCopy 
    } = proposal;
    
    // Criar nova proposta
    const { data: newProposal, error } = await supabase
      .from('proposals')
      .insert({
        ...dataToCopy,
        number: newNumber,
        status: 'pendente',
        metadata: {}, // Limpar metadata (contract_id, etc)
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 dias
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log da duplicacao
    await supabase.from('proposal_logs').insert({
      proposal_id: newProposal.id,
      action: 'duplicada',
      details: {
        original_proposal_id: proposal.id,
        original_number: proposal.number
      }
    });
    
    toast.success(`Proposta ${newNumber} criada!`, { id: 'duplicate' });
    refetch();
    
    // Opcional: navegar para a nova proposta
    // navigate(buildPath(`propostas/${newProposal.id}`));
    
  } catch (error) {
    console.error('Erro ao duplicar proposta:', error);
    toast.error('Erro ao duplicar proposta', { id: 'duplicate' });
  }
};
```

#### 3. Adicionar no Bulk Actions (quando seleciona proposta)

Na toolbar de bulk actions (linha ~949-967), adicionar botao de duplicar:

```tsx
{selectedCount === 1 && (
  <Button 
    size="sm" 
    variant="outline"
    onClick={() => {
      const proposalId = Array.from(selectedIds)[0];
      const proposal = proposals.find(p => p.id === proposalId);
      if (proposal) handleDuplicateProposal(proposal);
    }}
    className="h-7 text-xs"
  >
    <Copy className="h-3 w-3 mr-1" />
    Duplicar
  </Button>
)}
```

---

## Arquivos a Modificar

| Arquivo | Mudancas |
|---------|----------|
| `src/pages/admin/proposals/PropostasPage.tsx` | 1) Exibir nome+empresa juntos no card desktop 2) Adicionar funcao `handleDuplicateProposal` 3) Adicionar item no DropdownMenu 4) Adicionar botao Duplicar na bulk toolbar |
| `src/components/admin/proposals/ProposalMobileCard.tsx` | Exibir nome+empresa juntos no card mobile |

---

## Resultado Final

### Listagem Visual

```
┌─────────────────────────────────────────────────────────────────────┐
│ [✓] EXA-2026-6281  visualizando  0d • vence em 27d                 │
│                                                                     │
│     Rachad Ihbraim • Chef das Arabias                   Horizontal │
│     12M • 17 predios • R$ 4.798,00/mes                  Jeferson   │
│     02/02  R$ 4.798,00/mes  👁️ 1x ⏱️ 5min 35s              ⋮      │
└─────────────────────────────────────────────────────────────────────┘
```

### Menu de Acoes

```
┌───────────────────────────────┐
│ 👁️ Ver Preview               │
│ 📄 Ver Detalhes              │
│ ✏️ Editar Proposta           │
│ 📋 Duplicar Proposta   ← NEW │
│ 🔗 Copiar Link               │
│ ─────────────────────────────│
│ 💬 Reenviar WhatsApp         │
│ ...                          │
└───────────────────────────────┘
```

### Bulk Actions (com 1 proposta selecionada)

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1 selecionada(s)              [Duplicar] [Limpar] [🗑️ Excluir]     │
└─────────────────────────────────────────────────────────────────────┘
```
