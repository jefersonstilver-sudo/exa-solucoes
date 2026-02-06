
# Correção Definitiva: PDF com Frases Distorcidas e Cortadas

## Diagnóstico Técnico

### Problema Identificado
Os logs de console revelaram a causa exata:

```
📄 [ContractPDF] Página 2 fechada com 1 seções (1534px)
📏 [ContractPDF] Altura máxima por página: 1165px
```

**Uma seção única (tabela de prédios) tem 1534px, mas a página só suporta 1165px.**

Quando isso acontece, o código atual:
1. Captura a seção inteira com `html2canvas` (1534px de altura)
2. Força a imagem em um espaço de 273mm de altura
3. **Resultado: compressão vertical que distorce letras e números**

### Evidências do PDF
| Local | Resultado | Causa |
|-------|-----------|-------|
| Nome cliente | "Silvester Kam" (cortado) | Largura insuficiente na célula da tabela |
| CNPJ | "01.755.279/000" (incompleto) | Mesma causa + compressão |
| Email | "...@grupokammer." (incompleto) | Truncamento por largura fixa |

## Solução Completa

### 1. Captura por Página Completa (Em vez de por Seção)
Mudar a estratégia: em vez de capturar seções individuais e tentar encaixar, vamos:
1. Renderizar TODO o conteúdo em um container de largura fixa (794px)
2. Capturar o canvas completo
3. Dividir o canvas em "fatias" respeitando limites de elementos

### 2. Algoritmo de Divisão Inteligente
```javascript
// Passo 1: Capturar TODO o HTML em um único canvas grande
const fullCanvas = await html2canvas(tempContainer, { scale: 2, width: 794 });

// Passo 2: Identificar "linhas seguras" para corte
const safeBreakPoints = findSafeBreakPoints(tempContainer);

// Passo 3: Para cada página, cortar no ponto seguro mais próximo
for (let page = 0; page < totalPages; page++) {
  const startY = page === 0 ? 0 : safeBreakPoints[page - 1];
  const endY = safeBreakPoints[page] || canvas.height;
  
  // Copiar apenas esse trecho do canvas
  const pageCanvas = cropCanvas(fullCanvas, startY, endY);
  pdf.addImage(pageCanvas, ...);
}
```

### 3. Regras de "Pontos Seguros"
| Elemento | Regra de Corte |
|----------|----------------|
| Linha de tabela (`<tr>`) | Cortar ENTRE linhas, nunca no meio |
| Parágrafo (`<p>`) | Cortar ENTRE parágrafos |
| Título de cláusula | NUNCA separar do primeiro parágrafo seguinte |
| Grid de informações | Manter blocos inteiros |

### 4. Fallback para Seções Gigantes
Se uma seção única é maior que a página:
1. Identificar sub-elementos (linhas de tabela, parágrafos)
2. Dividir a seção em partes menores
3. Permitir quebra entre linhas de tabela

## Arquivos a Modificar

### Arquivo 1: `src/components/public/ContractFullPreview.tsx`
**Mudanças:**
- Substituir algoritmo de "seções agrupadas" por "canvas único com corte inteligente"
- Implementar `findSafeBreakPoints()` para identificar limites de elementos
- Adicionar fallback para tabelas grandes (quebra entre `<tr>`)

### Arquivo 2: `src/components/admin/contracts/ContractPDFExporter.tsx`
**Mudanças:**
- Mesma lógica de corte inteligente
- Unificar comportamento com o preview público

### Arquivo 3: Edge Function `create-contract-from-proposal`
**Mudanças:**
- Remover `white-space: nowrap` da tabela (causa truncamento)
- Permitir quebra de texto em células longas
- Adicionar `word-break: break-word` para emails/CNPJs longos

## Detalhes Técnicos da Implementação

