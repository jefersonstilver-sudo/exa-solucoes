
# Plano: alinhar "Ativo" com Online no admin e garantir exibição na loja pública

## Auditoria profunda: causa real encontrada

Há **dois problemas separados** hoje:

### 1) Loja pública ainda bloqueia prédio ativo sem foto
O banco já retorna corretamente os prédios `ativo` pela RPC `get_buildings_for_public_store`, inclusive o **COMERCIAL TABLET**.

Confirmei isso no banco:
- `COMERCIAL TABLET` está em `get_buildings_for_public_store()`
- Portanto o backend **não** é o bloqueio principal nesse caso

Mas no frontend da loja existe um filtro extra indevido:
- `src/hooks/building-store/buildingStoreActions.ts`
- `src/hooks/building-store/buildingStoreFilters.ts`

Hoje eles exigem:
- status ativo/instalação **e**
- `imagem_principal` preenchida

Isso contradiz sua regra. Resultado:
- prédio `ativo` sem foto fica fora da loja pública
- por isso o COMERCIAL TABLET não entra visualmente

### 2) "Não conectado" aparece porque o card usa vínculo real com `devices`
Hoje o admin calcula o badge assim:
- busca devices com `building_id = prédio.id`
- se não houver device ativo vinculado, mostra `not_connected`
- isso vira badge **"Não conectado"**

Arquivos centrais:
- `src/services/buildingsAdminService.ts`
- `src/hooks/useBuildingDeviceStatus.ts`
- `src/components/admin/buildings/BuildingPanelStatusBadge.tsx`

Na auditoria do banco:
- existem **16 prédios ativos**
- **7 prédios ativos não têm device vinculado**
- exemplos: `COMERCIAL TABLET`, `Condomínio Cheverny`, `Edificio Barcelona`, `Bella Vita`, `Residencial Miró`, `Viena`, `Vila Appia`

Então o sistema atual está coerente com a modelagem antiga, mas **não coerente com a regra de negócio que você definiu agora**:
- se está `ativo`, no admin precisa parecer **Online**
- e se está `ativo`, precisa estar na loja pública **independente do preenchimento**

## O que precisa mudar

### C-01: Loja pública deve usar somente status, sem exigir foto
**Arquivos**
- `src/hooks/building-store/buildingStoreActions.ts`
- `src/hooks/building-store/buildingStoreFilters.ts`

**Mudança**
Remover a exigência de `imagem_principal` dos filtros da loja.

**Nova regra**
Entram na loja pública todos os prédios com status:
- `ativo`
- `instalação`
- `instalacao`

Sem depender de:
- foto
- preço
- quantidade_telas
- público estimado

Isso atende exatamente sua regra:
> tudo que tiver ATIVO precisa estar na loja pública independente do que está preenchido ou não

### C-02: Separar "status operacional" da "vinculação física"
Hoje o badge mistura duas coisas:
- disponibilidade comercial do prédio
- existência de device vinculado

Pela sua regra, prédio `ativo` deve aparecer como **Online** no card admin, mesmo sem device vinculado.

**Arquivos**
- `src/services/buildingsAdminService.ts`
- `src/components/admin/buildings/AdminBuildingCard.tsx`
- `src/components/admin/buildings/v3/BuildingCard3.tsx`
- `src/components/admin/buildings/BuildingPanelStatusBadge.tsx`

**Mudança**
Criar distinção entre:
- **status comercial do prédio**: deriva de `building.status`
- **status técnico do device**: deriva de `devices`

**Comportamento novo proposto**
- `building.status === 'ativo'` → badge verde **Online**
- `building.status === 'interno'` → badge próprio interno
- quando houver device real vinculado, o detalhe técnico pode continuar existindo em tooltip/popover/histórico
- quando não houver device, não mostrar "Não conectado" como status principal do prédio ativo

### C-03: Preservar o histórico técnico sem quebrar sua regra visual
Hoje `BuildingPanelStatusBadge` abre histórico de quedas via `deviceId`.

Problema:
- se forçar tudo para `online` sem `deviceId`, o popover técnico deixa de fazer sentido

**Ajuste**
- usar o badge principal para a regra de negócio
- e mover o estado técnico real para texto secundário, tooltip ou indicador auxiliar, por exemplo:
  - "Sem device vinculado"
  - "Device offline"
  - "Última conexão ..."
  
Assim:
- o card obedece sua regra visual e operacional
- a equipe técnica não perde rastreabilidade

### C-04: Garantir consistência total na loja pública
Além da store principal, revisar pontos que ainda possam filtrar por foto ou campos obrigatórios para exibição pública.

Arquivos já identificados como prioritários:
- `src/hooks/building-store/buildingStoreActions.ts`
- `src/hooks/building-store/buildingStoreFilters.ts`

Também vou revisar os componentes que renderizam card/lista para garantir que ausência de foto:
- não remova o item
- apenas use placeholder visual

### C-05: Ajustar fallbacks visuais para prédios ativos incompletos
Como agora todo ativo deve aparecer mesmo incompleto, a UI precisa suportar:
- sem foto
- sem preço
- sem público estimado
- sem telas

**Ajustes esperados**
- imagem placeholder quando `imagem_principal` estiver vazia
- preço como `—` ou `Sob consulta`
- telas com fallback coerente
- público com fallback neutro

Isso evita novo "sumiço visual" mesmo quando o item está na lista.

## Resultado esperado após implementação

### Admin
- todo prédio com status `ativo` aparece como **Online** no card
- não aparece mais "Não conectado" como status principal de prédio ativo
- ainda será possível identificar tecnicamente se existe ou não device vinculado

### Loja pública
- todo prédio `ativo` aparece, mesmo sem:
  - foto
  - preço
  - telas
  - público estimado

### COMERCIAL TABLET
- aparecerá na loja pública se estiver `ativo`
- aparecerá apenas no admin se estiver `interno`
- no admin ficará coerente com a nova regra visual

## Arquivos que devem entrar na implementação

1. `src/hooks/building-store/buildingStoreActions.ts`
2. `src/hooks/building-store/buildingStoreFilters.ts`
3. `src/services/buildingsAdminService.ts`
4. `src/components/admin/buildings/BuildingPanelStatusBadge.tsx`
5. `src/components/admin/buildings/AdminBuildingCard.tsx`
6. `src/components/admin/buildings/v3/BuildingCard3.tsx`

## Observação importante da auditoria
Não encontrei evidência de que o Supabase esteja removendo o COMERCIAL TABLET da loja pública. O bloqueio principal está no **frontend da store**, que ainda filtra por foto. Já o "Não conectado" vem da ausência real de vínculo em `devices` para 7 prédios ativos, então isso precisa ser reinterpretado na interface para obedecer sua regra de negócio.
