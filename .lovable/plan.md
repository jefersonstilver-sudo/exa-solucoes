

# Plano: Corrigir Fluxo de Permuta - Manter Período e Prédios, Esconder Apenas Valores Monetários

## O Problema Identificado

A implementação atual está **correta em parte**, mas tem inconsistências:

### Na Interface Admin (NovaPropostaPage.tsx)

Os seguintes campos **monetários** aparecem mesmo quando `modalidadeProposta === 'permuta'`:

1. **Valor Mensal (Fidelidade)** - linha 2069-2084
2. **Desconto PIX à Vista** - linha 2086-2097
3. **Sobrescrever valor à vista** - linha 2099-2113
4. **Resumo de Valores** - linha 2115-2140
5. **Detalhamento de Preços Corporativo** (grid de valores por local) - linha 2163-2259

### Na Proposta Pública (PropostaPublicaPage.tsx)

1. **Seção "Locais Contratados"** (linha 2335-2412) mostra valores monetários (Fidelidade/PIX) mesmo para permuta
2. A seção de planos já está corretamente escondida para permuta

---

## Solução

### Lógica Correta

```
PROPOSTA DE PERMUTA = (prédios selecionados) + (período do contrato) + (lista de equipamentos em troca)
                       ✅ MOSTRA                ✅ MOSTRA              ✅ MOSTRA (substitui valores R$)
```

### Parte 1: NovaPropostaPage.tsx - Esconder Campos Monetários para Permuta

Adicionar condição `&& modalidadeProposta !== 'permuta'` nas seguintes seções:

| Linha | Seção | Condição Atual | Nova Condição |
|-------|-------|----------------|---------------|
| 2069 | Valor Mensal (Fidelidade) | `!isCustomPayment` | `!isCustomPayment && modalidadeProposta !== 'permuta'` |
| 2086 | Desconto PIX à Vista | `!isCustomPayment` | `!isCustomPayment && modalidadeProposta !== 'permuta'` |
| 2100 | Sobrescrever valor à vista | `!isCustomPayment` | `!isCustomPayment && modalidadeProposta !== 'permuta'` |
| 2116 | Resumo de Valores Padrão | `!isCustomPayment && fidelMonthly > 0` | `!isCustomPayment && fidelMonthly > 0 && modalidadeProposta !== 'permuta'` |
| 2164 | Detalhamento Corporativo | `selectedBuildings.length > 0 && !isCustomPayment && !isCustomDays` | Adicionar `&& modalidadeProposta !== 'permuta'` |

### Parte 2: PropostaPublicaPage.tsx - Ajustar Seção de Locais Contratados

A seção "Locais Contratados" (linha 2335) deve:

1. **Continuar aparecendo** para permuta (mostra os prédios)
2. **Esconder o grid de valores monetários** (Fidelidade/PIX À Vista) quando for permuta

**Mudança na linha 2359-2399** (grid de resumo por modalidade):

Adicionar condição para esconder quando permuta:

```tsx
{/* Resumo por modalidade - ESCONDER para permuta */}
{proposal.modalidade_proposta !== 'permuta' && (
  <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3">
    {/* Fidelidade */}
    ...
    {/* À Vista */}
    ...
  </div>
)}
```

### Parte 3: Adicionar Período na Seção de Permuta (Proposta Pública)

Na seção de permuta (linha 2114-2192), adicionar informação do período do contrato:

```tsx
{/* Período do Contrato */}
<div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
  <div className="flex items-center gap-2">
    <Calendar className="h-4 w-4 text-amber-600" />
    <span className="text-sm font-medium text-amber-800">Período do Contrato</span>
  </div>
  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
    {proposal.is_custom_days 
      ? `${proposal.custom_days} ${proposal.custom_days === 1 ? 'dia' : 'dias'}`
      : `${proposal.duration_months} ${proposal.duration_months === 1 ? 'mês' : 'meses'}`
    }
  </Badge>
</div>
```

---

## Resultado Visual Esperado

### Admin: Proposta de Permuta

```
┌─────────────────────────────────────────────────────────────┐
│  💰 Tipo de Proposta                                        │
│   [ Monetária ]  [✓ 🔄 Permuta/Equipamentos ]              │
├─────────────────────────────────────────────────────────────┤
│  📦 Equipamentos Ofertados                                  │
│  • Tablet Samsung Galaxy Tab A8 (50 un.) R$ 44.950,00      │
│  • Suporte de Parede (50 un.) R$ 6.000,00                  │
│  TOTAL ESTIMADO: R$ 50.950,00                              │
│  [x] Ocultar valores na proposta pública                   │
├─────────────────────────────────────────────────────────────┤
│  📅 Período do Contrato                                     │
│  [1M] [3M] [6M] [✓12M] [18M] [24M]                        │
├─────────────────────────────────────────────────────────────┤
│  🏢 Prédios Selecionados (12 prédios, 17 telas)            │
│  ✓ Torre Azul    ✓ Edifício Central   ✓ ...               │
└─────────────────────────────────────────────────────────────┘

  ❌ NÃO APARECE: Valor Mensal, Desconto PIX, Resumo de Valores
```

### Pública: Proposta de Permuta

```
┌─────────────────────────────────────────────────────────────┐
│                  🤝 PROPOSTA DE PARCERIA                    │
│              17 telas em 12 prédios • 12 meses              │
├─────────────────────────────────────────────────────────────┤
│  📅 Período: 12 meses                                       │
├─────────────────────────────────────────────────────────────┤
│  📦 CONTRAPARTIDA ACORDADA                                  │
│  • Tablet Samsung Galaxy Tab A8 (50 unidades)              │
│  • Suporte de Parede Articulado (50 unidades)              │
├─────────────────────────────────────────────────────────────┤
│  🏢 Locais Contratados (12 locais)                          │
│  [Torre Azul] [Edifício Central] [...]                      │
│                                                             │
│  ❌ NÃO APARECE: Grid Fidelidade/PIX À Vista               │
├─────────────────────────────────────────────────────────────┤
│         [ ✅ Aceitar Parceria ]  [ ❌ Recusar ]             │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Mudanças |
|---------|----------|
| `src/pages/admin/proposals/NovaPropostaPage.tsx` | Adicionar condição `modalidadeProposta !== 'permuta'` em 5 seções de valores monetários |
| `src/pages/public/PropostaPublicaPage.tsx` | 1) Esconder grid de valores na seção "Locais Contratados" para permuta 2) Adicionar período na seção de permuta |

---

## Resumo

A proposta de permuta deve funcionar assim:

- **Período**: O cliente recebe X equipamentos **por Y meses** de veiculação
- **Prédios**: Os equipamentos são em troca de exibição em **Z prédios específicos**
- **Valores internos**: Admin vê custo estimado dos equipamentos (para referência)
- **Valores públicos**: Cliente não vê R$, apenas a lista de itens que precisa fornecer

O erro original foi condicionar seções inteiras demais. A correção é cirúrgica: apenas os campos de valor em R$ devem ser escondidos.

