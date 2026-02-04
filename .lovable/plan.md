

# Plano: Multa de Rescisão Bilateral (Cliente + EXA)

## Contexto

Atualmente o sistema permite configurar multa de rescisão apenas para o **CONTRATANTE (cliente)**. O usuário solicitou adicionar a possibilidade de configurar também uma multa para a **CONTRATADA (EXA/empresa)**, criando uma proteção contratual bilateral.

## Situação Atual

| Campo | Existe | Descrição |
|-------|--------|-----------|
| `multa_rescisao_ativa` | Sim | Se a multa do **cliente** está ativa |
| `multa_rescisao_percentual` | Sim | Percentual da multa do **cliente** (0-50%) |
| Multa da EXA | **NÃO EXISTE** | Precisa ser criada |

## Mudanças Necessárias

### Fase 1: Banco de Dados

Adicionar 2 novas colunas nas tabelas `proposals` e `contratos_legais`:

```sql
-- Tabela proposals
ALTER TABLE proposals 
ADD COLUMN multa_rescisao_exa_ativa boolean DEFAULT true,
ADD COLUMN multa_rescisao_exa_percentual numeric DEFAULT 20;

-- Tabela contratos_legais
ALTER TABLE contratos_legais 
ADD COLUMN multa_rescisao_exa_ativa boolean DEFAULT true,
ADD COLUMN multa_rescisao_exa_percentual numeric DEFAULT 20;
```

### Fase 2: Interface (NovaPropostaPage.tsx)

Adicionar novos estados e UI para configurar a multa da EXA:

**Novos Estados:**
```typescript
const [multaRescisaoExaAtiva, setMultaRescisaoExaAtiva] = useState(true);
const [multaRescisaoExaPercentual, setMultaRescisaoExaPercentual] = useState<number>(20);
```

**Nova UI** (abaixo do card de multa do cliente):
- Card com título "Multa de Rescisão da CONTRATADA (EXA)"
- Switch para ativar/desativar
- Slider para definir percentual (0-50%)
- Texto explicativo: "Em caso de rescisão antecipada por culpa da EXA, a empresa pagará X% sobre o valor restante do contrato"

### Fase 3: Persistência

Atualizar os 3 pontos de salvamento da proposta:
1. **handleSaveClick** (linha ~958): Adicionar campos `multa_rescisao_exa_ativa` e `multa_rescisao_exa_percentual`
2. **saveDraft** (linha ~1537): Adicionar os mesmos campos
3. **handleSubmit** (linha ~1834): Adicionar os mesmos campos

### Fase 4: Carregamento de Proposta Existente

Ao carregar proposta para edição (linha ~642), ler também:
```typescript
setMultaRescisaoExaAtiva(existingProposal.multa_rescisao_exa_ativa !== false);
setMultaRescisaoExaPercentual(existingProposal.multa_rescisao_exa_percentual || 20);
```

### Fase 5: Edge Function (create-contract-from-proposal)

Modificar o gerador de contrato para incluir a cláusula bilateral:

**Cláusula 11.2** (atual - multa do cliente):
> "Em caso de rescisão antecipada por iniciativa do CONTRATANTE..."

**Nova Cláusula 11.3** (multa da EXA):
> "Em caso de rescisão antecipada por culpa da CONTRATADA, esta deverá pagar ao CONTRATANTE multa rescisória correspondente a X% (por extenso) do valor restante do contrato, além da restituição proporcional dos valores pagos pelo período não usufruído."

### Fase 6: Contrato de Permuta

Para contratos de permuta, ajustar a cláusula 8.3 para incluir também a multa bilateral sobre o valor de referência.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Criar 4 novas colunas (2 em proposals, 2 em contratos_legais) |
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar estados, UI e persistência |
| `supabase/functions/create-contract-from-proposal/index.ts` | Ler novos campos e gerar cláusula bilateral |

---

## Resultado Esperado na UI

A seção de "Multa de Rescisão" será expandida com 2 cards:

**Card 1 - Multa do Cliente:**
- Switch: Ativar multa do cliente
- Slider: Percentual (0-50%)
- Texto: "Em caso de rescisão antecipada pelo cliente, ele pagará X% sobre o valor remanescente"

**Card 2 - Multa da EXA:**
- Switch: Ativar multa da empresa
- Slider: Percentual (0-50%)  
- Texto: "Em caso de rescisão por culpa da EXA, a empresa pagará X% sobre o valor remanescente"

---

## Resultado no Contrato Gerado

### Cenário 1: Ambas ativas (30% cliente, 20% EXA)
```text
Cláusula 11.2. Em caso de rescisão antecipada por iniciativa do 
CONTRATANTE, sem justa causa, será devida multa rescisória 
correspondente a 30% (trinta por cento) do valor restante.

Cláusula 11.3. Em caso de rescisão antecipada por culpa da 
CONTRATADA, esta deverá pagar ao CONTRATANTE multa rescisória 
correspondente a 20% (vinte por cento) do valor restante, além 
da restituição proporcional dos valores pagos.
```

### Cenário 2: Apenas multa do cliente ativa
```text
Cláusula 11.2. Em caso de rescisão antecipada por iniciativa do 
CONTRATANTE, sem justa causa, será devida multa rescisória 
correspondente a 30% (trinta por cento) do valor restante.

Cláusula 11.3. Em caso de rescisão por culpa da CONTRATADA, 
esta deverá restituir ao CONTRATANTE os valores pagos 
proporcionalmente ao período não usufruído, sem aplicação 
de multa rescisória.
```

### Cenário 3: Ambas desativadas
```text
Cláusula 11.2. Este contrato não prevê aplicação de multa 
rescisória em caso de rescisão antecipada por qualquer das 
partes, devendo apenas ser respeitado o aviso prévio de 
30 (trinta) dias e a restituição proporcional quando aplicável.
```

