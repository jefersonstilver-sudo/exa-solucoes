
# Plano: Corrigir Botão "Enviar" para Permuta + Implementar Auto-Save de Rascunho

## Problemas Identificados

### Problema 1: Botão "Enviar" Desativado para Propostas de Permuta

**Causa Raiz (Linha 2807):**
```tsx
disabled={selectedBuildings.length === 0 || (isCustomPayment ? customTotal <= 0 : !fidelValue)}
```

A condição `!fidelValue` exige valor monetário, mas em propostas de Permuta esse campo nem é exibido.

**Também na Linha 1210-1214 (`handleOpenSendDialog`):**
```tsx
if (!fidelValue || parseFloat(fidelValue) <= 0) {
  toast.error('Preencha o valor mensal fidelidade');
  return;
}
```

### Problema 2: Auto-Save (Rascunho) Não Implementado

A tabela `proposals` já tem `status` com default `'rascunho'`, mas não há lógica para salvar automaticamente enquanto o usuário digita.

---

## Solução

### Parte 1: Corrigir Condição do Botão "Enviar"

**Arquivo:** `src/pages/admin/proposals/NovaPropostaPage.tsx`

**Linha 2807 - Condição do disabled:**

| Antes | Depois |
|-------|--------|
| `selectedBuildings.length === 0 \|\| (isCustomPayment ? customTotal <= 0 : !fidelValue)` | `selectedBuildings.length === 0 \|\| (modalidadeProposta === 'permuta' ? itensPermuta.length === 0 : (isCustomPayment ? customTotal <= 0 : !fidelValue))` |

**Lógica:**
- **Permuta**: Exigir pelo menos 1 item de permuta
- **Monetária**: Manter lógica original (valor fidelidade ou parcelas customizadas)

### Parte 2: Corrigir Validação em `handleOpenSendDialog`

**Linhas 1199-1215 - Validação de valores:**

Alterar para:
```tsx
// Validação para pagamento personalizado
if (isCustomPayment) {
  const invalidInstallments = customInstallments.filter(p => !p.amount || parseFloat(p.amount) <= 0);
  if (invalidInstallments.length > 0) {
    toast.error('Preencha o valor de todas as parcelas');
    return;
  }
  if (customTotal <= 0) {
    toast.error('O total das parcelas deve ser maior que zero');
    return;
  }
} else if (modalidadeProposta === 'permuta') {
  // Validação específica para Permuta
  if (itensPermuta.length === 0) {
    toast.error('Adicione ao menos um item de permuta');
    return;
  }
} else {
  // Monetária padrão
  if (!fidelValue || parseFloat(fidelValue) <= 0) {
    toast.error('Preencha o valor mensal fidelidade');
    return;
  }
}
```

### Parte 3: Implementar Auto-Save de Rascunho

**Funcionalidade:** Salvar proposta como rascunho automaticamente após 3 segundos de inatividade (debounce).

**Estados necessários:**
```tsx
const [draftId, setDraftId] = useState<string | null>(null);
const [isSavingDraft, setIsSavingDraft] = useState(false);
const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
```

**Hook de debounce:**
```tsx
// useEffect para auto-save com debounce de 3 segundos
useEffect(() => {
  // Só salva se tiver dados mínimos (nome do cliente)
  if (!clientData.firstName.trim()) return;
  
  const timeoutId = setTimeout(async () => {
    await saveDraft();
  }, 3000);
  
  return () => clearTimeout(timeoutId);
}, [clientData, selectedBuildings, durationMonths, fidelValue, itensPermuta, modalidadeProposta]);
```

**Função saveDraft:**
```tsx
const saveDraft = async () => {
  if (isSavingDraft) return;
  setIsSavingDraft(true);
  
  try {
    const draftData = {
      status: 'rascunho',
      client_name: `${clientData.firstName} ${clientData.lastName}`.trim(),
      client_first_name: clientData.firstName,
      client_last_name: clientData.lastName,
      client_company_name: clientData.companyName,
      client_email: clientData.email,
      client_phone: clientData.phoneFullNumber || clientData.phone,
      selected_buildings: selectedBuildings,
      duration_months: durationMonths,
      fidel_monthly_value: parseFloat(fidelValue) || 0,
      modalidade_proposta: modalidadeProposta,
      itens_permuta: itensPermuta,
      valor_total_permuta: valorTotalPermuta,
      // ... outros campos
    };
    
    if (draftId) {
      // Atualizar rascunho existente
      await supabase.from('proposals').update(draftData).eq('id', draftId);
    } else {
      // Criar novo rascunho
      const { data } = await supabase.from('proposals')
        .insert({ ...draftData, number: `RASCUNHO-${Date.now()}` })
        .select('id')
        .single();
      if (data) setDraftId(data.id);
    }
    
    setLastSavedAt(new Date());
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
  } finally {
    setIsSavingDraft(false);
  }
};
```

**Indicador visual de salvamento:**
Adicionar no header ou footer do formulário:
```tsx
{lastSavedAt && (
  <span className="text-xs text-muted-foreground flex items-center gap-1">
    <CheckCircle className="h-3 w-3 text-green-500" />
    Salvo às {format(lastSavedAt, 'HH:mm:ss')}
  </span>
)}
{isSavingDraft && (
  <span className="text-xs text-muted-foreground flex items-center gap-1">
    <Loader2 className="h-3 w-3 animate-spin" />
    Salvando...
  </span>
)}
```

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---------|------------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 1) Corrigir condição disabled do botão Enviar (linha 2807) 2) Corrigir validação handleOpenSendDialog (linhas 1199-1215) 3) Adicionar estados e lógica de auto-save 4) Adicionar indicador visual de salvamento |

---

## Resumo das Regras de Validação Corrigidas

| Modalidade | Condição para Ativar "Enviar" |
|------------|-------------------------------|
| **Monetária Padrão** | `selectedBuildings.length > 0` E `fidelValue > 0` |
| **Monetária Personalizada** | `selectedBuildings.length > 0` E `customTotal > 0` |
| **Permuta** | `selectedBuildings.length > 0` E `itensPermuta.length > 0` |

---

## Fluxo de Auto-Save

```
Usuario digita → Debounce 3s → saveDraft() → Badge "Salvo às HH:MM:SS"
                     ↓
              Digita novamente → Reinicia timer
```

**Benefícios:**
- Não perde dados se fechar a página sem querer
- Rascunhos aparecem na listagem de propostas (filtráveis por status)
- Pode continuar de onde parou ao reabrir

---

## Teste de Validação

Após implementação, testar os cenários:

1. Proposta Monetária: Preencher nome + prédio + valor → Botão ativa
2. Proposta Permuta: Preencher nome + prédio + 1 item permuta → Botão ativa
3. Proposta Permuta SEM itens: Nome + prédio apenas → Botão permanece desativado
4. Auto-save: Preencher nome, esperar 3s, verificar toast/badge de salvamento
5. Reload: Recarregar página, verificar se rascunho aparece na listagem
