## Objetivo

Criar uma nova área administrativa (Super Admin), logo abaixo de **Pedidos**, chamada **Scans de QR Code**, que mostra **TODOS** os scans rastreados, em tempo real, de **todos os clientes / pedidos / vídeos / prédios** do sistema — sem perder nenhum scan.

---

## Como os scans existem hoje (análise)

1. A API externa AWS (`http://18.228.252.149:8000/qrcode/logs/{cliente_ids}`) é a **única fonte de verdade** dos scans. A tabela `public.qr_codes` só guarda `total_scans` agregado (hoje está zerada) e **não** registra cada scan.
2. Já existe a edge function **`qrcode-logs-proxy`** que faz proxy para essa API aceitando `cliente_ids` separados por vírgula + filtro `titulo`.
3. O `cliente_id` (cid) é derivado do UUID do prédio: `building.id.replace(/-/g,'').substring(0,4)` (4 chars hex). **Risco já documentado em memória:** colisão de CIDs entre prédios — um cid pode pertencer a vários prédios.
4. Só são "QR rastreáveis" os vídeos cujo `pedido_videos.qr_config.enabled = true`.
5. A API devolve `data_hora` em horário local de Brasília mas rotulado como UTC — usar o helper `parseScanDate` já existente em `QrCodesRastreaveis.tsx`.
6. Já existe uma versão **por cliente** em `src/pages/advertiser/QrCodesRastreaveis.tsx`. A nova página é a **versão global do admin**.

---

## Entregáveis

### 1. Nova rota e item de menu
- Rota: `/super_admin/qr-scans` em `src/routes/SuperAdminRoutes.tsx` (logo após `pedidos/:id`).
- Item no sidebar `ModernAdminSidebar.tsx` **logo abaixo de "Pedidos"**, usando ícone `QrCode`, `moduleKey: MODULE_KEYS.pedidos` (ou novo módulo `qr_scans` se preferirmos governar o acesso separadamente).
- Mesmo item adicionado em `MobileMoreMenu.tsx`.

### 2. Edge function — `qrcode-logs-proxy` (ampliar, sem quebrar)
- Aceitar `cliente_ids` em **lote grande** (centenas de CIDs). Para não estourar limite de URL da API externa:
  - Particionar a lista em chunks de ~50 CIDs no servidor.
  - Disparar fetches em paralelo (Promise.all com concorrência limitada, ex: 5).
  - Unir e deduplicar (por `cliente_id + titulo + data_hora + link`).
- Preservar o comportamento atual quando chamado pelo advertiser (`titulo` continua opcional, retorno no mesmo shape).

### 3. Página `src/pages/admin/QrScansAdminPage.tsx`

**Carga de metadados (Supabase, apenas leitura):**
- `buildings` → id, nome, bairro, cidade, foto → mapear cid (com lista de prédios por cid para resolver colisões).
- `pedido_videos` com `qr_config.enabled = true` + join `videos` + `pedidos` (client_id, data_inicio, data_fim, status, lista_predios, nome_pedido) + `users` (nome/email do cliente).
- Construir índices: por cid, por título de vídeo, por pedido, por cliente.

**Carga de scans:**
- Coletar TODOS os cids de prédios que aparecem em pedidos com vídeo rastreável.
- Chamar `qrcode-logs-proxy` (única chamada — o chunking fica na função).
- Resolver cada scan a: prédio(s) (lista, por causa de colisão), vídeo (match por `titulo` ↔ `videos.nome`), pedido, cliente.
- Marcar scans **não-resolvidos** ("órfãos") em uma aba separada — assim **nenhum scan é descartado**.

**UI (padrão EXA Premium — glassmorphism, paleta vermelho/slate, sem verde):**
- Header com KPIs: Total de scans, Hoje, 7d, 30d, Prédios com scan, Vídeos com scan, Clientes ativos.
- Filtros: período (date range), cliente, prédio, vídeo (título), cid, status (resolvido / órfão).
- Busca textual livre (cliente, prédio, vídeo, link, cid).
- Tabelas/aba:
  - **Todos os scans** (lista completa, paginação client-side + virtualização se >500): data/hora, cliente, prédio(s), vídeo, cid, link, "há X tempo".
  - **Por cliente** (ranking).
  - **Por prédio** (ranking + mapa opcional futuro).
  - **Por vídeo** (ranking).
  - **Órfãos** (scans cujo cid/titulo não bate com nada — para auditoria).
- Gráfico de linha de scans por dia (últimos 30/90 dias) usando lib já presente no projeto.
- Exportar **CSV** de qualquer aba (download via `/mnt`-style blob no browser).
- Auto-refresh a cada 60s (respeitando a regra do projeto de polling ≥60s).

### 4. Permissão
- Acessível apenas a `super_admin` (e admin via `MODULE_KEYS.pedidos` ou novo módulo).
- Sem alterações no UI/funcionalidades existentes — só **adições**.

---

## Garantia de "nenhum scan perdido"

- Sempre montar a lista de cids a partir de **TODOS os prédios** referenciados por qualquer `pedido_videos.qr_config.enabled=true`, independentemente do status do pedido (ativo, finalizado, cancelado).
- Chunking no servidor evita perda por limite de URL.
- Scans sem match (cid colidido ou título divergente) vão para a aba **Órfãos**, nunca descartados.
- A coluna `cliente_id` do scan + lista de prédios por cid é exibida, evidenciando colisões.

---

## Detalhes técnicos

```text
src/
  pages/admin/QrScansAdminPage.tsx            (nova)
  routes/SuperAdminRoutes.tsx                 (adicionar rota /qr-scans)
  components/admin/layout/ModernAdminSidebar.tsx  (item abaixo de Pedidos)
  components/admin/layout/MobileMoreMenu.tsx  (item correspondente)
supabase/functions/qrcode-logs-proxy/index.ts (ampliar chunking, manter contrato)
```

Reaproveitar de `src/pages/advertiser/QrCodesRastreaveis.tsx`: helpers `deriveClienteId`, `parseScanDate`, `formatDateBR`, `timeAgo`. Extraí-los para `src/utils/qrScans.ts` para reuso (sem alterar a página do advertiser além do import).

---

## Fora do escopo (para confirmar depois, se desejar)

- Persistir scans num `qr_code_scans` no Supabase (snapshot histórico independente da AWS) — útil se a API externa cair. Posso planejar como Fase 2.
- Geolocalização real do scan (a API atual não expõe IP/coords).
- Substituir o esquema de cid de 4 chars por algo sem colisão — mudança contratual com a AWS (memória já registra o débito).