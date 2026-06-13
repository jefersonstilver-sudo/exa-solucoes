
## Plano — Relatório de Playlist em Exibição

Feature isolada: botão no header de `/super_admin/predios` → abre nova aba `/super_admin/relatorio-playlist` com relatório auditável (Dashboard + Por Cliente + Por Prédio + Alertas), responsivo, com export PDF via `@media print`. Sem alterar qualquer fluxo existente — apenas LEITURA dos dados já no Supabase.

---

### 1. Arquivos a criar

```text
src/
├── hooks/
│   └── useGlobalPlaylistReport.ts
├── pages/
│   └── admin/
│       └── RelatorioPlaylistPage.tsx
├── components/
│   └── admin/
│       └── buildings/
│           └── relatorio-playlist/
│               ├── ReportHeader.tsx        (logo EXA, título, timestamp, user, botões Atualizar/PDF)
│               ├── ReportDashboard.tsx     (KPIs + breakdown H/V + rankings)
│               ├── ReportByClient.tsx      (resumo por cliente com âncoras)
│               ├── ReportByBuilding.tsx    (núcleo: 2 tabelas H/V por prédio)
│               ├── ReportAlerts.tsx        (pedidos sem vídeo / prédio offline)
│               ├── ReportSkeleton.tsx      (loading)
│               └── report-print.css        (@media print A4)
```

### 2. Arquivos a editar (mínimo)

- `src/components/admin/buildings/v3/BuildingsHeader3.tsx` — adicionar botão **"Gerar Relatório de Playlist"** ao lado de "Atualizar" / "Novo Prédio". Visível apenas para `super_admin` ou `admin` (via `useAuth`). Ação: `window.open('/super_admin/relatorio-playlist', '_blank')`.
- `src/routes/SuperAdminRoutes.tsx` — registrar `<Route path="relatorio-playlist" element={<RelatorioPlaylistPage />} />` (lazy import).
- `src/routes/AdminRoutes.tsx` — registrar a mesma rota dentro do grupo admin com role guard.

Nada mais é tocado. Sem migrations. Sem mudanças em pedidos/playlist/agendamento.

---

### 3. `useGlobalPlaylistReport()` — Hook agregador

Reutiliza `fetchAllCampaignData(buildingId)` de `src/hooks/useBuildingActiveCampaigns/dataFetchers.ts` em paralelo via `Promise.all`. Fluxo:

1. Buscar `buildings` onde `status IN ('ativo', 'instalação')`.
2. Para cada prédio elegível, `Promise.all` chamando `fetchAllCampaignData(id)`.
3. Em paralelo, buscar:
   - `paineis_status` de todos os prédios (1 query) para detectar offline.
   - `campaign_schedule_rules` dos `pedido_video.id` envolvidos (1 query `.in('pedido_video_id', ids)`).
   - `videos` complementar (duração, orientação, url) — já vem no join existente.
   - `users` (name + email) dos `client_id` envolvidos (1 query).
4. Consolidar em estrutura única:
   ```ts
   {
     generatedAt: Date,
     generatedBy: { id, name, email },
     buildings: BuildingReport[],     // por prédio
     clients: ClientReport[],          // agregado por cliente
     kpis: { totalPredios, totalClientes, totalVideos, totalVideosH, totalVideosV, totalPedidos, totalAlertas, tempoMedioDias },
     rankings: { topClientes, topPredios },
     alerts: Alert[]                   // pedidos sem vídeo + prédios offline
   }
   ```
5. Filtrar vídeos para `selected_for_display === true`. Calcular "dias em exibição" via `updated_at` do `pedido_videos` (fallback `created_at`).
6. Resumir `schedule_rules` em texto: `formatScheduleRules(rules)` → "Seg-Sex 08:00-18:00", "24/7", ou "Sem agendamento".
7. Calcular alertas:
   - **Sem vídeo:** pedido ativo cujo `pedido_videos` tem todos slots com `selected_for_display=false`.
   - **Prédio offline:** `paineis_status.online=false` (ou `last_seen` > 10min) E há pedido ativo no prédio.

Retorna `{ data, loading, error, refetch }`. Sem polling. Sem realtime.

### 4. `RelatorioPlaylistPage.tsx`

