

# Plano: Correção de Logo e Botão de Edição de Proposta

## Problemas Identificados

### 1. Logo Corrompida na Proposta Pública
A URL da logo (`https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/proposal-client-logos/original/...`) retorna 404. Causas possíveis:
- Permissões públicas do bucket `arquivos` não incluem o path `proposal-client-logos/`
- RLS do storage bloqueando acesso anônimo

### 2. Logo Desaparece ao Editar
No bloco de hidratação em `NovaPropostaPage.tsx` (linhas 518-719), o campo `client_logo_url` **não está sendo carregado**. O código hidrata todos os campos de `clientData`, configurações de pagamento, exclusividade, travamento de preço, permuta, mas **esquece de carregar a logo do cliente**.

### 3. Salvar como Rascunho em vez de Publicar
O botão "Enviar" não deixa claro que em modo de edição vai **atualizar a proposta existente** em vez de criar um rascunho novo. Precisa de texto diferente para o modo de edição.

---

## Correções Propostas

### Correção 1: Logo na Proposta Pública (PropostaPublicaPage.tsx)

Adicionar tratamento de erro na imagem com fallback e log para debug:

```tsx
// Linhas ~1800-1808
{proposal.client_logo_url && (
  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/20 p-2">
    <img 
      src={proposal.client_logo_url} 
      alt="Logo do cliente"
      className="w-full h-full object-contain filter brightness-0 invert"
      onError={(e) => {
        console.error('❌ [LOGO] Erro ao carregar logo do cliente:', proposal.client_logo_url);
        // Esconder o container se a imagem falhar
        (e.target as HTMLImageElement).parentElement!.style.display = 'none';
      }}
    />
  </div>
)}
```

### Correção 2: Hidratar Logo no Modo de Edição (NovaPropostaPage.tsx)

No bloco `useEffect` de hidratação (após linha ~673), adicionar:

```tsx
// Após setValorReferenciaMonetaria
// ============================================
// LOGO DO CLIENTE - HIDRATAÇÃO
// ============================================
if (existingProposal.client_logo_url) {
  setClientLogoUrl(existingProposal.client_logo_url);
  console.log('🖼️ Logo do cliente carregada:', existingProposal.client_logo_url);
}
```

### Correção 3: Botão de Edição com Texto Claro (NovaPropostaPage.tsx)

Atualizar o botão "Enviar" (linha ~3514-3518) para mostrar texto diferente em modo de edição:

```tsx
<Button 
  onClick={handleOpenSendDialog} 
  disabled={...} 
  className="flex-1 h-11 gap-2"
>
  <Send className="h-4 w-4" />
  {isEditMode && (!dataLoaded || isLoadingProposal) 
    ? 'Carregando...' 
    : isEditMode 
      ? 'Salvar e Enviar' 
      : 'Enviar'}
</Button>
```

E no título do Dialog de envio (linha ~3528):

```tsx
<DialogTitle className="flex items-center gap-2">
  <Send className="h-5 w-5 text-primary" />
  {isEditMode ? 'Salvar Alterações e Enviar' : 'Enviar Proposta'}
</DialogTitle>
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/public/PropostaPublicaPage.tsx` | Adicionar `onError` handler na imagem da logo para esconder se falhar |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | 1) Adicionar hidratação de `client_logo_url` no useEffect 2) Alterar texto do botão para modo edição |

---

## Visão Técnica

```text
FLUXO DE EDIÇÃO DE PROPOSTA

Usuário clica "Editar" → NovaPropostaPage carrega com editProposalId
    │
    ▼
useEffect detecta existingProposal e buildings carregados
    │
    ├── Hidrata clientData (nome, email, CNPJ...)
    ├── Hidrata selectedBuildings + manualBuildings
    ├── Hidrata configurações de pagamento
    ├── Hidrata permuta, exclusividade, travamento
    ├── [FALTANDO] client_logo_url ◄── PROBLEMA CRÍTICO
    └── setDataLoaded(true)
    
Usuário clica "Salvar e Enviar" → 
    Mutation atualiza proposta existente em vez de criar nova
```

---

## Investigação Adicional Necessária

O erro 404 da logo indica que:
1. O bucket `arquivos` pode não ter permissões públicas para o path `proposal-client-logos/`
2. Pode haver uma RLS Policy restritiva no Storage

**Recomendação**: Após implementar as correções de código, verificar no Supabase Dashboard:
- Storage > Policies do bucket `arquivos`
- Garantir que existe uma policy `SELECT` para `anon` ou `public`

---

## Checklist de Implementação

### NovaPropostaPage.tsx
- [ ] Adicionar `setClientLogoUrl(existingProposal.client_logo_url)` no bloco de hidratação (~linha 674)
- [ ] Alterar texto do botão de envio para modo edição (~linha 3517)
- [ ] Alterar título do Dialog para modo edição (~linha 3528)

### PropostaPublicaPage.tsx
- [ ] Adicionar `onError` handler na imagem da logo (~linha 1802)

### Testes
- [ ] Criar proposta com logo → verificar que logo aparece na página pública
- [ ] Editar proposta existente → verificar que logo é carregada no formulário
- [ ] Salvar edição → verificar que logo persiste
- [ ] Verificar que botão mostra "Salvar e Enviar" no modo edição

