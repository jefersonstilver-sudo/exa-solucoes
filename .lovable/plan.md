
# Plano: Correção dos Botões de Rascunho e Publicar

## Problemas Identificados

### 1. Botão "Salvar Rascunho" não aparece
A condição atual (linha 3661) é:
```tsx
{(!isEditMode || existingProposal?.status === 'rascunho' || existingProposal?.number?.startsWith('RASCUNHO-')) && (
```

**Problema**: Quando `existingProposal` ainda não carregou (está `undefined`), a condição `existingProposal?.status === 'rascunho'` retorna `undefined`, não `true`. Combinado com `!isEditMode` ser `false` (porque está em modo de edição), a condição inteira falha.

### 2. Botão "Publicar" sempre mostra o mesmo texto
Quando você está editando uma proposta **já publicada** (não é rascunho), o botão deveria mostrar "Salvar Alterações" em vez de "Publicar".

### 3. Falta clareza entre estados
O usuário precisa entender claramente:
- **Rascunho**: pode salvar como rascunho OU publicar
- **Publicada**: só pode salvar alterações (não pode voltar a ser rascunho)

---

## Correções Necessárias

### Correção 1: Ajustar condição do botão "Salvar Rascunho"

A condição atual falha porque `existingProposal` pode estar carregando. Precisa aguardar o carregamento:

**De (linha 3661):**
```tsx
{(!isEditMode || existingProposal?.status === 'rascunho' || existingProposal?.number?.startsWith('RASCUNHO-')) && (
```

**Para:**
```tsx
{/* Botão Salvar Rascunho - aparece em criação OU quando editando rascunho (após carregar) */}
{(!isEditMode || (isEditMode && dataLoaded && (existingProposal?.status === 'rascunho' || existingProposal?.number?.startsWith('RASCUNHO-')))) && (
```

Isso garante que:
- Em criação nova (`!isEditMode`): sempre mostra
- Em edição: só mostra após carregar (`dataLoaded`) E se for rascunho

### Correção 2: Texto dinâmico do botão principal

O botão "Publicar" (linha 3692-3698) precisa mostrar texto diferente baseado no estado:

**De:**
```tsx
<Send className="h-4 w-4" />
{isEditMode && (!dataLoaded || isLoadingProposal) 
  ? 'Carregando...' 
  : 'Publicar'}
```

**Para:**
```tsx
<Send className="h-4 w-4" />
{isEditMode && (!dataLoaded || isLoadingProposal) 
  ? 'Carregando...' 
  : isEditMode && existingProposal?.status !== 'rascunho' && !existingProposal?.number?.startsWith('RASCUNHO-')
    ? 'Salvar Alterações'
    : 'Publicar'}
```

Isso garante:
- Carregando: mostra "Carregando..."
- Edição de proposta já publicada: mostra "Salvar Alterações"
- Criação ou edição de rascunho: mostra "Publicar"

### Correção 3: Título do Dialog também dinâmico

Atualizar o título do Dialog de envio (linha ~3769) para refletir o estado:

**De:**
```tsx
<DialogTitle className="flex items-center gap-2">
  <Send className="h-5 w-5 text-primary" />
  {isEditMode ? 'Salvar Alterações e Enviar' : 'Enviar Proposta'}
</DialogTitle>
```

**Para:**
```tsx
<DialogTitle className="flex items-center gap-2">
  <Send className="h-5 w-5 text-primary" />
  {isEditMode 
    ? (existingProposal?.status === 'rascunho' || existingProposal?.number?.startsWith('RASCUNHO-'))
      ? 'Publicar Proposta'
      : 'Salvar Alterações'
    : 'Enviar Proposta'}
</DialogTitle>
```

---

## Fluxo Visual Final

```text
┌─────────────────────────────────────────────────────────────────┐
│ CRIAÇÃO NOVA (sem proposta ainda)                              │
├─────────────────────────────────────────────────────────────────┤
│ [Cortesia] [Preview] [Copiar] [Salvar Rascunho] [█ Publicar █] │
│                                                                 │
│ • Auto-save cria RASCUNHO-xxx em background                    │
│ • "Salvar Rascunho" = salva manualmente como rascunho          │
│ • "Publicar" = gera EXA-AAAA-XXXX + status enviada             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ EDIÇÃO DE RASCUNHO (RASCUNHO-xxx ou status='rascunho')         │
├─────────────────────────────────────────────────────────────────┤
│ [Cortesia] [Preview] [Copiar] [Salvar Rascunho] [█ Publicar █] │
│                                                                 │
│ • "Salvar Rascunho" = mantém como rascunho                     │
│ • "Publicar" = converte para EXA-AAAA-XXXX + status enviada    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ EDIÇÃO DE PROPOSTA PUBLICADA (EXA-xxx ou status='enviada')     │
├─────────────────────────────────────────────────────────────────┤
│ [Cortesia] [Preview] [Copiar]         [█ Salvar Alterações █]  │
│                                                                 │
│ • SEM botão "Salvar Rascunho" (não pode voltar a ser rascunho) │
│ • "Salvar Alterações" = atualiza mantendo status enviada       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Ajustar condição do botão "Salvar Rascunho" + texto dinâmico do botão principal + título do Dialog |

---

## Detalhes Técnicos

### Linha 3660-3679 (Botão Salvar Rascunho)
```tsx
{/* Botão Salvar Rascunho - aparece em criação OU quando editando rascunho (após carregar) */}
{(!isEditMode || (isEditMode && dataLoaded && (existingProposal?.status === 'rascunho' || existingProposal?.number?.startsWith('RASCUNHO-')))) && (
  <Button 
    variant="outline"
    onClick={handleSaveDraft}
    disabled={
      selectedBuildings.length === 0 || 
      isSavingDraft ||
      (isEditMode && (!dataLoaded || isLoadingProposal))
    }
    className="h-11 gap-2 border-slate-300"
  >
    {isSavingDraft ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : (
      <FileText className="h-4 w-4" />
    )}
    Salvar Rascunho
  </Button>
)}
```

### Linha 3692-3698 (Botão Principal)
```tsx
<Button 
  onClick={handleOpenSendDialog} 
  disabled={...}
  className="flex-1 h-11 gap-2"
>
  <Send className="h-4 w-4" />
  {isEditMode && (!dataLoaded || isLoadingProposal) 
    ? 'Carregando...' 
    : isEditMode && existingProposal?.status !== 'rascunho' && !existingProposal?.number?.startsWith('RASCUNHO-')
      ? 'Salvar Alterações'
      : 'Publicar'}
</Button>
```

---

## Checklist de Implementação

### NovaPropostaPage.tsx
- [ ] Ajustar condição do botão "Salvar Rascunho" (linha 3661) para considerar `dataLoaded`
- [ ] Alterar texto do botão principal (linhas 3694-3697) para ser dinâmico baseado no estado
- [ ] Alterar título do Dialog de envio para refletir o estado (publicar vs salvar alterações)

### Testes
- [ ] Criar proposta nova → ver botão "Salvar Rascunho" + "Publicar"
- [ ] Editar rascunho → ver botão "Salvar Rascunho" + "Publicar"
- [ ] Editar proposta publicada → ver APENAS botão "Salvar Alterações" (sem Salvar Rascunho)
- [ ] Publicar rascunho → verificar que gera número EXA + status enviada