- Layout dentro de `ModernSuperAdminLayout` (mantém header/sidebar do sistema na tela).
- Guard: redireciona se role não for `super_admin` ou `admin`.
- Ao montar: chama `useGlobalPlaylistReport()` + registra auditoria via `supabase.from('system_activity_feed').insert({ action: 'playlist_report_generated', meta: { totalPredios, totalVideos } })`.
- Renderiza, em ordem:
  1. `<ReportHeader>` (sticky no topo, com índice de navegação e botões Atualizar/Export PDF).
  2. `<ReportDashboard>` — KPIs em grid responsivo (1 col mobile, 2-4 col desktop), breakdown H/V, tempo médio, rankings em 2 colunas.
  3. `<ReportAlerts>` — destaque vermelho/amarelo, lista plana.
  4. `<ReportByClient>` — cards expandíveis com link âncora `#predio-{id}`.
  5. `<ReportByBuilding>` — uma seção por prédio, com âncora `id="predio-{id}"`, contendo duas tabelas separadas (H/V) com todas as colunas especificadas. Thumbnail = `<video>` em `preload="metadata"` ou poster gerado; botão "▶ Pré-visualizar" abre URL signed em nova aba.
- Skeleton `<ReportSkeleton>` enquanto `loading`.

### 5. Visual e Responsividade

**Tela (EXA Premium):**
- Fundo `slate-50` com cards `bg-white/80 backdrop-blur-md shadow-2xl rounded-2xl`.
- Cabeçalho da página `#7D1818` com logo EXA; KPIs em cards Apple-like com acento `#C7141A`.
- Tabelas: cabeçalho `bg-slate-100`, zebra `odd:bg-white even:bg-slate-50/50`, badges para orientação/status/aprovação. Sem verde.
- Responsivo: KPIs `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`. Tabelas com `overflow-x-auto` em mobile preservando legibilidade.

**Impressão / PDF (`report-print.css` com `@media print`):**
- Esconder sidebar, header de app e botões (`.no-print`).
- Cores chapadas, tabelas densas, fonte 10pt.
- A4 retrato, margens 12mm.
- `page-break-inside: avoid` em cada `<tr>` e em cada cabeçalho de seção de prédio (segue padrão V4.0 — nunca cortar linha nem separar título do conteúdo).
- `@page { @top-center { content: "Relatório de Playlist em Exibição — EXA"; } @bottom-right { content: "Página " counter(page) " de " counter(pages); } }`.
- Cabeçalho EXA fixo via `<thead>` em tabelas longas (repete em cada página).

### 6. Permissões e Auditoria

- Botão e rota: visíveis apenas para `super_admin` e `admin` (checagem via `useAuth()` + `user_roles`).
- Auditoria: insert em `system_activity_feed` registrando `user_id`, `action='playlist_report_generated'`, `meta={ generated_at, total_buildings, total_videos, total_alerts }`.

### 7. Performance

- Paralelismo: `Promise.all` sobre prédios + queries agregadas únicas para `paineis_status`, `users`, `campaign_schedule_rules`.
- Sem `select *`: apenas colunas usadas.
- Sem polling. Refresh manual via botão "Atualizar dados".
- Skeleton imediato. Cálculos pesados (rankings, agregados) memoizados via `useMemo`.

### 8. Restrições absolutas

- Zero modificação em pedidos, playlists, schedules, AWS sync, prédios, ou qualquer hook/serviço fora da pasta nova.
- Apenas SELECT no Supabase (+ 1 INSERT em `system_activity_feed` para auditoria).
- Sem migrations, sem novas tabelas, sem mudança de RLS.

---

### Diagrama de fluxo

```text
[Header /super_admin/predios]
        │ click "Gerar Relatório"
        ▼
[Nova aba: /super_admin/relatorio-playlist]
        │
        ├─ Guard role (super_admin | admin)
        │
        ▼
[useGlobalPlaylistReport()]
        │
        ├─ buildings (status ∈ ativo/instalação)
        ├─ Promise.all(fetchAllCampaignData por prédio)
        ├─ paineis_status (batch)
        ├─ users (batch)
        └─ campaign_schedule_rules (batch)
        │
        ▼
[Consolidação + filtros + alertas]
        │
        ▼
[ReportHeader] [Dashboard] [Alerts] [ByClient] [ByBuilding (H + V)]
        │
        ▼
[Export PDF via window.print() + @media print]
```

Pronto para implementar. Quando aprovar, executo na ordem: hook → componentes → página → rota → botão no header, testando o build ao final.
