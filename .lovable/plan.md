

# Plano: Adicionar rota "tarefas" ao AdminRoutes

## Problema
A rota `/admin/tarefas` **não existe** em `AdminRoutes.tsx`. Ela só existe em `SuperAdminRoutes.tsx`. Por isso, quando um admin/funcionário com permissão `minha_manha` clica em "Central de Tarefas" na sidebar, recebe página em branco ou erro 404.

## Correção

### Arquivo: `src/routes/AdminRoutes.tsx`

1. Adicionar lazy imports para `CentralTarefasPage` e `FullscreenAgendaPage` (mesmos que existem no SuperAdminRoutes)
2. Adicionar 3 rotas protegidas com `MODULE_KEYS.minha_manha`:
   - `tarefas` → `CentralTarefasPage`
   - `tarefas/fullscreen` → `FullscreenAgendaPage`
   - `minha-manha` → redirect para `/admin/tarefas`
3. Também adicionar `minha_manha` ao `DEPT_PRIORITY.comercial` para que o redirect inteligente considere tarefas

### Nenhum outro arquivo precisa mudar
A sidebar já mapeia corretamente `Central de Tarefas` → `buildPath('tarefas')` com `moduleKey: MODULE_KEYS.minha_manha`. O problema é exclusivamente a rota ausente.

