
# Plano: Reconstrução do Layout Contas a Pagar - Design Corporativo Elegante

## Análise do Estado Atual

Após análise dos arquivos, identifiquei os seguintes problemas de design:

### Problemas Visuais Identificados
1. **Inconsistência de espaçamento** - Padding e gaps irregulares
2. **Cards sem hierarquia visual clara** - Todos os elementos têm o mesmo peso visual
3. **Header desalinhado** - Botões sem agrupamento lógico
4. **Modal de pagamento** - Lista de saídas ASAAS sem valores visíveis e layout confuso
5. **Falta de tipografia corporativa** - Fontes sem hierarquia clara
6. **Cores sem sistema** - Uso inconsistente de cores de status
7. **Responsividade quebrada** - Mobile com elementos sobrepostos

## Solução: Design System Corporativo

### Arquitetura do Novo Layout

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  HEADER CORPORATIVO                                                     │
│  ┌────────────────────────────────┬─────────────────────────────────────┤
│  │ ← Contas a Pagar               │   [Atualizar] [Sync ASAAS] [+ Nova] │
│  │    Gestão de despesas          │                                     │
│  └────────────────────────────────┴─────────────────────────────────────┤
├─────────────────────────────────────────────────────────────────────────┤
│  KPI CARDS (Grid Responsivo 4 colunas → 2 colunas mobile)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Total        │ │ Pago         │ │ Pendente     │ │ Atrasado     │    │
│  │ R$ 45.000    │ │ R$ 28.000    │ │ R$ 12.000    │ │ R$ 5.000     │    │
│  │ ████████████ │ │ ████████     │ │ ██████       │ │ ████         │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
├─────────────────────────────────────────────────────────────────────────┤
│  FILTROS (Card Compacto)                                                │
│  ┌──────────────────────────────────────────────────────────────────────┤
│  │ [🔍 Buscar...          ] [Status ▼] [Tipo ▼]                         │
│  └──────────────────────────────────────────────────────────────────────┤
├─────────────────────────────────────────────────────────────────────────┤
│  LISTA DE CONTAS (Table-like com hover elegante)                        │
│  ┌──────────────────────────────────────────────────────────────────────┤
│  │ ☐ │ ◉ │ Aluguel Sede           │ Fixa │ 10/02 │ R$ 3.500 │ [Pagar] │ │
│  │ ☐ │ ⚠ │ Internet               │ Fixa │ 05/02 │ R$ 189   │ [Pagar] │ │
│  │ ☐ │ ✓ │ Energia Janeiro        │ Var. │ 20/01 │ R$ 450   │  Pago   │ │
│  └──────────────────────────────────────────────────────────────────────┤
└─────────────────────────────────────────────────────────────────────────┘
```

### Paleta de Cores Corporativa

| Elemento | Cor | Uso |
|----------|-----|-----|
| Background | `#F8FAFC` (slate-50) | Fundo da página |
| Cards | `#FFFFFF` | Superfícies principais |
| Borders | `#E2E8F0` (slate-200) | Bordas sutis |
| Primary | `#1E40AF` (blue-800) | Ações principais |
| Success | `#059669` (emerald-600) | Status pago |
| Warning | `#D97706` (amber-600) | Status pendente |
| Danger | `#DC2626` (red-600) | Status atrasado |
| Text Primary | `#0F172A` (slate-900) | Títulos |
| Text Secondary | `#64748B` (slate-500) | Labels e subtítulos |

## Componentes a Redesenhar

### 1. ContasPagarPage.tsx - Layout Principal

**Header Refinado:**
- Título com ícone alinhado à esquerda
- Subtítulo em texto secundário
- Botões agrupados à direita com hierarquia visual

**KPI Cards Aprimorados:**
- Borda colorida à esquerda indicando tipo
- Valor em destaque com tipografia bold
- Label em texto pequeno e leve
- Micro progress bar opcional

**Filtros Compactos:**
- Input de busca com ícone integrado
- Selects com bordas arredondadas
- Espaçamento uniforme (gap-3)

**Lista de Contas:**
- Layout de tabela responsiva
- Hover com sombra sutil e borda azul
- Status com ícones coloridos (não badges pesados)
- Checkbox alinhado à esquerda
- Botão de ação contextual

### 2. PagarContaModal.tsx - Modal de Pagamento

