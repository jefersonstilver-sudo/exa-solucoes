

# Adicionar badge de tipo de produto (Vertical/Horizontal) no AdvertiserOrderCard

## O que fazer

No card do anunciante (`AdvertiserOrderCard.tsx`), adicionar um badge ao lado do badge de status e fidelidade indicando se o pedido é **Vertical** ou **Horizontal**, usando o campo `tipo_produto` do item.

## Mudança

**`src/components/advertiser/orders/AdvertiserOrderCard.tsx`**

Na seção de badges (linhas 141-151), adicionar um badge condicional antes do badge de fidelidade:

```tsx
import { Monitor, Smartphone } from 'lucide-react';

// Dentro do flex de badges (linha 141):
{item.type === 'order' && (
  item.tipo_produto === 'vertical_premium' ? (
    <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-700 bg-purple-50 px-1.5 py-0">
      <Smartphone className="h-2.5 w-2.5 mr-0.5" />
      Vertical
    </Badge>
  ) : (
    <Badge variant="outline" className="text-[10px] border-blue-400 text-blue-700 bg-blue-50 px-1.5 py-0">
      <Monitor className="h-2.5 w-2.5 mr-0.5" />
      Horizontal
    </Badge>
  )
)}
```

Mesmo padrão visual já usado no `MinimalOrderCard.tsx`.

| Arquivo | Mudança |
|---------|---------|
| `src/components/advertiser/orders/AdvertiserOrderCard.tsx` | Adicionar badge Vertical/Horizontal na área de badges |

