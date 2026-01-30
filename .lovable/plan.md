
# Plano: Corrigir Fluxo de Contrato Existente + Botao de Edicao

## Problema Identificado

### Erro Principal
Quando o usuario clica em "Ver Contrato" e ja existe um contrato gerado:

1. O codigo envia `preview_only: false` + `clientData: null`
2. A Edge Function valida `clientData` ANTES de verificar se existe contrato
3. Resultado: **Erro 400** - "Dados do cliente incompletos"

### Fluxo Atual (quebrado)
```
Usuario clica "Ver Contrato"
       │
       ▼
hasExistingContract = true
       │
       ▼
Chama Edge Function com:
  preview_only: false
  clientData: null
       │
       ▼
Edge Function linha 44:
  if (!preview_only && !clientData) → ERRO 400
```

### Duplicacao Detectada
A proposta `b890fb70...` tem **5 contratos duplicados** - a idempotencia nao esta funcionando porque a verificacao de contrato existente so ocorre se `!preview_only`, mas o erro de validacao ocorre antes.

---

## Solucao Proposta

### Fase 1: Corrigir Edge Function (Verificar Existente ANTES de Validar)

**Arquivo**: `supabase/functions/create-contract-from-proposal/index.ts`

**Mudanca**: Mover a verificacao de contrato existente para ANTES da validacao de clientData

```
ANTES (ordem errada):
1. Validar clientData → ERRO se null
2. Verificar se existe contrato

DEPOIS (ordem correta):
1. Verificar se existe contrato → Retornar se sim
2. Validar clientData (so se nao existe)
```

### Fase 2: Criar Novo Parametro `fetch_existing`

Adicionar flag `fetch_existing: true` que indica "quero apenas buscar contrato existente":

| Parametro | Comportamento |
|-----------|---------------|
| `preview_only: true` | Gera HTML virtual sem salvar |
| `preview_only: false` + `clientData` | Cria/atualiza contrato |
| `fetch_existing: true` | Busca contrato existente sem criar |

### Fase 3: Adicionar Botao "Editar Dados do Signatario"

**Arquivo**: `src/pages/public/PropostaPublicaPage.tsx`

**Mudancas**:

1. **Novo estado** para controlar modo de edicao:
```typescript
const [isEditingSignatory, setIsEditingSignatory] = useState(false);
```

2. **Botao de Edicao** abaixo de "Ver Contrato" (quando contrato existe):
```
┌─────────────────────────────────────────────┐
│  ✅ Contrato Gerado                         │
│                                             │
│  [📄 Visualizar Contrato]  (botao verde)    │
│                                             │
│  [✏️ Editar Dados do Signatario] (outline)  │
└─────────────────────────────────────────────┘
```

3. **Fluxo de Edicao**:
   - Clicar em "Editar Dados" → Abre `ContractDataModal`
   - Pre-preenche com dados salvos no contrato existente
   - Ao submeter → Chama Edge Function com `clientData` para ATUALIZAR contrato
   - Regenera HTML do contrato

### Fase 4: Buscar Dados do Signatario do Contrato Existente

**Arquivo**: `src/pages/public/PropostaPublicaPage.tsx`

Quando proposta carrega e tem `metadata.contract_id`:
- Buscar dados do contrato (cliente_cpf, cliente_data_nascimento, etc.)
- Armazenar em `existingContractData` para pre-preencher modal de edicao

