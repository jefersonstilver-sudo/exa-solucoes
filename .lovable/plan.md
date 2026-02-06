

# Auditoria e Correção: Frases Cortadas no PDF do Contrato

## Problema Identificado

Analisando o PDF enviado e as imagens, identifiquei dois tipos de corte:

| Local | Exemplo | Causa |
|-------|---------|-------|
| **Tabela de Prédios** | CEP "85852-150" cortado e aparecendo na próxima página | html2canvas corta canvas em altura fixa, sem respeitar limites de tabela |
| **Títulos de Cláusulas** | "CLÁUSULA 8ª - DOS DIREITOS..." cortada pela metade (texto branco sobre fundo vermelho) | Mesma causa: quebra por pixel, não por elemento |

## Causa Técnica

O arquivo `src/components/public/ContractFullPreview.tsx` (linhas 292-315) usa **corte linear por pixels**:

```typescript
// PROBLEMA: Corta por altura fixa de pixels
const sourceY = i * (canvas.height / totalPages);
const sourceHeight = canvas.height / totalPages;

// Desenha o pedaço cortado
ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, ...);
```

Isso **ignora** se uma frase ou elemento HTML está no meio daquela altura.

## Solução Proposta: Paginação Inteligente por Seções

Implementar um sistema de **quebra inteligente por elementos DOM** em vez de corte por pixels:

### 1. Marcar Seções no HTML (Edge Function)

Na função `generateContractHtml`, envolver cada cláusula, tabela e seção com uma classe `.contract-section`:

```html
<div class="contract-section">
  <h2 class="section-title">CLÁUSULA 8ª - DOS DIREITOS...</h2>
  <p>8.1. O CONTRATANTE declara...</p>
</div>
```

### 2. Implementar Algoritmo de Paginação por Seções

No `ContractFullPreview.tsx`, substituir o corte por pixels pelo seguinte algoritmo:

```
Para cada seção do contrato:
1. Calcular altura da seção em pixels
2. Verificar se cabe na página atual
3. Se não cabe:
   a. Finalizar página atual
   b. Iniciar nova página
   c. Colocar seção inteira na nova página
4. Renderizar seção por seção, nunca cortando no meio
```

### 3. Regras de Quebra

| Elemento | Regra |
|----------|-------|
| Título de Cláusula | NUNCA separar do primeiro parágrafo |
| Tabela | NUNCA quebrar no meio de uma linha |
| Parágrafo longo | Permitir quebra, mas apenas entre linhas de texto |
| Seção de Assinaturas | NUNCA quebrar (fica inteira na última página) |

## Arquivos a Modificar

### Arquivo 1: Edge Function - Adicionar Marcadores de Seção

**Arquivo:** `supabase/functions/create-contract-from-proposal/index.ts`

**Mudanças:**
- Envolver cada cláusula com `<div class="contract-section no-break">`
- Envolver tabelas com `<div class="contract-section table-section no-break">`
- Manter títulos de seção (vermelho) juntos com o primeiro parágrafo

### Arquivo 2: ContractFullPreview - Paginação Inteligente

**Arquivo:** `src/components/public/ContractFullPreview.tsx`

**Mudanças:**
- Substituir algoritmo de corte por pixels por algoritmo de paginação por seções
- Implementar função `captureSection()` que renderiza cada seção separadamente
- Calcular dinamicamente quantas seções cabem em cada página A4
- Garantir que `.section-title` sempre acompanha o conteúdo seguinte

### Arquivo 3: ContractPDFExporter (Fallback Admin)

**Arquivo:** `src/components/admin/contracts/ContractPDFExporter.tsx`

**Mudanças:**
- Aplicar a mesma lógica de paginação inteligente
- O método `generateBase64FromElement` já tem lógica parcial (busca `.contract-section`), mas precisa melhorar o cálculo de altura

## Resultado Esperado

Após a implementação:

1. **Tabelas** nunca terão linhas cortadas entre páginas
2. **Títulos de cláusulas** (fundo vermelho) sempre estarão na mesma página que o primeiro parágrafo
3. **Parágrafos longos** podem quebrar, mas apenas entre linhas completas
4. **Seção de assinaturas** sempre fica inteira na última página
5. **Sistema de auditoria** (logs) para detectar problemas de paginação futuros

## Detalhes Técnicos da Implementação

### Nova Lógica de Paginação (Pseudocódigo)

```javascript
async function generatePDFWithSmartBreaks(element) {
  const sections = element.querySelectorAll('.contract-section');
  const pdf = new jsPDF('portrait', 'mm', 'a4');
  
  const PAGE_HEIGHT_PX = 1050; // Altura útil A4 em pixels (com margens)
  let currentPageHeight = 0;
  let currentPageSections = [];
  const pages = [];
  
  for (const section of sections) {
    const sectionHeight = section.getBoundingClientRect().height;
    
    // Se seção não cabe na página atual
    if (currentPageHeight + sectionHeight > PAGE_HEIGHT_PX && currentPageSections.length > 0) {
      // Finalizar página atual
      pages.push([...currentPageSections]);
      currentPageSections = [];
      currentPageHeight = 0;
    }
    
    // Adicionar seção à página atual
    currentPageSections.push(section);
    currentPageHeight += sectionHeight;
  }
  
  // Última página
  if (currentPageSections.length > 0) {
    pages.push(currentPageSections);
  }
  
  // Renderizar cada página
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage();
    
    const pageContent = createTempContainer(pages[i]);
    const canvas = await html2canvas(pageContent);
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), ...);
  }
  
  return pdf;
}
```

### Validações de Qualidade (Auditoria)

O sistema incluirá logs de auditoria:

```javascript
console.log(`📄 Contrato: ${sections.length} seções identificadas`);
console.log(`📄 Páginas geradas: ${pages.length}`);
for (let i = 0; i < pages.length; i++) {
  console.log(`  Página ${i+1}: ${pages[i].length} seções`);
}
```

## Plano de Testes

Após implementação, testar com:
1. Contrato com tabela de 20+ prédios (deve paginar corretamente)
2. Contrato com muitas cláusulas especiais
3. Contrato de permuta (tem Anexo III extra)
4. Contrato curto (1-2 páginas)

