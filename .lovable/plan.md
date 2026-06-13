## Mudanças no Dashboard do Relatório de Playlist

### 1. Top Clientes e Top Prédios — listas completas com scroll e alternador
Arquivo: `src/components/admin/buildings/relatorio-playlist/ReportDashboard.tsx`

- Renomear os títulos para "Clientes (por nº de prédios)" e "Prédios (por nº de vídeos ativos)" — sem o "Top 10".
- Adicionar um botão alternador (chevron / "Expandir/Recolher") em cada card, com estado `useState` local (padrão: aberto).
- Quando aberto: envolver a `<table>` num container `max-h-[420px] overflow-y-auto` com `<thead className="sticky top-0 bg-white">` para o cabeçalho ficar fixo durante o scroll.
- Renderizar TODOS os itens (sem `.slice(0,10)`), sempre em ordem decrescente (clientes por nº de prédios, prédios por nº de vídeos ativos).

### 2. Hook — devolver listas completas ordenadas
Arquivo: `src/hooks/useGlobalPlaylistReport.ts` (linhas ~576–591)

- `topClientes`: remover `.slice(0, 10)`; garantir ordenação `predios_count DESC` (desempate: `videos_count DESC`, depois `nome ASC`).
- `topPredios`: remover `.slice(0, 10)`; manter ordenação `videos_count DESC` (desempate: `nome ASC`).
- Manter os mesmos campos no tipo `PlaylistReport.rankings` (sem mudança de schema).

### 3. KPI "Prédios em exibição" — bater com a loja pública
Arquivo: `src/hooks/useGlobalPlaylistReport.ts` (linha ~633)

A loja pública (`src/hooks/building-store/buildingStoreActions.ts`) conta todos os prédios com `status ∈ ['ativo', 'instalação', 'instalacao']`, independente de terem vídeos rodando. Hoje o relatório conta apenas prédios que têm vídeo em exibição, por isso o número fica menor.

- Trocar `totalPredios` para `buildings.length` (o array já vem filtrado pelos mesmos status na query da linha 151).
- Renomear o label do KPI no `ReportDashboard.tsx` de "Prédios em exibição" para "Prédios ativos" para refletir a paridade com a loja.

### Fora de escopo
Sem alterações em outros KPIs, na ordenação descendente já existente, em RPC, RLS, schema, edge functions, ou em qualquer outra parte da UI/fluxo.