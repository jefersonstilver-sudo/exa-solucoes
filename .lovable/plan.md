

# Plano: Correção Completa de Logo e Sistema de Publicação com Dois Botões

## Problemas Identificados

### 1. Logo Não Exibe no Formulário de Edição
Na imagem, a logo mostra um ícone quebrado no preview do formulário. Isso acontece porque:
- A URL pública do storage retorna **404** (confirmado nos console logs)
- O bucket `arquivos` pode não ter políticas públicas para o path `proposal-client-logos/`

### 2. Logo Não Aparece na Proposta Pública
Mesmo problema: a URL `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/proposal-client-logos/original/...` retorna 404.

### 3. Salvando Como Rascunho em vez de Publicar
A proposta aparece com número `RASCUNHO-1770054462084` e status `rascunho` quando deveria ter sido publicada como `EXA-2026-XXXX`.

**Causa:** Você quer **dois botões** separados:
- "Salvar Rascunho" → mantém como rascunho
- "Publicar" → transforma em `enviada` com número EXA

---

## Correções Propostas

### Correção 1: Bucket Storage com Política Pública

Preciso criar uma política RLS de SELECT público para o bucket `arquivos` no path `proposal-client-logos/`:

```sql
-- Permitir leitura pública das logos de cliente na proposta
CREATE POLICY "Allow public read access to proposal client logos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'arquivos' 
  AND (storage.foldername(name))[1] = 'proposal-client-logos'
);
```

Isso garante que qualquer pessoa (sem autenticação) pode acessar as logos.

### Correção 2: Tratamento de Erro no Preview de Logo (NovaPropostaPage.tsx)

Adicionar `onError` handler na imagem do preview no formulário para mostrar fallback quando a URL falhar:

```tsx
// Linha 2148-2152
<img 
  src={clientLogoUrl} 
  alt="Logo do cliente" 
  className="w-full h-full object-contain p-1 filter brightness-0 invert"
  onError={(e) => {
    console.error('❌ [LOGO] Erro ao carregar preview:', clientLogoUrl);
    // Esconder imagem quebrada e mostrar ícone de fallback
    (e.target as HTMLImageElement).style.display = 'none';
  }}
/>
```

### Correção 3: Dois Botões Separados (Salvar Rascunho + Publicar)

Você pediu dois botões. Vou implementar:

1. **Botão "Salvar Rascunho"** (secundário)
   - Salva/atualiza a proposta como `status: 'rascunho'`
   - Número permanece `RASCUNHO-{timestamp}`
   - Não dispara envio de WhatsApp/Email

2. **Botão "Publicar"** (primário)
   - Altera status para `enviada`
   - Gera número `EXA-AAAA-XXXX` (se ainda não tiver)
   - Abre dialog de envio (WhatsApp/Email/Link)

**Estrutura Visual:**

```text
┌─────────────────────────────────────────────────────────────────┐
│  [Copiar Texto]  [Salvar Rascunho]  [█ Publicar █]             │
└─────────────────────────────────────────────────────────────────┘
```

### Correção 4: Lógica de Publicação vs Rascunho

**Nova Mutation: `saveDraftMutation`**
- Reutiliza a lógica do auto-save
- Mostra toast de sucesso
- Não redireciona (permite continuar editando)

**Mutation Existente: `createProposalMutation`**
- Renomear ação para "publicar"
- Se proposta tem número `RASCUNHO-*`, gerar novo número `EXA-AAAA-XXXX`
- Atualizar status para `enviada`
- Redirecionar para lista após sucesso

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **SQL Migration** | Adicionar política RLS pública para `proposal-client-logos/` |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 1) Adicionar botão "Salvar Rascunho" 2) Renomear botão existente para "Publicar" 3) Nova mutation para salvar rascunho manualmente 4) Adicionar `onError` no preview de logo |
| `src/pages/public/PropostaPublicaPage.tsx` | (já corrigido) manter `onError` handler |

---

## Fluxo Técnico

```text
CRIAÇÃO DE PROPOSTA
───────────────────────────────────────────────────────────────────
                                    
  [Auto-save 3s]                 [Salvar Rascunho]      [Publicar]
        │                               │                    │
        ▼                               ▼                    ▼
  status: rascunho              status: rascunho      status: enviada
  number: RASCUNHO-XXX          number: RASCUNHO-XXX  number: EXA-AAAA-XXXX
  (background)                  toast + continua      dialog envio
                                                      ↓
                                                      WhatsApp/Email/Link
                                                      ↓
                                                      Redireciona para lista


EDIÇÃO DE PROPOSTA EXISTENTE
───────────────────────────────────────────────────────────────────

  [Salvar Rascunho]          [Publicar]
        │                         │
        ▼                         ▼
  Se já era rascunho:        Se já era enviada:
    mantém rascunho            mantém número EXA
                              
  Se era enviada:            Se era rascunho:
    ⚠️ NÃO pode voltar         gera novo número EXA
    (desabilitar botão)        muda para enviada
```

