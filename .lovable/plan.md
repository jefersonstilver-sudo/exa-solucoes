## Plano aprovado com ressalva — 2 frentes

### 1. Prédios "Em Instalação" — apenas vitrine (sem carrinho)

**`src/components/building-store/card/BuildingCardActions.tsx`**
- Adicionar detecção robusta: `const isEmInstalacao = String(building.status || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('instala');` (pega tanto `instalação` quanto `instalacao`).
- Se `isEmInstalacao`:
  - Bloquear `handleAddToCart` (early return).
  - Substituir o botão "Continuar/Adicionar" por um botão **desabilitado** estilo âmbar com ícone `Construction` (lucide) e label **"Em Instalação"**.
  - Esconder/substituir o preço por **"Em breve"** em tom muted.

**`src/components/building-store/BuildingStoreCard.tsx`**
- Adicionar uma **tarja glass elegante** sobre a imagem (canto superior, full-width discreta) com texto **"EM INSTALAÇÃO"**:
  - `backdrop-blur-md bg-amber-500/20 border border-amber-300/40 text-amber-50`, ícone `Construction`, animação suave de entrada.
- Aplicar `opacity-90` na imagem e leve `grayscale-[20%]` para reforçar o estado "preview".
- Não alterar nada em prédios `ativo` — comportamento idêntico ao atual.

### 2. Correção do mapa abrindo no oceano (Howland Island)

**Causa identificada (`src/components/building-store/BuildingMap.tsx`):**
- Quando `mapBuildings` chega vazio na primeira renderização (antes do fetch), `bounds` fica vazio e o `fitBounds(bounds, 40)` em linha ~480 não tem efeito útil. Pior: como `selectedLocation` é null e `hasAny` é false, o fluxo cai no else final — mas o `bounds` vazio do `MarkerClusterer` ou re-render pode reposicionar o mapa para (0,0).
- Além disso, quando markers existem mas são `OverlayView` (sem `getPosition`), `bounds.extend(position)` está correto, mas se `buildings` mudar e nenhum tiver coords válidas, o reset ainda é falho.

**Correções:**
- **Centro inicial sempre Foz** quando não há `selectedLocation` nem coords válidas: garantir que `defaultCenter = FOZ_DO_IGUACU_CENTER` (importar de `@/utils/mapConstants` em vez de hardcoded), e usar `zoom: 13` como fallback consistente.
- **Proteger `fitBounds`**: só chamar quando `!bounds.isEmpty()`. Se `bounds.isEmpty()` → `setCenter(FOZ_DO_IGUACU_CENTER)` + `setZoom(13)`.
- **Auto-fit em todos os prédios da loja**: passar `autoFitAllBuildings={true}` nos dois usos de `BuildingMap` em `BuildingFilterSidebar.tsx` (mini-mapa lateral e dialog expandido), para que ao abrir o mapa todos os painéis EXA de Foz fiquem visíveis no enquadramento inicial — exatamente o pedido do usuário ("ver todos os painéis da exa em foz").
- **Re-init guard**: o `useEffect` de init depende de `[buildings, selectedLocation]` — isso recria o mapa toda vez que `buildings` muda. Vou ajustar para só recriar quando `selectedLocation` mudar; mudanças em `buildings` apenas atualizam markers (já tratado no segundo `useEffect`). Isso evita o "flash" para o oceano durante re-renders.

**Arquivos a editar:**
1. `src/components/building-store/card/BuildingCardActions.tsx`
2. `src/components/building-store/BuildingStoreCard.tsx`
3. `src/components/building-store/BuildingMap.tsx`
4. `src/components/building-store/BuildingFilterSidebar.tsx`

### Garantias
- Nenhuma alteração em fluxo de carrinho, filtros, busca ou prédios `ativo`.
- Comportamento mobile preservado (`MobileFullscreenMap` continua usando `BuildingMap` com seus props atuais).
- Sem mudanças em backend/RLS/edge functions.