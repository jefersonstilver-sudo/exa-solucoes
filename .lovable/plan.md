

# Plano: Modal Minimalista sem Scroll

## Problema Identificado

Na imagem, vemos que o modal atual:
- Tem cards de preview muito grandes (`aspect-square` = 1:1)
- Força scroll na viewport
- Precisa de design mais glass/minimalista

## Alterações Propostas

### 1. Reduzir tamanho dos cards de preview

**De:**
```tsx
aspect-square rounded-xl
```

**Para:**
```tsx
aspect-video rounded-lg h-36
```

Isso reduz a altura de ~300px para ~144px em cada card, eliminando a necessidade de scroll.

### 2. Aplicar efeito glass mais pronunciado no modal

**De:**
```tsx
bg-white/95 backdrop-blur-xl border-slate-200
```

**Para:**
```tsx
bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl
```

### 3. Compactar espaçamentos

| Elemento | Antes | Depois |
|----------|-------|--------|
| `space-y-6` (container principal) | 24px | `space-y-4` (16px) |
| `gap-6` (grid) | 24px | `gap-4` (16px) |
| `space-y-3` (cards) | 12px | `space-y-2` (8px) |
| Padding da área de upload | `p-8` | `p-6` |
| Preview na proposta padding | `p-4 sm:p-6` | `p-3 sm:p-4` |

### 4. Remover `max-h-[90vh] overflow-y-auto`

Como o modal ficará menor, não precisa mais de scroll interno.

### 5. Ocultar seção "Preview na Proposta" inicialmente

Para economizar espaço, só mostrar quando o usuário confirmar a seleção (antes de aplicar).

---

## Estrutura Visual Compactada

```text
┌───────────────────────────────────────────────────────────────┐
│  ✨ Upload de Logo do Cliente                                 │
│  Faça upload da logo...                                       │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐            │
│  │  Original           │  │  ✨ Otimizada (IA)  │            │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  (h-36)   │
│  │  ▓     [LOGO]    ▓  │  │  ▓     [LOGO]    ▓  │            │
│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │            │
│  └─────────────────────┘  └─────────────────────┘            │
│                                                               │
│              ╳ Escolher outra imagem                          │
├───────────────────────────────────────────────────────────────┤
│  [Cancelar]  [✓ Usar Original]  [✨ Otimizar com IA]         │
└───────────────────────────────────────────────────────────────┘
```

---

## Mudanças no Código

### Arquivo: `src/components/admin/proposals/ClientLogoUploadModal.tsx`

#### Linha 286 (DialogContent)
```tsx
// De:
className="sm:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-slate-200"

// Para:
className="sm:max-w-3xl bg-white/80 backdrop-blur-2xl border-white/40 shadow-2xl"
```

#### Linha 297 (container principal)
```tsx
// De:
className="space-y-6"

// Para:
className="space-y-4"
```

#### Linha 304-309 (área de upload)
Reduzir padding de `p-8` para `p-6`

#### Linha 333 (grid)
```tsx
// De:
className="grid grid-cols-1 md:grid-cols-2 gap-6"

// Para:
className="grid grid-cols-1 md:grid-cols-2 gap-4"
```

#### Linhas 335, 379 (cards)
```tsx
// De:
className="space-y-3"

// Para:
className="space-y-2"
```

#### Linhas 347-353, 394-400 (preview containers)
```tsx
// De:
aspect-square rounded-xl

// Para:
h-36 rounded-lg
```

#### Linhas 450-491 (Preview na Proposta)
Ocultar esta seção para economizar espaço vertical. O preview já está visível nos cards acima.

#### Linha 456 (Preview na Proposta - se mantiver)
Reduzir padding de `p-4 sm:p-6` para `p-3`

---

## Resultado Esperado

- Modal sem scroll (cabe na tela sem ultrapassar)
- Visual glass mais pronunciado
- Cards de logo menores mas ainda visíveis
- Espaçamentos mais compactos
- Aparência premium/minimalista

