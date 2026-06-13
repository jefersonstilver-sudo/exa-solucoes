## Card de Clientes — expansão por pedido (com contagem de prédios incluindo internos)

### 1. Hook: incluir prédios `interno` no dataset (sem inflar o KPI público)
Arquivo: `src/hooks/useGlobalPlaylistReport.ts`

- Query de `buildings` (linha ~151): trocar `.in('status', ['ativo','instalação','instalacao'])` para `.in('status', ['ativo','instalação','instalacao','interno'])` — assim os prédios internos (entrada, sala de reunião comercial, tablet) entram na contagem por pedido.
- KPI `totalPredios` (linha ~633): manter paridade com a loja pública → contar apenas `buildings.filter(b => b.status !== 'interno').length`.
- Em `ReportClient.pedidos` (no agrupamento de linha ~512), adicionar `predios_count: number` calculado a partir de `lista_predios` do pedido intersectado com `buildingIds` (que agora inclui internos). Também adicionar `videos_count: number` (vídeo único em exibição AGORA para o pedido — usar `currentVideoIdByPedido`).
- Atualizar o tipo `ReportClient['pedidos'][number]` para incluir `predios_count` e `videos_count`.

### 2. Dashboard: card "Clientes" vira lista hierárquica expansível
Arquivo: `src/components/admin/buildings/relatorio-playlist/ReportDashboard.tsx`

- Cada linha do ranking de clientes vira clicável (chevron à esquerda do nome).
- Estado local `expandedClients: Set<string>` (clientes inicialmente recolhidos para manter elegância).
- Ao expandir um cliente, renderizar uma sub-tabela com os pedidos daquele cliente, mostrando:
  - `#` (índice 1..n)
  - `Pedido` (primeiros 8 chars do id + plano em meses)
  - `Início` (`data_inicio` formatado pt-BR)
  - `Prédios` (`predios_count`, contagem por pedido — inclui internos)
  - `Vídeos` (`videos_count`, vídeo único em exibição AGORA)
- A coluna agregada "Vídeos" do cliente continua sendo `c.total_videos` (já existe).
- Manter o container `max-h-[420px] overflow-y-auto` com `<thead sticky>` para scroll vertical elegante.
- Sub-linhas têm fundo `bg-slate-50/60` e indentação para diferenciar da linha-pai.

### 3. Fora de escopo
Sem mudanças no card "Prédios", em outros KPIs, em alertas, RPC, RLS, schema, edge functions ou qualquer outra parte da UI/fluxo. O dataset de pedidos e a regra canônica de "1 vídeo por pedido AGORA" permanecem iguais.