

# Plano: Botao de Download PDF Profissional (Sem Rascunho)

## Resumo do Problema

O componente `ContractFullPreview.tsx` atualmente:
1. Usa botao de **impressao** (Printer) ao inves de download
2. Exibe marca d'agua "RASCUNHO" que nao deve aparecer no PDF final
3. Nao possui logica inteligente de paginacao (corta frases no meio)
4. Nao mostra os dados dos signatarios no preview

---

## Solucao Proposta

### 1. Botao de Download PDF (Substituir Impressao)

| Antes | Depois |
|-------|--------|
| Icone `Printer` | Icone `Download` |
| Funcao `handlePrint()` | Funcao `handleDownloadPDF()` |
| Abre janela de impressao | Gera PDF e baixa automaticamente |

```text
┌─────────────────────────────────────────┐
│  [Download]  [X]                        │  <- Novo icone
└─────────────────────────────────────────┘
```

### 2. Remover Marca d'Agua "RASCUNHO"

**Arquivos afetados:**
- Remover `<div class="watermark">RASCUNHO</div>` do HTML gerado
- Remover o bloco JSX que renderiza a marca d'agua no preview

### 3. Exportador PDF Inteligente

Implementar logica de paginacao inteligente usando `jsPDF` + `html2canvas`:

```text
ANTES (corta frases):           DEPOIS (preserva blocos):
┌────────────────────┐          ┌────────────────────┐
│ CLAUSULA 5         │          │ CLAUSULA 5         │
│ 5.1 O pagamento    │          │ 5.1 O pagamento    │
│ sera realizado em  │          │ sera realizado em  │
├────────────────────┤ <- CORTE │ parcelas mensais.  │
│ parcelas mensais.  │          ├────────────────────┤ <- CORTE
│                    │          │ CLAUSULA 6         │
│ CLAUSULA 6         │          │ ...                │
└────────────────────┘          └────────────────────┘
```

**Estrategia:**
1. Identificar elementos com classe `.section`, `.no-break`, `.clause`
2. Medir altura de cada bloco antes de renderizar
3. Se um bloco ultrapassar o limite da pagina, mover inteiro para proxima pagina
4. Usar `page-break-inside: avoid` como fallback CSS

### 4. Dados dos Signatarios

O HTML do contrato ja inclui a secao de assinaturas (linhas 1545-1607 da Edge Function), porem os dados podem nao estar aparecendo corretamente no preview.

**Verificacao:**
- Garantir que `exaSignatarios` esta sendo passado corretamente
- Adicionar CSS para estilizar a secao `.signature-section`

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/components/public/ContractFullPreview.tsx` | Substituir botao Print por Download, remover watermark, implementar `handleDownloadPDF()` |
| CSS inline | Adicionar estilos para `.signature-section`, `.signature-box`, `.witness-section` |

---

## Implementacao Tecnica

### Funcao `handleDownloadPDF()`

```typescript
const handleDownloadPDF = async () => {
  if (!contractRef.current) return;
  setIsDownloading(true);

  try {
    // 1. Clonar elemento (sem marca d'agua)
    const element = contractRef.current.querySelector('.contract-content');
    
    // 2. Renderizar com html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    // 3. Criar PDF com jsPDF
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    
    // 4. Paginacao inteligente (nao cortar blocos)
    // ... logica de secoes
    
    // 5. Download automatico
    pdf.save(`contrato-exa-${Date.now()}.pdf`);
  } finally {
    setIsDownloading(false);
  }
};
```

### CSS para Secao de Assinaturas

```css
.contract-content .signature-section {
  margin-top: 60px;
  page-break-inside: avoid;
}

.contract-content .signatures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
}

.contract-content .signature-box {
  text-align: center;
}

.contract-content .signature-line {
  border-top: 1px solid #333;
  margin-top: 70px;
  padding-top: 10px;
}
```

---

## Resultado Esperado

```text
ANTES:                              DEPOIS:
┌────────────────────────┐          ┌────────────────────────┐
│ [Printer] Rascunho     │          │ [Download] Contrato    │
├────────────────────────┤          ├────────────────────────┤
│                        │          │                        │
│   R A S C U N H O      │          │ (sem marca d'agua)     │
│                        │          │                        │
│ Clausula 5...          │          │ Clausula 5...          │
│ (cortada no meio)      │          │ (completa)             │
│                        │          ├────────────────────────┤
│ (sem assinaturas)      │          │ ASSINATURAS            │
│                        │          │ __________________     │
│                        │          │ Jeferson S. R. Encina  │
│                        │          │ Socio - EXA Midia      │
│                        │          │ CPF: xxx.xxx.xxx-xx    │
└────────────────────────┘          └────────────────────────┘
```

---

## Dependencias Existentes

O projeto ja possui as bibliotecas necessarias:
- `jspdf` (versao ^3.0.4)
- `html2canvas` (versao ^1.4.1)

Nao e necessario instalar nada novo.

