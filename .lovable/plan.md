## 🔍 Auditoria — Status "Em Instalação" na Loja Pública

### Resultado da auditoria (banco de dados)
Existem **8 prédios** com status `instalacao` (sem cedilha) no banco que estão visíveis na loja pública:
- Bella Vita, Condomínio Cheverny, Edifício Barcelona, Renoir, Residencial Miró, Riverside, Toscana, e o Cheverny.

A RPC `get_buildings_for_public_store` retorna corretamente o status `instalacao` para todos eles. O componente `BuildingCardImage.tsx` (desktop) e `MobileBuildingInfoCard.tsx` (mobile) **já normalizam acentos** e exibem a tarja "EM INSTALAÇÃO" + ações desabilitadas.

### Causa-raiz identificada
O componente `BuildingStoreCard.tsx` possui **3 layouts** (Desktop compacto, Mobile, Desktop default — linhas 21-116). Todos chamam `BuildingCardImage` que tem a tarja, **MAS** a checagem de "em instalação" para desabilitar o clique no card e o botão "Adicionar" está apenas em `BuildingCardActions`. Resultado: o card inteiro continua **clicável** abrindo o detalhe normal, e em alguns layouts o estado visual não é homogêneo. Isso faz o usuário "ver" como se fosse ativo.

Adicionalmente, **NÃO há nenhuma proteção de servidor**: a RPC pública lista esses prédios igual aos ativos, sem nenhuma flag de "showcase only". O frontend é a única defesa.

---

## 🎯 Plano de Correção

### 1. Reforço Anti-Falha — Status "Em Instalação" (prioridade ALTA)

**`src/components/building-store/BuildingStoreCard.tsx`**
- Criar helper local `isEmInstalacao(status)` (mesma normalização NFD).
- Quando true, em **todos os 3 layouts**:
  - Bloquear `onClick` do card (não abrir detalhe / não adicionar carrinho).
  - Aplicar classe `cursor-default` + remover hover de "scale".
  - Adicionar borda âmbar sutil (`ring-1 ring-amber-300/40`) para diferenciação visual instantânea.

**`src/components/building-store/MobileBuildingSheet.tsx`** e **`MobileBuildingInfoCard.tsx`**
- Reforçar o botão "Adicionar ao carrinho" para usar a mesma normalização (já existe parcialmente).
- Esconder preço e mostrar selo "Em breve disponível" alinhado ao desktop.

**`src/services/simpleBuildingService.ts`**
- Adicionar log de auditoria ao detectar prédio em instalação no payload público (apenas console, para rastreio).

### 2. Editor de Posicionamento de Fotos (Reframe Manual)

#### 2.1 Migration de banco (schema)
Adicionar 2 colunas em `buildings` para guardar a posição focal de cada slot de imagem:
```sql
ALTER TABLE buildings ADD COLUMN imagem_principal_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb;
ALTER TABLE buildings ADD COLUMN imagem_2_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb;
ALTER TABLE buildings ADD COLUMN imagem_3_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb;
ALTER TABLE buildings ADD COLUMN imagem_4_focus jsonb DEFAULT '{"x":50,"y":50}'::jsonb;
```
Os valores são percentuais (0-100) usados em CSS `object-position: X% Y%`.

> Atualizar a RPC `get_buildings_for_public_store` para retornar `imagem_principal_focus` (apenas o focus da imagem principal, que é o que aparece na loja).

#### 2.2 Novo componente — `ImageFocusEditor.tsx`
Editor fluido inline (dentro do `BuildingImageManager`) com:
- **Preview ao vivo** mostrando como a imagem aparecerá no card da loja (proporção 16:10).
- **Crosshair arrastável** (mouse + touch) sobre a imagem original — define o ponto de foco da fachada.
- **Mini-thumbnails** com presets rápidos (Centro, Topo, Inferior, Esquerda, Direita).
- Botão **"Ver como aparece na loja"** abrindo modal com o card final renderizado.
- Salvar via `update` na coluna `imagem_X_focus` correspondente.
- Animação `framer-motion` suave; design Apple-like glassmorphism (paleta EXA).

#### 2.3 Integração no `BuildingImageManager.tsx`
- Sob cada slot de imagem com foto enviada, adicionar botão **"Ajustar enquadramento"** (ícone `Move` ou `Crop`).
- Abre o `ImageFocusEditor` em painel lateral fluido (não substitui a galeria).
- Botão "Remover" continua intacto (já existe).

#### 2.4 Aplicar o focus na loja pública
- `src/services/simpleBuildingService.ts`: passar `imagem_principal_focus` no payload.
- `src/services/buildingStoreService.ts`: incluir o campo no tipo `BuildingStore`.
- `src/components/building-store/card/BuildingCardImage.tsx`: aplicar `style={{ objectPosition: \`${focus.x}% ${focus.y}%\` }}` no `<img>`.

### 3. Ferramenta de Auditoria (admin)
Adicionar pequeno alerta no topo de `AdminBuildingsPageContent.tsx` quando houver prédios em instalação visíveis na loja pública, com link "Ver lista" — para o admin saber rapidamente o que está em vitrine.

---

## 📁 Arquivos a editar/criar

**Editar:**
- `src/components/building-store/BuildingStoreCard.tsx` — bloqueio de clique nos 3 layouts
- `src/components/building-store/MobileBuildingSheet.tsx` — reforço do bloqueio
- `src/components/building-store/MobileBuildingInfoCard.tsx` — reforço do bloqueio
- `src/components/building-store/card/BuildingCardImage.tsx` — aplicar `object-position`
- `src/services/simpleBuildingService.ts` — passar focus + log de auditoria
- `src/services/buildingStoreService.ts` — tipo
- `src/components/admin/buildings/BuildingImageManager.tsx` — botão "Ajustar enquadramento" por slot
- `src/components/admin/buildings/AdminBuildingsPageContent.tsx` — alerta de auditoria

**Criar:**
- `src/components/admin/buildings/ImageFocusEditor.tsx` — editor fluido drag-and-drop
- `supabase/migrations/[timestamp]_add_image_focus_columns.sql` — colunas focus
- Atualizar RPC `get_buildings_for_public_store` para retornar `imagem_principal_focus`

## ✅ Garantias
- **Nenhuma alteração** em fluxos que não estejam relacionados ao status "instalação" ou ao gerenciamento de imagens.
- **Backward-compatible**: prédios sem `focus` definido usam centro (50/50) como hoje.
- **Sem mudanças** no fluxo de cobrança, pedidos, agenda, painéis ou monitoramento.