
# Plano: Corrigir Fluxo de Contrato Existente + Limpeza de Duplicados

## Diagnostico Final

### O Que Esta Acontecendo

1. **Proposta tem `metadata.contract_id`** = `e6c09153-c094-4f0b-9941-ad610ba7f7eb`
2. **Frontend detecta corretamente** `hasExistingContract = true`
3. **Ao clicar "Ver Contrato"**, frontend chama Edge Function com `{ proposalId, preview_only: false }` (sem `clientData`)
4. **A Edge Function DEPLOYADA** ainda esta na versao antiga (linha 131 valida `clientData` ANTES de verificar existencia)
5. **Resultado**: Erro 400 "Dados do cliente incompletos"

### Logs da Edge Function

```text
at Server.<anonymous> (file:///var/tmp/sb-compile-edge-runtime/create-contract-from-proposal/index.ts:131:13)
```

A linha 131 no codigo local ja e diferente (o codigo local verifica existencia na linha 66), mas a versao deployada ainda nao foi atualizada.

### Duplicacao Confirmada

A proposta `b890fb70...` tem **10 contratos duplicados** na tabela `contratos_legais`, todos com `proposta_id` igual.

---

## Solucao em 3 Partes

### Parte 1: Corrigir a Edge Function (Forcar Redeploy)

**Arquivo**: `supabase/functions/create-contract-from-proposal/index.ts`

O codigo local ja esta correto, mas a Edge Function deployada esta desatualizada. Vou adicionar um comentario de versao para forcar um novo deploy:

```typescript
// VERSION: 2.0.0 - Idempotent contract creation with edit mode
// DEPLOYED: 2026-01-31
```

Alem disso, vou adicionar um log extra no inicio para confirmar qual versao esta rodando:

```typescript
console.log("🔧 VERSION: 2.0.0 - Idempotent Contract Flow");
```

### Parte 2: Limpeza de Contratos Duplicados

Executar operacao no banco para:
1. Identificar o contrato mais recente (ja identificado: `e6c09153-c094-4f0b-9941-ad610ba7f7eb`)
2. Deletar os 9 contratos duplicados
3. Manter apenas o oficial vinculado a proposta

**IDs a deletar** (todos exceto `e6c09153-c094-4f0b-9941-ad610ba7f7eb`):
- `4840dc10-07c4-4494-825e-4d03223a4de6`
- `0c11d02d-a9c4-4a9c-98fe-d3ed69065e3d`
- `9ca20b16-905a-4123-a4f3-aa6806adcc71`
- `d1b42edb-4c1a-4251-9c7a-7800c6bb137f`
- `561599df-2cbb-4a4c-b4aa-828cf68de0e3`
- `92f14337-bfbd-4b1a-b8cd-eb3dcd429fb1`
- `2dd46717-2216-4ffc-8e5a-67446e0521fd`
- `abbf5695-3e26-4545-b102-15921ff75b06`
- `39256a43-eb63-4726-af89-94ae6c1cfdfc`

### Parte 3: Logica do Botao "Editar Dados do Signatario"

**Regra solicitada**: Exibir o botao APENAS quando ja existir signatario do tipo 'cliente' na tabela `contrato_signatarios`.

**Arquivo**: `src/pages/public/PropostaPublicaPage.tsx`

**Mudancas**:

1. **Novo estado** para rastrear existencia de signatario:
```typescript
const [hasSignatoryRegistered, setHasSignatoryRegistered] = useState(false);
```

2. **Buscar signatario ao carregar proposta** (no useEffect que detecta `metadata.contract_id`):
```typescript
// Se ja existe contrato, verificar se tem signatario cliente
if (metadata?.contract_id) {
  const { data: signatario } = await supabase
    .from('contrato_signatarios')
    .select('id')
    .eq('contrato_id', metadata.contract_id)
    .eq('tipo', 'cliente')
    .maybeSingle();
  
  if (signatario) {
    setHasSignatoryRegistered(true);
  }
}
```

3. **Botao de Edicao condicional**:
```tsx
{hasExistingContract && hasSignatoryRegistered && (
  <Button variant="outline" onClick={handleEditSignatory}>
    <Pencil className="mr-2 h-4 w-4" />
    Editar Dados do Signatario
  </Button>
)}
```

---

## Fluxo Final Corrigido

```text
                   ┌─────────────────────────────────────┐
                   │ Usuario abre proposta publica       │
                   └─────────────────┬───────────────────┘
                                     │
                   ┌─────────────────▼───────────────────┐
                   │ Detectar metadata.contract_id?      │
                   └─────────────────┬───────────────────┘
                                     │
              ┌──────────────────────┴──────────────────────┐
              │ SIM                                         │ NAO
              ▼                                             ▼
   ┌──────────────────────────┐              ┌──────────────────────────┐
   │ hasExistingContract=true │              │ hasExistingContract=false│
   │ Buscar signatario cliente│              └──────────────────────────┘
   └──────────────────────────┘
              │
   ┌──────────▼──────────┐
   │ Tem signatario?     │
   └──────────┬──────────┘
              │
     ┌────────┴────────┐
     │ SIM             │ NAO
     ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Mostrar:     │  │ Mostrar:     │
│ [Ver Contrato]│ │ [Ver Contrato]│
│ [Editar Dados]│ │ (sem editar) │
└──────────────┘  └──────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `supabase/functions/create-contract-from-proposal/index.ts` | Edge Function | Adicionar versao para forcar redeploy |
| `src/pages/public/PropostaPublicaPage.tsx` | React | Verificar signatario antes de exibir botao de edicao |

---

## Operacao de Limpeza (Apos Aprovacao)

Executar DELETE para remover contratos duplicados:

```sql
DELETE FROM contratos_legais 
WHERE proposta_id = 'b890fb70-6c74-4b10-bc42-82204b9550ec' 
AND id != 'e6c09153-c094-4f0b-9941-ad610ba7f7eb';
```

Deletar tambem os signatarios orfaos:

```sql
DELETE FROM contrato_signatarios 
WHERE contrato_id IN (
  '4840dc10-07c4-4494-825e-4d03223a4de6',
  '0c11d02d-a9c4-4a9c-98fe-d3ed69065e3d',
  '9ca20b16-905a-4123-a4f3-aa6806adcc71',
  'd1b42edb-4c1a-4251-9c7a-7800c6bb137f',
  '561599df-2cbb-4a4c-b4aa-828cf68de0e3',
  '92f14337-bfbd-4b1a-b8cd-eb3dcd429fb1',
  '2dd46717-2216-4ffc-8e5a-67446e0521fd',
  'abbf5695-3e26-4545-b102-15921ff75b06',
  '39256a43-eb63-4726-af89-94ae6c1cfdfc'
);
```

---

## Resultado Esperado

1. **Erro 400 corrigido**: Edge Function atualizada verifica existencia ANTES de validar clientData
2. **Zero duplicacao futura**: Logica idempotente garante 1 contrato por proposta
3. **Botao de edicao inteligente**: So aparece quando ja tem signatario registrado
4. **Dados limpos**: Contratos duplicados removidos do banco