### Nova Função: `findSafeBreakPoints()`
```javascript
function findSafeBreakPoints(container: HTMLElement, maxPageHeight: number): number[] {
  const breakPoints: number[] = [];
  let currentY = 0;
  
  // Identificar todos os elementos que podem ser "pontos de quebra"
  const breakableElements = container.querySelectorAll('tr, p, .clause, .section, .info-row');
  
  for (const element of breakableElements) {
    const rect = element.getBoundingClientRect();
    const elementBottom = rect.bottom - container.getBoundingClientRect().top;
    
    // Se passar do limite da página, marcar o ponto anterior como quebra
    if (elementBottom > currentY + maxPageHeight) {
      // Encontrar o último elemento que cabe na página
      breakPoints.push(rect.top - container.getBoundingClientRect().top);
      currentY = rect.top - container.getBoundingClientRect().top;
    }
  }
  
  return breakPoints;
}
```

### Correção CSS para Células de Tabela (Edge Function)
```css
/* ANTES (causa truncamento): */
th, td {
  white-space: nowrap;  /* ❌ REMOVER */
}

/* DEPOIS (permite quebra controlada): */
th, td {
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 200px;
}

.info-value {
  word-break: break-word;
  text-align: right;
}
```

## Fluxo Visual da Solução

```text
┌──────────────────────────────────────────────────────────────┐
│                    HTML COMPLETO                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Header                                                  │ │
│  │ Título                                                  │ │
│  │ Cláusula 1 (Partes) ← info-grid com dados             │ │
│  │ Cláusula 2 (Objeto)                                    │ │
│  ├─────────────────────────────────────────────────────────┤ │ ← Ponto seguro 1 (entre seções)
│  │ Cláusula 3 (Locais)                                    │ │
│  │   ┌─ Tabela grande ─────────────────────────────────┐  │ │
│  │   │ Linha 1                                         │  │ │
│  │   │ Linha 2                                         │  │ │
│  │   │ Linha 3                                         │  │ │
│  │   ├─────────────────────────────────────────────────┤  │ │ ← Ponto seguro 2 (entre linhas)
│  │   │ Linha 4                                         │  │ │
│  │   │ ...                                             │  │ │
│  │   └─────────────────────────────────────────────────┘  │ │
│  ├─────────────────────────────────────────────────────────┤ │ ← Ponto seguro 3
│  │ Cláusula 4...                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
          ┌───────────────────────────────────┐
          │       CANVAS ÚNICO (2x)            │
          │  Toda a altura do documento        │
          │  Largura fixa: 794px               │
          └───────────────────────────────────┘
                          │
           Dividir em breakPoints[]
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    ┌───────────┐                   ┌───────────┐
    │  Página 1 │                   │  Página 2 │
    │ (0 → BP1) │                   │(BP1 → BP2)│
    └───────────┘                   └───────────┘
```

## Validações e Auditoria

O sistema incluirá logs detalhados:

```javascript
console.log(`📐 [PDF] Canvas total: ${fullCanvas.height}px`);
console.log(`📍 [PDF] ${breakPoints.length} pontos de quebra identificados`);
breakPoints.forEach((bp, i) => console.log(`  Ponto ${i+1}: ${bp}px`));
console.log(`📄 [PDF] ${totalPages} páginas geradas`);
```

## Resultado Esperado

Após implementação:

1. **Nomes completos**: "Silvester Kammer" (sem corte)
2. **CNPJ completo**: "01.755.279/0001-XX" (formatado corretamente)
3. **Emails completos**: Quebra de linha quando necessário
4. **Tabelas**: Quebra entre linhas, nunca no meio de uma célula
5. **Cláusulas**: Títulos sempre junto com o primeiro parágrafo

## Plano de Testes

1. Contrato com 15+ prédios (tabela grande)
2. Contrato com cliente PJ (dados longos de CNPJ/razão social)
3. Contrato de permuta (Anexo III extra)
4. Contrato curto (1-2 páginas) - não deve quebrar
