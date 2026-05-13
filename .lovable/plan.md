# Modo "Admin Master de Vídeo" — Acessar como Cliente

Função super avançada que permite admin master entrar na área `/anunciante` como se fosse o cliente (em nova aba isolada), com poderes de editar, trocar e excluir vídeos individualmente ou em massa, com auditoria completa.

## 1. Novo nível de acesso: `admin_master_video`

- Adicionar valor `admin_master_video` ao enum `app_role` (Postgres).
- No console de usuários (Tipos de Conta), adicionar a opção para super_admin atribuir/remover essa role.
- Helper `has_role(uid, 'admin_master_video')` (já existe pattern) usado em policies e UI.
- Permissão de impersonar concedida a: `super_admin` **OU** `admin_master_video`.

### Onboarding moderno na primeira entrada
- Email transacional via `send-transactional-email` (template novo `admin-master-video-ativado`) disparado quando role é atribuída.
- No primeiro login após receber a role, modal "Premium Apple-like" full-screen mostra: o que é, para que serve, cuidados (auditoria, ações irreversíveis, expiração 30min), botão "Entendi e aceito".
- Aceite gravado em `admin_master_video_onboarding (user_id, accepted_at)`.

## 2. Sessão de impersonação (modo "view-as")

Sem trocar JWT — mantém sessão admin e usa flag de contexto:

- Tabela `admin_impersonation_sessions`:
  - `id`, `admin_user_id`, `target_user_id`, `target_pedido_id` (nullable), `started_at`, `expires_at` (default `now()+30min`), `ended_at`, `end_reason` ('manual'|'expired'|'forced').
- Edge function `start-impersonation`: valida role, cria registro, retorna `session_id` + `target_user_id`.
- Edge function `end-impersonation`: marca `ended_at`.
- Frontend abre nova aba: `/anunciante/dashboard?impersonate=<session_id>`.
- Hook global `useImpersonation` lê o param, valida via edge function `verify-impersonation` (retorna target user + dados), guarda em `ImpersonationContext`.
- `useAuth()` derivado expõe `effectiveUserId` (target quando impersonando, próprio user_id caso contrário). Todas as queries do anunciante usam `effectiveUserId`.

### Barra fixa topo (red EXA)
- `<ImpersonationTopBar />` renderizada no layout do anunciante quando contexto ativo.
- Mostra: avatar/email do cliente, contador regressivo até `expires_at`, botão "Sair do modo cliente".
- Auto-expira 30min — fecha aba e mostra toast.

## 3. Pontos de entrada (UI)

### A) Modal "Vídeos em Exibição" do prédio (`/super_admin/predios` → botão Playlist)
Em cada item da playlist:
- Linha `Dono: cliente@email.com`.
- Botão vermelho "Acessar como cliente" → chama `start-impersonation` com `target_pedido_id` e abre `/anunciante/pedidos/{pedido_id}?impersonate=<session_id>` em nova aba.

### B) Lista de Pedidos admin
- Botão "Acessar como cliente" no card do pedido + dentro do detalhe do pedido (header).

## 4. Poderes do admin no modo cliente

Layout idêntico ao anunciante — escopo: **Pedidos, Vídeos, Relatórios e QR Codes Rastreáveis**.

### Trocar vídeo
- Mesmo fluxo TUS do cliente (`uploadVideo` em VideoSlotUpload).
- Auto-aprovação: quando `impersonating === true`, força `approval_status: 'approved'`, `is_active: true`.

### Deletar 1 vídeo (admin-only botão)
- Hard delete: chama edge function nova `admin-hard-delete-video`:
  1. Deleta `pedido_videos`, `videos`, `video_schedules`.
  2. Remove do storage (signed delete).
  3. Chama `delete-video-from-external-api` (AWS).
  4. Loga em `admin_impersonation_actions`.
- Botão visível só quando `impersonating && hasRole('admin_master_video'|'super_admin')`.

### Deletar TODOS vídeos do pedido (admin-only)
- Botão "Limpar playlist do pedido" no detalhe do pedido.
- Modal Danger Zone: usuário digita o **nome do cliente OU id do pedido** para confirmar.
- Edge function `admin-purge-pedido-videos`: itera + hard-delete (banco + storage + AWS), loga cada item.

### Status do pedido
- Permitido em **qualquer status**, inclusive finalizado/cancelado. Sem restrição extra.

## 5. Auditoria

- Tabela `admin_impersonation_actions`:
  - `id`, `session_id` FK, `admin_user_id`, `target_user_id`, `pedido_id`, `action` ('view'|'upload_video'|'delete_video'|'purge_pedido'|'approve_video'|'edit_qr'|'edit_schedule'), `entity_id`, `payload` (jsonb), `created_at`.
- Cada ação no modo impersonado escreve aqui (via edge function `log-impersonation-action`).
- Cliente NÃO é notificado (apenas log).

### Página de auditoria: `/super_admin/auditoria-impersonacao`
- Tabela com filtros: admin, cliente, pedido, ação, intervalo de datas.
- Drill-in: linha → drawer com timeline da sessão (start → ações → end).
- Acessível só para super_admin.

## 6. RLS / Segurança

- Edge functions usam `service_role` para bypass; validam role do chamador via JWT antes de executar.
- Policies das tabelas `pedido_videos`, `videos`, etc. recebem cláusulas adicionais permitindo `has_role(auth.uid(), 'admin_master_video')` OR `has_role(auth.uid(),'super_admin')` para escrita.
- Nada exposto no client além de `session_id` (UUID opaco) — `target_user_id` é resolvido server-side a cada request crítica.
- Sessão expira em 30min server-side; edge functions rejeitam ações com `expires_at < now()`.

## Detalhes técnicos

```text
DB Schema (migration única)
├── ALTER TYPE app_role ADD VALUE 'admin_master_video';
├── admin_impersonation_sessions
├── admin_impersonation_actions
├── admin_master_video_onboarding
└── RLS: policies + helper has_role já existente

Edge Functions
├── start-impersonation      (POST: target_user_id, pedido_id?)
├── verify-impersonation     (GET: session_id → target user payload)
├── end-impersonation        (POST: session_id)
├── log-impersonation-action (POST: action payload)
├── admin-hard-delete-video  (POST: video_id, pedido_id, session_id)
├── admin-purge-pedido-videos(POST: pedido_id, confirmation_text, session_id)
└── (reuso) delete-video-from-external-api

Frontend
├── src/contexts/ImpersonationContext.tsx
├── src/hooks/useImpersonation.ts (effectiveUserId)
├── src/components/impersonation/ImpersonationTopBar.tsx
├── src/components/impersonation/AdminMasterWelcomeDialog.tsx
├── src/components/admin/buildings/PlaylistVideoOwnerActions.tsx
├── src/components/admin/orders/AccessAsClientButton.tsx
├── src/components/admin/orders/PurgePedidoVideosDialog.tsx
├── src/pages/super_admin/AuditoriaImpersonacao.tsx
└── Patch: useAuth → effectiveUserId; layout do anunciante renderiza TopBar

Email
└── send-transactional-email template: admin-master-video-ativado
```

## Fora de escopo (intencionalmente)

- Impersonação fora do anunciante (perfil, faturas, configs do cliente).
- Notificação ao cliente (apenas log).
- Suporte mobile da barra impersonação (V2).