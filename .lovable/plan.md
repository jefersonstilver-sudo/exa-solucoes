
# Plano: Padronizar Cabeçalho Oficial EXA em Todos os Contratos

## Objetivo
Estender o cabeçalho atual do `LiveContractPreview.tsx` (imagem full-width `exa-contract-header.png`) para **todos os componentes e funções** que geram ou exibem contratos no sistema.

---

## Componentes e Arquivos Identificados

### 1. Componentes Frontend (React)

| Arquivo | Situação Atual | Ação Necessária |
|---------|----------------|-----------------|
| `LiveContractPreview.tsx` | JÁ USA imagem oficial | Nenhuma (referência) |
| `ContractPreview.tsx` | Usa logo antiga + CSS badge | Substituir por imagem oficial |
| `ComodatoTemplate.tsx` | Usa SVG inline + gradiente | Substituir por imagem oficial |
| `ContractPDFExporter.tsx` | Gera header via jsPDF | Atualizar método `exportFromData` |

### 2. Edge Functions (Backend - Geração de HTML)

| Arquivo | Situação Atual | Ação Necessária |
|---------|----------------|-----------------|
| `create-contract-from-proposal/index.ts` | Usa CSS `.header` com logo URL | Substituir por imagem oficial full-width |
| `clicksign-create-contract/index.ts` | Usa CSS gradiente + logo box | Substituir por imagem oficial full-width |

---

## Abordagem Técnica

### A. Upload da Imagem para Storage Público
A imagem `exa-contract-header.png` precisa estar disponível publicamente via URL para ser usada nas Edge Functions (que não têm acesso aos assets locais do frontend).

```text
Destino: Supabase Storage → bucket "arquivos" → pasta "logo e icones"
URL Final: https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png
```

### B. Constante Global para URL do Header
Criar uma constante única para evitar duplicação:

```typescript
const EXA_CONTRACT_HEADER_URL = "https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/exa-contract-header.png";
```

### C. Padrão de Implementação do Header (CSS Inline)

```html
<!-- HEADER OFICIAL EXA - Full Width -->
<div style="width: calc(100% + 40px); margin: -15px -20px 15px -20px; display: block;">
  <img 
    src="[EXA_CONTRACT_HEADER_URL]" 
    alt="EXA Header" 
    style="width: 100%; height: auto; display: block;"
  />
</div>
```

---

## Etapas de Implementação

### Etapa 1: Upload da Imagem para Storage
1. Copiar `src/assets/exa-contract-header.png` para o Supabase Storage
2. Garantir que o bucket `arquivos` está público
3. Testar a URL de acesso

### Etapa 2: Atualizar Componentes Frontend

**2.1 - `ContractPreview.tsx`**
- Remover: `EXA_LOGO_URL` e todo o bloco de header antigo (linhas 125-145)
- Adicionar: Import da imagem + novo header com `<img>` full-width
- Ajustar: Padding do container principal

**2.2 - `ComodatoTemplate.tsx`**
- Remover: Componente `ExaLogo()` (SVG inline)
- Remover: Header com gradiente (linhas 72-85)
- Adicionar: Mesmo padrão de header com imagem oficial

**2.3 - `ContractPDFExporter.tsx`**
- Atualizar método `exportFromData()` (linha 296+)
- Substituir desenho do header via jsPDF por imagem

### Etapa 3: Atualizar Edge Functions

**3.1 - `create-contract-from-proposal/index.ts`**
- Localizar: Bloco CSS `.header` (linhas 677-695)
- Substituir: Por novo CSS que usa `<img>` full-width
- Atualizar: Template HTML no retorno

**3.2 - `clicksign-create-contract/index.ts`**
- Localizar: Bloco CSS `.header` (linhas 909-941) e `generateSindicoContractHtml` (linha 1461-1467)
- Substituir: Ambos os headers por padrão com imagem oficial
- Atualizar: Template HTML para contratos de anunciante e síndico

---

## Arquivos a Serem Modificados

1. `src/components/admin/contracts/ContractPreview.tsx`
2. `src/components/admin/contracts/ComodatoTemplate.tsx`
3. `src/components/admin/contracts/ContractPDFExporter.tsx`
4. `supabase/functions/create-contract-from-proposal/index.ts`
5. `supabase/functions/clicksign-create-contract/index.ts`

---

## Resultado Esperado
Todos os contratos do sistema (visualização, PDF, ClickSign) terão o cabeçalho idêntico ao `LiveContractPreview.tsx` - imagem full-width com fundo vermelho oficial da EXA.

---

## Observação Importante
Antes de iniciar a implementação, será necessário confirmar se a imagem `exa-contract-header.png` já está no Supabase Storage ou se precisará ser uploaded manualmente.
