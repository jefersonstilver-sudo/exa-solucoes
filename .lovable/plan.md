
# Plano: Reconstruir Modal para Layout Vertical em Tela Cheia

## Problema Identificado

O modal atual usa `grid-cols-2` (duas colunas lado a lado), fazendo com que:
1. A lista de saídas ASAAS fique espremida na coluna direita
2. Os valores (R$) e descrições sejam cortados
3. O scroll interno não consiga mostrar todo o conteúdo

## Solução: Layout Vertical Full-Screen

Mudar para layout empilhado onde a lista ASAAS aparece abaixo, com largura total.

### Nova Estrutura Visual

```text
┌──────────────────────────────────────────────────────────────────────────────────┐
│  💳 Registrar Pagamento                                                    [X]   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ CONTA                                              [Fixa]                   │ │
│  │ Salário João                                                                │ │
│  │ ──────────────────────────────────────────────────────────────────────────  │ │
│  │ R$ 3.200,00                                      Vencimento: 14/01/2026     │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  AÇÃO   [ ✓ Pagar Agora ]  [ 📅 Agendar ]                                        │
│                                                                                  │
│  MÉTODO [ 💵 Manual ]  [ 🔗 ASAAS ]                                              │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  SAÍDAS ASAAS DISPONÍVEIS (9)                          [🔄 Sincronizar]          │
│  Selecione uma saída para vincular                                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────────┐ │
│ │ ○ │ Transferência ASAAS                     │ 25/01/2026 │ Transfer │ R$ 188 │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ │ Transferência ASAAS                     │ 24/01/2026 │ Transfer │ R$ 120 │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ │ Dois certificados pessoa física R$120   │ 16/01/2026 │ Transfer │ R$ 710 │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ ● │ Serviços programação João Tumiski       │ 15/01/2026 │ Transfer │ R$3200 │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ │ Compra mercado limpeza cafe             │ 15/01/2026 │ Transfer │ R$ 196 │ │
│ ├──────────────────────────────────────────────────────────────────────────────┤ │
│ │ ○ │ Despesa fixa semanal combustivel        │ 10/01/2026 │ Transfer │ R$ 120 │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                 [Cancelar]   [✓ Confirmar]       │
└──────────────────────────────────────────────────────────────────────────────────┘
```

## Alteracoes Tecnicas

### 1. DialogContent - Tela Cheia Real
```typescript
// Antes
className="w-[95vw] max-w-[1200px] h-[90vh] max-h-[850px]"

// Depois - Ocupar tela toda
className="w-[98vw] max-w-[1400px] h-[95vh] max-h-[95vh]"
```

### 2. Layout Principal - Vertical
```typescript
// Antes
<div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">

// Depois - Sempre vertical com flex
<div className="h-full flex flex-col overflow-hidden">
  {/* Seção Superior - Resumo e Opções (altura fixa) */}
  <div className="shrink-0 p-6 border-b">...</div>
  
  {/* Seção Inferior - Lista ASAAS (flex-1 para ocupar resto) */}
  <div className="flex-1 overflow-hidden flex flex-col p-6">...</div>
</div>
```

### 3. Seção Superior Compacta
Reorganizar horizontalmente em uma linha:
- Resumo da conta a esquerda
- Opcoes de Acao e Metodo a direita

```typescript
<div className="flex flex-col lg:flex-row gap-6">
  {/* Card Resumo */}
  <div className="lg:w-1/3">...</div>
  
  {/* Opcoes lado a lado */}
  <div className="lg:w-2/3 flex flex-col gap-4">
    <div className="flex gap-4">
      {/* Acao */}
      {/* Metodo */}
    </div>
  </div>
</div>
```

### 4. Lista ASAAS - Layout de Tabela
Cada item como linha de tabela com colunas fixas:

```typescript
<div className="grid grid-cols-[40px_1fr_100px_80px_100px] items-center gap-3 p-3 border-b">
  {/* Radio */}
  <div>○</div>
  
  {/* Descricao - ocupa espaco flexivel */}
  <div className="truncate font-medium">{descricao}</div>
  
  {/* Data - largura fixa */}
  <div className="text-sm text-muted">25/01/2026</div>
  
  {/* Tipo Badge */}
  <Badge>Transfer</Badge>
  
  {/* Valor - alinhado a direita */}
  <div className="text-right font-bold text-blue-600">R$ 188,00</div>
</div>
```

### 5. ScrollArea para Lista
A lista fica dentro de um ScrollArea que ocupa todo espaco disponivel:

```typescript
<ScrollArea className="flex-1 border rounded-xl bg-white">
  <div className="divide-y">
    {saidasAsaas.map((saida) => (
      <ListItem key={saida.id} saida={saida} />
    ))}
  </div>
</ScrollArea>
```

## Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `PagarContaModal.tsx` | Reconstrucao completa do layout de duas colunas para vertical |

## Comportamento Mobile

No mobile, o layout ja sera naturalmente vertical. A diferenca e que:
- Resumo da conta empilha verticalmente
- Lista ocupa largura total
- Items da lista adaptam para mostrar valor em destaque

## Resultado Esperado

1. Lista de saidas ASAAS visivel por completo
2. Valores monetarios claramente visiveis em cada linha
3. Descricoes completas ou com truncate elegante
4. Modal ocupa quase toda a tela
5. Scroll suave na lista de saidas
6. Layout responsivo para mobile
