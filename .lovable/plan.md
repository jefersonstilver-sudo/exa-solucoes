

# Plano: Implementar Multa Rescisória Dinâmica nos Contratos

## Problema Identificado

Atualmente, a configuração de multa rescisória feita na proposta (**ativa/inativa + percentual**) **NÃO é aplicada** no contrato gerado. O valor está **hardcoded em 20%** na Edge Function, ignorando completamente as configurações definidas pelo administrador.

## Diagnóstico Técnico

| Componente | Status | Detalhes |
|------------|--------|----------|
| NovaPropostaPage.tsx | ✅ OK | Possui switch e slider para configurar multa (0-50%) |
| Tabela `proposals` | ✅ OK | Campos `multa_rescisao_ativa` e `multa_rescisao_percentual` existem |
| Tabela `contratos_legais` | ❌ FALTA | Não possui os campos de multa |
| Edge Function | ❌ ERRO | Ignora campos da proposta, usa 20% fixo na cláusula 11.2 |

## Fluxo do Problema

```text
Admin configura proposta:
┌──────────────────────────────────────┐
│ [✓] Multa de Rescisão: ATIVA         │
│ Percentual: 35%                      │
└──────────────────────────────────────┘
            ↓
Contrato gerado (cláusula 11.2):
┌──────────────────────────────────────┐
│ "...multa de 20% (vinte por cento)   │ ← IGNORA CONFIGURAÇÃO!
│ do valor restante do contrato."      │
└──────────────────────────────────────┘
```

## Correções Necessárias

### Fase 1: Banco de Dados

Adicionar colunas à tabela `contratos_legais`:

```sql
ALTER TABLE contratos_legais 
ADD COLUMN multa_rescisao_ativa boolean DEFAULT true,
ADD COLUMN multa_rescisao_percentual numeric DEFAULT 20;
```

### Fase 2: Edge Function (create-contract-from-proposal)

#### 2.1. Ler campos da proposta

No objeto `contratoData` (linha ~375-440), adicionar:

```typescript
// MULTA DE RESCISÃO
multa_rescisao_ativa: proposal.multa_rescisao_ativa !== false, // default true
multa_rescisao_percentual: proposal.multa_rescisao_percentual || 20,
```

#### 2.2. Passar valores para o gerador de HTML

Atualizar a função `generateContractHtml()` para receber e usar esses valores.

#### 2.3. Modificar Cláusula 11.2 (Rescisão)

**Antes (linha 1790):**
```typescript
<p>...multa rescisória correspondente a <strong>20% (vinte por cento)</strong>...</p>
```

**Depois:**
```typescript
// Se multa ativa
${multaRescisaoAtiva ? `
  <p><span class="clause-title">${11 + clauseOffset}.2.</span> Em caso de rescisão antecipada por iniciativa do CONTRATANTE, sem justa causa, será devida multa rescisória correspondente a <strong>${multaPercentual}% (${extenso(multaPercentual)} por cento)</strong> do valor restante do contrato.</p>
` : `
  <p><span class="clause-title">${11 + clauseOffset}.2.</span> Este contrato não prevê aplicação de multa rescisória em caso de rescisão antecipada por qualquer das partes.</p>
`}
```

### Fase 3: Atualizar Contratos de Permuta

A mesma lógica deve ser aplicada aos contratos de permuta (cláusula 8.3). Se `multa_rescisao_ativa = false`, remover a menção à multa no inadimplemento.

## Resultado Esperado

### Cenário 1: Multa Ativa (30%)
```text
Cláusula 11.2. Em caso de rescisão antecipada por iniciativa do 
CONTRATANTE, será devida multa rescisória correspondente a 
30% (trinta por cento) do valor restante do contrato.
```

### Cenário 2: Multa Desativada
```text
Cláusula 11.2. Este contrato não prevê aplicação de multa 
rescisória em caso de rescisão antecipada por qualquer das partes.
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Criar colunas na tabela `contratos_legais` |
| `supabase/functions/create-contract-from-proposal/index.ts` | Ler campos da proposta e gerar cláusula dinâmica |

## Detalhes de Implementação

### Tabela: contratos_legais

```sql
ALTER TABLE contratos_legais 
ADD COLUMN IF NOT EXISTS multa_rescisao_ativa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS multa_rescisao_percentual numeric DEFAULT 20;

COMMENT ON COLUMN contratos_legais.multa_rescisao_ativa IS 'Se a multa rescisória está ativa neste contrato';
COMMENT ON COLUMN contratos_legais.multa_rescisao_percentual IS 'Percentual da multa rescisória (0-50)';
```

### Edge Function: Modificações

1. **contratoData** (linha ~435): Adicionar campos de multa
2. **generateContractHtml**: Adicionar parâmetros `multaRescisaoAtiva` e `multaRescisaoPercentual`
3. **Cláusula 11** (linha ~1789): Renderizar condicionalmente baseado na configuração
4. **Contratos de Permuta**: Ajustar cláusula 8.3 para respeitar configuração de multa

