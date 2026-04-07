

# Correção: Cards com tamanho uniforme no mobile (imagens cortadas)

## Problema
No mobile, cards com fotos verticais ficam com tamanhos diferentes dos cards com fotos horizontais. A imagem deveria ser cortada (`object-cover`) para manter proporção uniforme, mas o container interno com `h-full` não herda corretamente a altura do `aspect-ratio` do pai em alguns navegadores (especialmente Safari/iPhone).

## Solução

**Arquivo**: `src/components/building-store/card/BuildingCardImage.tsx`

1. Quando `mode="fill"`, forçar o container interno a também usar `aspect-[16/10]` com `overflow-hidden`, em vez de depender de `h-full` que falha no Safari
2. Adicionar `object-center` na `<img>` para centralizar o corte em fotos verticais

**Arquivo**: `src/components/building-store/BuildingStoreCard.tsx`

1. No layout mobile, garantir que o container da imagem use altura fixa (`h-48`) em vez de apenas `aspect-[16/10]`, que é mais confiável cross-browser no iPhone
2. Adicionar `overflow-hidden` explícito no container da imagem

### Mudanças específicas

**BuildingCardImage.tsx** (linha 24):
- Trocar `"relative w-full h-full"` por `"relative w-full h-full overflow-hidden"`
- Na `<img>`, adicionar `object-center` para corte centralizado

**BuildingStoreCard.tsx** (linha 68, bloco mobile):
- Trocar `aspect-[16/10]` por `h-44` (altura fixa ~176px) + `overflow-hidden` no container da imagem, garantindo uniformidade absoluta independente da proporção da foto original

Nenhuma outra funcionalidade ou UI é alterada.

