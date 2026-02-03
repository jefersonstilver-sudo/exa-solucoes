

# Analise Juridica Completa: Modulo de Contratos de Permuta

## Diagnostico Executivo

Atuando como advogado especialista, realizei uma auditoria completa do modulo de contratos de permuta e identifiquei **PROBLEMAS CRITICOS** que podem gerar inseguranca juridica significativa.

---

## Proposta de Permuta Analisada

**Numero:** EXA-2026-9673  
**Cliente:** Paola Doldan / New Zone Importados  
**Modalidade:** Permuta  
**Duracao:** 18 meses  
**Telas:** 100 paineis  
**Contrapartida:** 90 Tablets Android 24" Touchscreen (R$ 1.500 cada = R$ 135.000 total)  
**Valor de Referencia Monetaria:** R$ 10.234/mes  

---

## Problemas Identificados

### 1. CRITICO: Contrato Gerado Incorretamente (Edge Function)

A Edge Function `create-contract-from-proposal` **NAO possui tratamento especifico para propostas de PERMUTA**. Ela gera o mesmo contrato de publicidade monetaria padrao, contendo clausulas como:

| Clausula Atual (ERRADA) | Problema Juridico |
|------------------------|-------------------|
| "pagara a CONTRATADA o valor total de R$ X" | Permuta nao envolve pagamento monetario |
| "Multa de 2% + Juros de 1% ao mes" | Inaplicavel a permutas |
| "CRONOGRAMA DE PAGAMENTOS" | Nao existe cronograma financeiro |
| Ausencia de clausula de contrapartida | Objeto central da permuta ignorado |

**Risco:** Contrato juridicamente invalido por desconformidade entre o acordo real (permuta de bens) e o texto contratual (prestacao de servicos monetarios).

---

### 2. CRITICO: ContractPreview.tsx sem Clausulas de Permuta

O componente `ContractPreview.tsx` (linhas 189-312) renderiza clausulas identicas para contratos monetarios e permutas:

```tsx
// Linha 84
const isPermuta = data.tipo_contrato === 'permuta';

// PROBLEMA: isPermuta e definido mas NUNCA utilizado nas clausulas!
// As mesmas clausulas de pagamento sao renderizadas
```

Clausulas que deveriam ser **SUBSTITUIDAS** em permutas:
- Clausula 3 (Valor e Forma de Pagamento) → Deve virar "Da Contrapartida"
- Clausula sobre multa financeira → Deve ser adaptada para inadimplemento de entrega

---

### 3. ALTO: LiveContractPreview.tsx sem Template de Permuta

O componente do fluxo juridico (`LiveContractPreview.tsx`) possui titulo correto para permuta (linha 25):

```tsx
'permuta': 'CONTRATO DE PERMUTA DE SERVIÇOS',
```

Porem, as clausulas renderizadas (linhas 403-452) sao genericas e nao incluem:
- Descricao detalhada dos itens permutados
- Cronograma de entrega dos bens
- Clausula de garantia sobre os bens
- Clausula de conformidade e qualidade
- Clausula de equivalencia de valores

---

### 4. MEDIO: clausulas_padrao sem Template Completo de Permuta

A tabela `clausulas_padrao` possui apenas 2 clausulas aplicaveis a permuta:
- `lgpd` (Protecao de Dados)
- `foro_foz` (Foro de Foz do Iguacu)

**Faltam clausulas essenciais:**
- Clausula de Objeto da Permuta
- Clausula de Descricao dos Bens
- Clausula de Entrega e Prazo
- Clausula de Garantia e Conformidade
- Clausula de Equivalencia de Valores
- Clausula de Inadimplemento especifico

---

### 5. BAIXO: PDF Exporter com Secao de Permuta Incompleta

O `ProposalPDFExporter.tsx` possui o metodo `drawPermutaConditions()` (linhas 856-960) que renderiza a secao de permuta na proposta comercial, porem:

- Lista apenas itens e valores
- Nao inclui termos juridicos de garantia
- Nao menciona prazo de entrega
- Nao menciona condicoes de aceitacao

---

## Clausulas Obrigatorias para Contrato de Permuta (Padrao Juridico)

### Modelo Correto de Clausulas

