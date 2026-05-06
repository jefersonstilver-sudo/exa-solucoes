## Selo Airbnb — Execução simples

### Ordem
1. Copiar PNG para `public/selos/airbnb.png`
2. Migração: `ALTER TABLE buildings ADD COLUMN tem_airbnb boolean NOT NULL DEFAULT false;`
3. Adicionar `tem_airbnb: boolean` em `Building` (`src/types/panel.ts`) e nos services/processors que fazem SELECT explícito
4. `BuildingFormDialog3` + `useBuildingFormData`: switch "Tem Airbnb?" salvando o campo
5. `BuildingsManagement3` (listagem admin): badge na linha + ação em massa "Marcar/Desmarcar Airbnb" para itens selecionados
6. Componente `src/components/shared/SeloAirbnb.tsx` — props `size: 'sm'|'md'|'lg'|'xl'`, `<img loading="lazy" alt="Prédio com Airbnb">` com fallback `<span>AIRBNB</span>` (bg #FF5A5F, branco) em `onError`
7. Plugar nos 5 pontos:
   - Loja pública: `BuildingCard.tsx`, `SimpleBuildingGrid.tsx`, `BuildingHoverCard.tsx`
   - Página de detalhes do prédio
   - Proposta comercial (HTML + PDF) — usa import do PNG via Vite para embedar
   - Lista de prédios em pedido (admin/anunciante)
   - Portal do anunciante (`MyVideos.tsx` etc.)
8. Screenshots dos pontos para validação

Sem trigger, sem backfill, sem coluna manual_override, sem FK sindico_id, sem botão de conversão.