---

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/create-contract-from-proposal/index.ts` | Edge Function | Reordenar validacao, adicionar `fetch_existing` |
| `src/pages/public/PropostaPublicaPage.tsx` | React | Botao editar, buscar dados existentes, modo edicao |

---

## Fluxo Final Corrigido

```
                                ┌─────────────────┐
                                │ Usuario clica   │
                                │ "Ver Contrato"  │
                                └────────┬────────┘
                                         │
           ┌─────────────────────────────┴─────────────────────────────┐
           │                                                           │
           ▼                                                           ▼
    hasExistingContract?                                         NAO EXISTE
           │                                                           │
           ▼                                                           ▼
    Chama com fetch_existing: true                            Abre Modal de Dados
           │                                                           │
           ▼                                                           ▼
    Edge Function busca contrato                              Usuario preenche
    e retorna HTML                                                     │
           │                                                           ▼
           ▼                                                  Chama com clientData
    Exibe ContractPreview                                              │
           │                                                           ▼
           ▼                                                  Cria contrato novo
    [Editar Dados]                                                     │
           │                                                           ▼
           ▼                                                  Exibe ContractPreview
    Abre Modal pre-preenchido
           │
           ▼
    Submete alteracoes
           │
           ▼
    Atualiza contrato existente
           │
           ▼
    Exibe HTML atualizado
```

---

## Codigo a Implementar

### Edge Function - Nova Estrutura

```typescript
// NOVA ORDEM DE VERIFICACAO

// 1. PRIMEIRO: Verificar se existe contrato (antes de validar clientData)
if (!preview_only) {
  const { data: existingContract } = await supabase
    .from('contratos_legais')
    .select('*')
    .eq('proposta_id', proposalId)
    .maybeSingle();

  // Se existe E nao temos clientData, apenas retornar o existente
  if (existingContract && !clientData) {
    console.log("📄 Retornando contrato existente (fetch mode)");
    const contractHtml = generateContractHtml(existingContract, ...);
    return Response({ 
      success: true, 
      existing_contract: true,
      contrato: existingContract,
      contractHtml 
    });
  }

  // Se existe E temos clientData, significa EDICAO
  if (existingContract && clientData) {
    console.log("✏️ Modo EDICAO - Atualizando dados do signatario");
    // Atualizar contrato com novos dados
    await supabase.from('contratos_legais').update({
      cliente_nome: clientData.primeiro_nome + ' ' + clientData.sobrenome,
      cliente_cpf: clientData.cpf,
      cliente_data_nascimento: clientData.data_nascimento,
      cliente_email: clientData.email,
      // ...
    }).eq('id', existingContract.id);
    
    // Regenerar HTML
    // ...
  }
}

// 2. DEPOIS: Validar clientData (so se nao existe contrato)
if (!preview_only && !clientData) {
  throw new Error("Dados do cliente sao obrigatorios para criar novo contrato");
}
```

### React - Buscar Dados do Contrato Existente

```typescript
// No useEffect que carrega proposta
if (metadata?.contract_id) {
  // Buscar dados do contrato para pre-preencher modal de edicao
  const { data: contractData } = await supabase
    .from('contratos_legais')
    .select('cliente_nome, cliente_cpf, cliente_data_nascimento, cliente_email, cliente_telefone')
    .eq('id', metadata.contract_id)
    .single();
  
  if (contractData) {
    setExistingContractData(contractData);
  }
}
```

### React - Botao de Edicao

```tsx
{hasExistingContract && (
  <div className="space-y-3">
    <Button onClick={handleViewContract} className="w-full bg-emerald-600">
      <FileText className="mr-2 h-4 w-4" />
      Visualizar Contrato
    </Button>
    
    <Button 
      variant="outline" 
      onClick={() => {
        setIsEditingSignatory(true);
        setShowContractDataModal(true);
      }}
      className="w-full border-amber-500 text-amber-600"
    >
      <Pencil className="mr-2 h-4 w-4" />
      Editar Dados do Signatario
    </Button>
  </div>
)}
```

---

## Resultado Final

1. **Erro 400 corrigido**: Visualizar contrato existente sem pedir dados novamente
2. **Botao de Edicao**: Permite alterar dados do signatario a qualquer momento
3. **Pre-preenchimento**: Modal de edicao mostra dados atuais
4. **Regeneracao**: Ao editar, contrato e atualizado (nao duplicado)
5. **Zero Duplicacao**: Mesma proposta = maximo 1 contrato