```text
CLAUSULA 1 - DO OBJETO E DA NATUREZA JURIDICA
1.1. O presente instrumento tem natureza juridica de PERMUTA DE SERVICOS, 
conforme artigos 533 a 535 do Codigo Civil Brasileiro, pelo qual a 
CONTRATADA fornecera servicos de publicidade digital e a CONTRATANTE 
fornecera bens/servicos em contrapartida, sem circulacao de valores monetarios.

CLAUSULA 2 - DA CONTRAPARTIDA DA CONTRATANTE
2.1. A CONTRATANTE se compromete a entregar a CONTRATADA os seguintes bens:
[TABELA DE ITENS: Nome, Quantidade, Valor Unitario, Valor Total]

2.2. O valor estimado total da contrapartida e de R$ [VALOR], correspondente 
ao valor de referencia dos servicos de publicidade.

CLAUSULA 3 - DO PRAZO E FORMA DE ENTREGA
3.1. Os bens descritos deverao ser entregues no endereco [X], ate [DATA], 
em perfeito estado de funcionamento e embalagem original.

3.2. A CONTRATADA podera recusar itens que nao atendam as especificacoes 
acordadas, devendo comunicar a CONTRATANTE em ate 48 horas.

CLAUSULA 4 - DA GARANTIA DOS BENS
4.1. A CONTRATANTE garante que os bens entregues:
a) Sao de sua propriedade legitima;
b) Estao livres de onus, gravames ou restricoes;
c) Possuem garantia de fabrica de no minimo [X] meses;
d) Acompanham nota fiscal e documentacao de origem.

CLAUSULA 5 - DA EQUIVALENCIA DE VALORES
5.1. As partes declaram que os valores atribuidos aos servicos de publicidade 
(R$ [VALOR_REF]) e aos bens permutados (R$ [VALOR_PERMUTA]) sao equivalentes 
e justos, nao havendo torna ou diferenca a ser paga.

CLAUSULA 6 - DO INADIMPLEMENTO
6.1. O descumprimento por qualquer das partes de suas obrigacoes constituira 
a outra parte em mora, autorizando a resolucao do contrato.

6.2. A parte inadimplente respondera por perdas e danos, incluindo lucros 
cessantes e danos emergentes.

6.3. Em caso de nao entrega dos bens pela CONTRATANTE, esta devera pagar 
o valor monetario equivalente de R$ [VALOR_PERMUTA] no prazo de 10 dias.

CLAUSULA 7 - DA CONTRAPARTIDA DA CONTRATADA (SERVICOS)
7.1. A CONTRATADA se compromete a fornecer:
- [X] meses de veiculacao publicitaria
- [X] telas/paineis digitais
- Especificacoes tecnicas conforme Anexo I
```

---

## Plano de Correcao

### Fase 1: Edge Function (URGENTE)

**Arquivo:** `supabase/functions/create-contract-from-proposal/index.ts`

1. Adicionar verificacao de `modalidade_proposta` (permuta vs monetaria)
2. Criar funcao `generatePermutaContractHtml()` separada
3. Incluir clausulas especificas de permuta:
   - Objeto da Permuta
   - Descricao detalhada da contrapartida
   - Prazo de entrega dos bens
   - Garantias sobre os bens
   - Equivalencia de valores
   - Inadimplemento especifico

### Fase 2: ContractPreview.tsx

**Arquivo:** `src/components/admin/contracts/ContractPreview.tsx`

1. Utilizar a variavel `isPermuta` para renderizar clausulas diferenciadas
2. Criar bloco condicional para Clausula 3 (Contrapartida vs Pagamento)
3. Adicionar secao de "Itens Permutados" antes das assinaturas

### Fase 3: LiveContractPreview.tsx

**Arquivo:** `src/components/legal-flow/LiveContractPreview.tsx`

1. Adicionar condicional `isPermuta` nas clausulas
2. Renderizar campos editaveis para itens permutados
3. Incluir clausula de garantia dos bens

### Fase 4: Banco de Dados

**Tabela:** `clausulas_padrao`

Inserir novas clausulas com `tipos_contrato: ['permuta']`:
- `permuta_objeto`
- `permuta_contrapartida`
- `permuta_entrega`
- `permuta_garantia`
- `permuta_equivalencia`
- `permuta_inadimplemento`

---

## Resumo da Auditoria

| Componente | Status | Risco |
|------------|--------|-------|
| Edge Function `create-contract-from-proposal` | Clausulas monetarias aplicadas em permutas | CRITICO |
| ContractPreview.tsx | `isPermuta` ignorado | CRITICO |
| LiveContractPreview.tsx | Template generico | ALTO |
| clausulas_padrao | Faltam 6 clausulas essenciais | MEDIO |
| ProposalPDFExporter.tsx | Secao de permuta basica | BAIXO |

**Veredicto Juridico:** O contrato gerado atualmente para a proposta EXA-2026-9673 (Paola Doldan / New Zone Importados) **NAO REPRESENTA** juridicamente o acordo de permuta firmado entre as partes, podendo ser contestado em juizo por desconformidade entre vontade das partes e instrumento contratual.

**Recomendacao:** Implementar as correcoes ANTES de enviar qualquer contrato de permuta para assinatura no ClickSign.