---

## Detalhes de Implementação

### 1. Botão "Salvar Rascunho" (novo)

Localização: antes do botão "Publicar" (linha ~3511)

```tsx
{/* Botão Salvar Rascunho - só aparece se for criação nova OU se já for rascunho */}
{(!isEditMode || existingProposal?.status === 'rascunho') && (
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

### 2. Função `handleSaveDraft`

```tsx
const handleSaveDraft = async () => {
  if (isSavingDraft) return;
  setIsSavingDraft(true);
  
  try {
    const buildingsData = selectedBuildingsData.map(b => ({
      building_id: b.id,
      building_name: b.nome,
      // ... (mesmo formato do auto-save)
    }));

    const draftData = {
      status: 'rascunho',
      client_name: `${clientData.firstName} ${clientData.lastName}`.trim() || 'Rascunho',
      // ... (todos os campos de proposalData)
      client_logo_url: clientLogoUrl,
    };

    if (isEditMode && editProposalId) {
      // Atualizar proposta existente mantendo como rascunho
      await supabase.from('proposals').update(draftData).eq('id', editProposalId);
      toast.success('Rascunho atualizado!');
    } else if (draftId) {
      // Atualizar rascunho auto-salvo existente
      await supabase.from('proposals').update(draftData).eq('id', draftId);
      toast.success('Rascunho salvo!');
    } else {
      // Criar novo rascunho
      const { data } = await supabase.from('proposals')
        .insert({ ...draftData, number: `RASCUNHO-${Date.now()}` })
        .select('id')
        .single();
      if (data) {
        setDraftId(data.id);
        // Atualizar URL para modo edição
        navigate(buildPath(`/propostas/${data.id}/editar`), { replace: true });
      }
      toast.success('Rascunho criado!');
    }
    
    setLastSavedAt(new Date());
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    toast.error('Erro ao salvar rascunho');
  } finally {
    setIsSavingDraft(false);
  }
};
```

### 3. Renomear Botão Existente

```tsx
{/* Botão Publicar */}
<Button 
  onClick={handleOpenSendDialog} 
  disabled={...}
  className="flex-1 h-11 gap-2"
>
  <Send className="h-4 w-4" />
  {isEditMode && (!dataLoaded || isLoadingProposal) 
    ? 'Carregando...' 
    : 'Publicar'}
</Button>
```

### 4. Lógica na Mutation para Gerar Número EXA

Na `createProposalMutation`, antes de salvar, verificar:

```tsx
// Se está editando um rascunho, gerar novo número EXA
let proposalNumber = existingProposal?.number;
if (isEditMode && existingProposal?.number?.startsWith('RASCUNHO-')) {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  proposalNumber = `EXA-${year}-${randomNum}`;
}

// Atualizar com o novo número e status
const { data, error } = await supabase
  .from('proposals')
  .update({
    ...proposalData,
    number: proposalNumber,
    status: 'enviada',
    sent_at: new Date().toISOString(),
  })
  .eq('id', editProposalId)
  .select()
  .single();
```

---

## Checklist de Implementação

### SQL Migration
- [ ] Criar política RLS pública para `proposal-client-logos/` no bucket `arquivos`

### NovaPropostaPage.tsx
- [ ] Adicionar `onError` handler no preview de logo (linha ~2148)
- [ ] Adicionar função `handleSaveDraft`
- [ ] Adicionar botão "Salvar Rascunho" (antes do botão Publicar)
- [ ] Renomear botão "Salvar e Enviar" para "Publicar"
- [ ] Na mutation de publicar, gerar número EXA se proposta era rascunho
- [ ] Condicionar botão "Salvar Rascunho" para aparecer só quando aplicável

### Testes
- [ ] Criar proposta nova → auto-save cria rascunho
- [ ] Clicar "Salvar Rascunho" → toast + continua editando
- [ ] Clicar "Publicar" em rascunho → gera número EXA + abre dialog
- [ ] Editar proposta já publicada → botão "Salvar Rascunho" não aparece
- [ ] Verificar que logo aparece no formulário e na página pública

