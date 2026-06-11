# Ajustes finais do mapa da proposta (paridade total com a loja)

## Problemas atuais
1. **Card hover sem fotos e com 0/0/0** — ProposalMapDialog na página pública recebe só `{id, nome, endereco, bairro, lat, lng}`. Faltam `imagem_principal`, `publico_estimado`, `visualizacoes_mes`, `numero_elevadores`/`quantidade_telas`, `preco_base`.
2. **Botão "Adicionar" vermelho** — `BuildingHoverCard` lê do carrinho (`useCartOptional`/`__simpleCart`). Como a proposta não tem carrinho, todo prédio aparece como "Adicionar". Deveria mostrar estado fechado/selecionado (verde como na loja quando está no carrinho) porque o prédio já faz parte da proposta.
3. **Scroll do mouse não dá zoom** — `ProposalMapDialog` não passa `scrollwheel`, então usa default `false`. Apesar de `gestureHandling="greedy"`, o `scrollwheel:false` desabilita o zoom por roda no `BuildingMap` (linha 97).

## Mudanças

### 1. `src/components/maps/BuildingHoverCard.tsx`
- Nova prop opcional `mode?: 'store' | 'proposal'` (default `'store'`).
- Quando `mode === 'proposal'`:
  - **Ignora** `useCartOptional`/`__simpleCart`/`cart:updated` (sem assinatura, sem listener).
  - Botão sempre renderiza estado "incluído" desabilitado, **verde** igual à loja quando já está no carrinho (`bg-green-500 hover:bg-green-500 text-white cursor-default`), com label **"✓ Incluído na Proposta"** + `Check` icon.
  - `handleAddToCart` vira no-op.
  - Footer pode esconder o bloco de preço "A partir de" se quiser, mas mantemos por paridade visual com a loja (mesmas métricas, mesma foto, mesmas amenities).
- Mantém comportamento atual quando `mode === 'store'` (zero regressão).

### 2. `src/components/building-store/BuildingMap.tsx`
- Nova prop opcional `hoverCardMode?: 'store' | 'proposal'` (default `'store'`).
- Repassa para `<BuildingHoverCard mode={hoverCardMode} ... />` em todos os pontos onde é renderizado (renderização do pin React via `createRoot`).
- Nenhuma outra mudança comportamental.

### 3. `src/components/admin/proposals/ProposalMapDialog.tsx`
- Adiciona `scrollwheel` ao `<BuildingMap>` (zoom com roda do mouse igual loja).
- Passa `hoverCardMode="proposal"`.
- Mantém `gestureHandling="greedy"`, `autoFitAllBuildings`, `enableClustering`, `requirePreciseGeocode={false}`.
- Tipa prop `buildings` aceitando o shape enriquecido (Partial<BuildingStore>) — sem mudança de assinatura externa.

### 4. `src/pages/public/PropostaPublicaPage.tsx`
- No bloco que renderiza `<ProposalMapDialog ... buildings={...}>`, **passar o array enriquecido completo** (o mesmo `buildings` já hidratado em `enriched` no fetch — contém `imagem_principal`, `publico_estimado`, `visualizacoes_mes`, `quantidade_telas`, `preco_base`, `bairro`, `endereco`, `nome`).
- Normalizar para o shape esperado pelo `BuildingMap` + `BuildingHoverCard`:
  ```ts
  buildings={buildings.map((b: any) => ({
    id: b.building_id || b.id,
    nome: b.nome,
    endereco: b.endereco || '',
    bairro: b.bairro || '',
    latitude: b.latitude,
    longitude: b.longitude,
    manual_latitude: b.manual_latitude,
    manual_longitude: b.manual_longitude,
    imagem_principal: b.imagem_principal,
    publico_estimado: b.publico_estimado || 0,
    visualizacoes_mes: b.visualizacoes_mes || 0,
    quantidade_telas: b.quantidade_telas || 0,
    numero_elevadores: b.quantidade_telas || b.numero_elevadores || 0, // hover card lê esse
    preco_base: b.preco_base || 0,
    status: 'ativo',
  }))}
  ```
- Garante "apenas prédios da proposta" — o array já é exclusivo da proposta.

### 5. `src/pages/admin/proposals/NovaPropostaPage.tsx`
- `selectedBuildingsData` já contém os campos certos (vem do select de `buildings` com `quantidade_telas, visualizacoes_mes, preco_base, imagem_principal`). Adicionar somente alias `numero_elevadores` no map passado para o dialog:
  ```ts
  buildings={selectedBuildingsData.map((b: any) => ({
    ...b,
    numero_elevadores: b.quantidade_telas || b.numero_elevadores || 0,
  })) as any}
  ```

## Resultado esperado
- Hover card idêntico à loja: foto do prédio, público, exibições, telas, preço base, amenities/características.
- Botão **verde "✓ Incluído na Proposta"** (estilo idêntico ao "No Carrinho" da loja), desabilitado, sem ação.
- **Scroll-zoom** funcionando com a roda do mouse.
- **Pinch-zoom** no mobile (já funciona via greedy gestureHandling).
- Apenas os prédios da proposta atual no mapa.
- Nenhuma regressão na loja (BuildingMap default permanece `mode='store'`).

## Arquivos editados
- `src/components/maps/BuildingHoverCard.tsx`
- `src/components/building-store/BuildingMap.tsx`
- `src/components/admin/proposals/ProposalMapDialog.tsx`
- `src/pages/public/PropostaPublicaPage.tsx`
- `src/pages/admin/proposals/NovaPropostaPage.tsx`
