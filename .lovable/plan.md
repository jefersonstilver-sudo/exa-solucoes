

# Plano: Corrigir Publicação de Propostas — Atomic Update

## Diagnóstico

A proposta `EXA-2026-2586` continua com `status: rascunho` apesar de tentativas de publicação. O `updated_at` muda (18:06), confirmando que o Supabase recebe algum update, mas o `status` não muda para `enviada`.

**Causa raiz identificada**: O `.update()` com spread de `proposalData` (que tem ~50 campos) provavelmente falha silenciosamente em algum campo, ou o PostgREST retorna um erro que não está sendo capturado corretamente. Além disso, o `handleSaveEdits` (que NÃO inclui `status`) pode estar sendo chamado em paralelo ou logo após, sobrescrevendo o timestamp sem alterar status.

## Correção

### Arquivo: `src/pages/admin/proposals/NovaPropostaPage.tsx`

**1. Tornar o update atômico e verificado** (linhas 1634-1651)

Substituir o `.update()` por `.upsert()` com `onConflict: 'id'` e adicionar verificação pós-update:

```typescript
console.log('📤 [PUBLISH] Payload:', { id: editProposalId, status: 'enviada', number: proposalNumber });

const { data, error } = await supabase
  .from('proposals')
  .upsert({
    id: editProposalId,
    ...proposalData,
    number: proposalNumber,
    status: 'enviada',
    sent_at: existingProposal?.sent_at || new Date().toISOString(),
  }, { onConflict: 'id' })
  .select('id, status, number')
  .single();

if (error) {
  console.error('❌ [PUBLISH] Erro:', error);
  throw error;
}

// Verificação explícita
if (data?.status !== 'enviada') {
  console.error('❌ [PUBLISH] Status não atualizou!', data);
  throw new Error('Falha ao publicar: status não foi atualizado');
}

console.log('✅ [PUBLISH] Publicada:', data);
proposal = data;
```

**2. Buscar dados completos após upsert** para ter o `proposal` completo (necessário para envio de WhatsApp/Email depois):

Após o upsert verificado, fazer um `.select('*').eq('id', editProposalId).single()` para obter todos os campos.

**3. Corrigir proposta existente no banco**

Criar migração SQL para corrigir a proposta inconsistente:
```sql
UPDATE proposals SET status = 'enviada' WHERE id = '41856389-5de8-4c0e-b5dc-e14d49d1d4e7' AND status = 'rascunho';
```

## Impacto
- Apenas o fluxo de publicação em `NovaPropostaPage.tsx`
- Nenhuma alteração em UI, workflows ou funcionalidades existentes
- A correção garante que falhas de update não passem silenciosas

