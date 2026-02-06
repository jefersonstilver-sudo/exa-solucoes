

# Correção: Propostas Editadas Devem Aparecer no Topo

## Problema Identificado

Quando você edita uma proposta, ela **continua na mesma posição da lista** porque a ordenação usa `created_at` (data de criação). O comportamento esperado é que propostas editadas apareçam **no topo**, refletindo a atividade recente.

## Causa Técnica

No arquivo `src/pages/admin/proposals/PropostasPage.tsx` (linha 124):

```typescript
// ATUAL - Ordena por data de CRIAÇÃO (nunca muda)
.order('created_at', { ascending: false });
```

Quando uma proposta é editada no `NovaPropostaPage.tsx`, o Supabase atualiza automaticamente o campo `updated_at`, mas a listagem não considera esse campo.

## Solução

Alterar a ordenação para usar `updated_at` (data de atualização):

```typescript
// CORRIGIDO - Ordena por data de ATUALIZAÇÃO
.order('updated_at', { ascending: false });
```

## Arquivo a Modificar

| Arquivo | Linha | Mudança |
|---------|-------|---------|
| `src/pages/admin/proposals/PropostasPage.tsx` | 124 | Trocar `created_at` por `updated_at` na ordenação |

## Benefícios

1. **Propostas editadas** aparecem automaticamente no topo
2. **Propostas com status alterado** (visualizada, aceita) também sobem
3. **Comportamento consistente** com outros módulos do sistema (CRM, projetos de vídeo)
4. Sem necessidade de refresh manual para ver atualizações

## Resultado Esperado

Após editar qualquer proposta:
- Ela aparecerá **imediatamente no topo da lista**
- A ordem reflete a atividade mais recente
- Funciona tanto no desktop quanto no mobile

