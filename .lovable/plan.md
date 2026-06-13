
## Prompt Mestre Final — "Relatório de Playlist em Exibição"

Copie e cole o bloco abaixo no Lovable. Ele já consolida as 15 decisões que você tomou e as regras do sistema (escopo de pedidos, filtros de vídeos, prédios, permissões, layout, exportação).

---

### 🎯 PROMPT PARA O LOVABLE

> **Crie um novo botão "Gerar Relatório de Playlist" na página `/super_admin/predios` (`src/pages/admin/BuildingsManagement3.tsx` / `AdminBuildingsPageContent.tsx`), posicionado no cabeçalho ao lado dos botões "Atualizar" e "Novo Prédio". Esse botão deve abrir, em uma **nova aba** (`/super_admin/relatorio-playlist`), um relatório HTML completo e auditável do que está atualmente em exibição em toda a rede EXA.**
>
> **NÃO altere nenhuma outra UI, lógica de playlist, agendamento, pedidos ou prédios. Apenas adicione: (1) o botão, (2) a nova rota, (3) o hook de fetch dedicado, (4) a página do relatório.**
>
> ---
>
> #### 1. Escopo dos dados (fonte da verdade)
>
> - **Prédios incluídos:** `buildings.status IN ('ativo', 'instalação')`. Excluir `inativo`, `manutenção` e `interno`.
> - **Pedidos incluídos:** `pedidos.status IN ('ativo', 'video_aprovado')` AND `data_fim >= CURRENT_DATE`, cruzando `lista_predios @> [building.id]`.
> - **Vídeos incluídos:** somente `pedido_videos.selected_for_display = true` (o que está REALMENTE entrando na playlist agora). Slots vazios ou rejeitados de pedidos ativos devem ser computados como **alerta**, não como vídeo.
> - **Reutilize a lógica já existente** em `src/hooks/useBuildingActiveCampaigns/` (`fetchAllCampaignData`) — NÃO duplique queries. Crie um hook agregador `useGlobalPlaylistReport()` que itera os prédios elegíveis e consolida.
>
> ---
>
> #### 2. Estrutura do HTML (duas visões + alertas)
>
> Renderizar **uma única página** com índice fixo no topo (sticky) e três blocos:
>
> **A) Dashboard completo (cabeçalho)**
> - KPIs: total de prédios em exibição, total de clientes ativos, total de vídeos em exibição (H + V separados), nº de pedidos ativos, nº de alertas.
> - Breakdown horizontal vs vertical.
> - Tempo médio em exibição (em dias) dos vídeos atuais.
> - Ranking Top 10 clientes por nº de prédios em que estão exibindo.
> - Ranking Top prédios por nº de vídeos ativos.
> - Timestamp de geração + botão **"Atualizar dados"** (refaz o fetch sem recarregar a página).
> - Botão **"Exportar PDF"** (usar `window.print()` com `@media print` otimizado, ou `html2pdf.js` se necessário para qualidade superior — paginação A4 retrato, cabeçalho EXA repetido em cada página).
>
> **B) Visão por Cliente** (resumo)
> Para cada cliente com pedido ativo:
> - Nome + email (campos `users.full_name` quando disponível, fallback `email`).
> - Em quantos prédios está exibindo + lista clicável (âncora interna para a seção do prédio na visão B).
> - Total de vídeos (H / V).
> - Pedido(s) ativo(s): ID, plano (1/3/6/12m), data_inicio, data_fim, valor.
>
> **C) Visão por Prédio** (detalhe — núcleo do relatório)
> Para cada prédio elegível, seção dedicada com:
> - Cabeçalho: nome do prédio, código, bairro/endereço, status, nº de telas, status online/offline (de `paineis_status`).
> - **Duas tabelas separadas**: uma "📺 Vídeos Horizontais", outra "📱 Vídeos Verticais".
> - Cada linha da tabela contém:
>   1. Thumbnail/preview do vídeo (se disponível em `videos.url`)
>   2. Nome do vídeo (`videos.nome`)
>   3. Cliente: nome + email
>   4. Pedido ID + plano (1/3/6/12m)
>   5. data_inicio / data_fim do pedido
>   6. Valor do pedido
>   7. Duração do vídeo
>   8. Slot position
>   9. **Há quantos dias está em exibição** — calculado a partir do `updated_at` do `pedido_videos` quando ele foi marcado `selected_for_display = true` (usar `updated_at` da última atualização desse flag; se indisponível, fallback para `created_at` do `pedido_videos`).
>   10. Agendamento: **resumo textual** das `schedule_rules` (ex.: "Seg-Sex 08:00-18:00", "Todos os dias 24h", "Sem agendamento").
>   11. QR Code: ✓ se `qr_config.enabled = true`, com a URL de destino.
>   12. Status de aprovação (`approval_status`).
>   13. **Link "▶ Pré-visualizar"** que abre o vídeo em nova aba (URL signed do storage).
>
> **D) Bloco de Alertas (destacado em vermelho/amarelo)**
> Lista plana, sem agrupamento, dos seguintes problemas:
> - 🔴 **Pedidos ativos sem vídeo em exibição** — pedido com `selected_for_display = false` em todos os slots.
> - 🔴 **Prédio offline com pedido ativo rodando** — cruzar `paineis_status.online = false` (ou device offline há mais de X minutos) com pedidos ativos vinculados ao prédio.
>
> ---
>
> #### 3. Visual e responsividade
>
> - **Design EXA Premium** (na tela): glassmorphism, EXA Red `#C7141A`, cabeçalho `#7D1818`, slate, sem verde, fonte padrão do sistema, shadow-2xl, cards Apple-like. Manter o layout do site (header/sidebar do `ModernSuperAdminLayout`).
> - **CSS `@media print` separado**: vira print-friendly (preto/branco, tabelas densas, sem sidebar, quebras de página inteligentes que NUNCA cortam uma linha de tabela ao meio nem separam o cabeçalho da seção do prédio do seu conteúdo — seguir o padrão V4.0 de paginação inteligente já documentado no projeto).
> - Cabeçalho do PDF deve conter: logo EXA, título "Relatório de Playlist em Exibição", data/hora de geração, nome do usuário que gerou, número da página.
>
> ---
>
> #### 4. Permissão e acesso
>
> - O botão "Gerar Relatório de Playlist" só aparece para usuários com role `super_admin` ou `admin`.
> - A rota `/super_admin/relatorio-playlist` deve ter o mesmo guard de role.
> - Registrar a geração em `system_activity_feed` ou tabela equivalente para auditoria (quem gerou, quando, quantos prédios/vídeos foram listados).
>
> ---
>
> #### 5. Performance
>
> - Buscas em **paralelo via `Promise.all`** (seguindo o padrão de `fetchAllCampaignData`).
> - Loading skeleton enquanto os dados carregam (a rede pode ter 26+ prédios × N pedidos × M vídeos).
> - Sem polling automático. O refresh é manual via botão.
>
> ---
>
> #### 6. Objetivo de negócio (contexto que o Lovable precisa entender)
>
> Este relatório é uma **ferramenta de auditoria operacional e jurídica**. Será usado para:
> 1. Conferir, via AnyDesk ou inspeção física na tela do prédio, se o que está sendo exibido bate **exatamente** com o que o relatório lista.
> 2. Identificar vídeos pagos que NÃO estão sendo exibidos (alerta).
> 3. Identificar vídeos exibidos sem pedido ativo (não deve acontecer, mas o relatório expõe).
> 4. Validar que campanhas com agendamento estão respeitando dias/horários.
> 5. Garantir proteção jurídica: prova documental do que estava no ar em determinado momento.
>
> A **fidelidade dos dados é inegociável** — sempre dados reais do Supabase, sem mock, sem suposição.
>
> ---
>
> #### 7. Restrição absoluta
>
> Não toque em nada além do necessário para essa feature. NÃO modifique a lógica de playlist, scheduling, AWS sync, pedidos, ou qualquer fluxo existente. Apenas LEIA os dados que já existem.

---

### 📦 O que o Lovable vai precisar criar (resumo técnico)

```text
src/
├── hooks/
│   └── useGlobalPlaylistReport.ts         (novo - agrega dados de todos os prédios)
├── pages/
│   └── super_admin/
│       └── RelatorioPlaylistPage.tsx       (nova rota /super_admin/relatorio-playlist)
├── components/
│   └── admin/
│       └── buildings/
│           ├── BuildingsPageHeader.tsx     (editar - adicionar botão)
│           └── relatorio-playlist/
│               ├── ReportHeader.tsx
│               ├── ReportDashboard.tsx
│               ├── ReportByClient.tsx
│               ├── ReportByBuilding.tsx
│               ├── ReportAlerts.tsx
│               └── report-print.css        (@media print)
└── routes/
    └── index.tsx                           (editar - registrar rota)
```

Sem nenhuma alteração de schema do Supabase — todos os dados já existem.

---

Quando quiser, é só me pedir para **mudar para build mode** que eu implemento exatamente esse plano.