**Estrutura Limpa:**
```text
┌─────────────────────────────────────────────────────────────┐
│  💳 Registrar Pagamento                                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Aluguel Sede                                    Fixa   ││
│  │  ───────────────────────────────────────────────────────││
│  │  R$ 3.500,00                        Vence: 10/02/2026   ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  AÇÃO                                                       │
│  [ ✓ Pagar Agora ] [ 📅 Agendar ]                           │
├─────────────────────────────────────────────────────────────┤
│  MÉTODO                                                     │
│  [ 💵 Pagamento Manual ] [ 🔗 Vincular ASAAS ]              │
├─────────────────────────────────────────────────────────────┤
│  SAÍDAS ASAAS DISPONÍVEIS (11)          [🔄 Atualizar]      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ○ Transferência - R$ 188,00 - 26/01   TRANSFER         ││
│  │ ○ Certificados - R$ 710,00 - 17/01    BILL             ││
│  │ ● Aluguel - R$ 3.500,00 - 10/01       BILL      ✓      ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│                             [Cancelar] [✓ Confirmar]        │
└─────────────────────────────────────────────────────────────┘
```

**Melhorias Específicas:**
- Valor monetário visível em TODAS as saídas ASAAS (já está implementado, mas verificar exibição)
- Contador de saídas disponíveis
- Botão de sync inline no header da lista
- Seleção com visual radio button + checkmark
- Scroll suave na lista

### 3. ContaDetalhesDrawer.tsx - Drawer de Detalhes

**Estrutura Apple-like:**
- Header com valor grande e destaque
- Tabs mais compactas
- Conteúdo com cards internos arredondados
- Footer fixo com ações

### 4. EditarContaModal.tsx - Modal de Edição

**Layout de Formulário:**
- Labels alinhados acima dos inputs
- Grid 2 colunas para campos relacionados
- DatePicker com popover elegante
- Categoria com indentação visual

### 5. BulkActionsBar.tsx - Barra de Ações em Lote

**Refinamentos:**
- Posição sticky no topo
- Fundo com blur (glassmorphism sutil)
- Badge com contador
- Animação de entrada suave

## Arquivos a Modificar

| Arquivo | Escopo da Alteração |
|---------|---------------------|
| `ContasPagarPage.tsx` | Layout completo, header, KPIs, lista |
| `PagarContaModal.tsx` | Estrutura do modal, lista ASAAS |
| `ContaDetalhesDrawer.tsx` | Ajustes visuais no drawer |
| `EditarContaModal.tsx` | Refinamento do formulário |
| `BulkActionsBar.tsx` | Posicionamento e visual |

## Especificações Técnicas

### Responsividade

**Mobile (< 640px):**
- Header empilhado (título em cima, botões embaixo)
- KPIs em grid 2x2
- Lista com layout vertical (card-like)
- Modais fullscreen

**Tablet (640px - 1024px):**
- Header em linha única
- KPIs em grid 4x1
- Lista com layout tabular simplificado

**Desktop (> 1024px):**
- Layout completo com todos os elementos visíveis
- Hover states ativos
- Drawer lateral com largura máxima

### Classes Tailwind Principais

```css
/* Container principal */
.min-h-screen .bg-slate-50 .p-4 .md:p-6 .lg:p-8

/* Cards KPI */
.bg-white .rounded-xl .border .border-slate-200 .shadow-sm
.hover:shadow-md .transition-shadow

/* Lista items */
.bg-white .rounded-lg .border .border-slate-100
.hover:border-blue-200 .hover:shadow-sm .transition-all

/* Status badges */
.text-emerald-600 .bg-emerald-50  /* Pago */
.text-amber-600 .bg-amber-50      /* Pendente */
.text-red-600 .bg-red-50          /* Atrasado */

/* Botões */
.bg-blue-600 .hover:bg-blue-700  /* Primary */
.bg-white .border .hover:bg-slate-50  /* Secondary */
```

## Resultado Esperado

1. **Visual corporativo limpo** - Cores neutras com acentos de cor para status
2. **Hierarquia clara** - Tipografia com pesos distintos
3. **Responsividade perfeita** - Mobile-first com breakpoints consistentes
4. **UX melhorada** - Feedback visual em hover/focus
5. **Consistência** - Design system aplicado em todos os componentes
6. **Performance** - Animações leves e transições suaves

