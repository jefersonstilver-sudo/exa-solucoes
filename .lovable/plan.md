## Objetivo

Quando o super_admin (ou admin_master_video) clicar em "Acessar como cliente", o portal `/anunciante` deve abrir **na mesma janela** e operar **completamente como o cliente alvo** (nome, email, pedidos, vídeos, faturas, QR codes, relatórios) — sem mostrar o nome do super_admin nem dados misturados.

## Arquivos afetados

- `src/components/impersonation/AccessAsClientButton.tsx` — navegar na mesma aba
- `supabase/functions/verify-impersonation/index.ts` — retornar perfil completo do cliente
- `src/contexts/ImpersonationContext.tsx` — expor `effectiveUserProfile` e voltar para `/super_admin/pedidos` ao sair
- **Novo:** `src/hooks/useEffectiveAuth.ts` — wrapper de `useAuth` que substitui `userProfile` pelo cliente quando impersonando
- Páginas do anunciante (trocar `useAuth` por `useEffectiveAuth`):
  - `AdvertiserDashboard.tsx` (e bypass do redirect que expulsa super_admin)
  - `AdvertiserOrders.tsx`, `AdvertiserInvoices.tsx`, `AdvertiserReports.tsx`, `AdvertiserSettings.tsx`
  - `MyCampaigns.tsx`, `MyVideos.tsx`, `CampaignDetails.tsx`, `QrCodesRastreaveis.tsx`, `GeradorRoteiros.tsx`
- `ResponsiveAdvertiserSidebar`, `NewModernAdvertiserSidebar`, `AdvertiserDesktopSidebar`, `ResponsiveAdvertiserLayout`, `CompleteResponsiveLayout`, `UnifiedAdvertiserMobileHeader` (sidebars/headers que mostram nome/email)

## Mudanças, etapa por etapa

### 1. Abrir na mesma janela
- `AccessAsClientButton`: trocar `window.open(url, '_blank')` por `navigate(url)` (react-router). Mantém `?impersonate=<session_id>` na URL.
- Botão "Sair do modo cliente" passa a navegar para `/super_admin/pedidos` (quando origem foi super_admin).

### 2. Verify retorna perfil completo
`verify-impersonation` passa a retornar o registro inteiro do cliente em `target_user` (id, email, nome, role, telefone, empresa_nome, avatar_url, cnpj, etc.) — mesmo formato esperado pelo `userProfile` do `useAuth`.

### 3. Hook `useEffectiveAuth`
```text
useEffectiveAuth() →
  se isImpersonating:
    userProfile = effectiveUserProfile (do cliente alvo)
    isImpersonating = true
  senão:
    delega 100% ao useAuth() original
```
Este hook é a substituição **drop-in** do `useAuth` em todas as páginas do `/anunciante`.

### 4. Substituir `useAuth` por `useEffectiveAuth`
Em todas as páginas e componentes listados acima do `/anunciante`. Páginas fora do portal (`/super_admin`, `/admin`, etc.) continuam com `useAuth` normal.

### 5. Bypass do redirect no Dashboard
`AdvertiserDashboard` só redireciona super_admin se **não** estiver impersonando.

### 6. TopBar visível sempre
- Garantir que `ImpersonationTopBar` (z-1000) fica acima do header sticky (z-10) e do sidebar — já está, só revalidar.
- Adicionar margem ao topo do `<main>` para não ficar coberto pelo banner em todas as larguras.

### 7. Ações sensíveis
- Edge functions `admin-hard-delete-video` e `admin-purge-pedido-videos` já operam por `pedido_id` + service role — continuam funcionando porque o `pedidoId` vem do contexto de impersonação.
- Logging via `log-impersonation-action` continua registrando o admin real.

### 8. QA manual após implementação
- Login super_admin → Pedidos → "Acessar como cliente" em um pedido real
- Verificar: banner vermelho aparece no topo, sidebar mostra nome/email do **cliente**, pedidos listados são do cliente, faturas idem, relatórios idem, QR Codes idem
- Clicar "Sair do modo cliente" → volta para `/super_admin/pedidos`
- Auto-expira em 30min

## Notas

- Não altera RLS nem auth.uid() — a sessão real continua a do super_admin (necessário para edge functions admin-only). A "troca" é apenas do `userProfile` no front, que dirige as queries `.eq('client_id', X)`. Como super_admin já tem RLS de leitura ampla, as queries retornam os dados do cliente normalmente.
- O badge "Atualização do app disponível" na imagem é do anti-cache existente e não está relacionado.
