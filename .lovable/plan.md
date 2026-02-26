

# Cronometro & Temporizador Corporativo - Pagina de Gestao de Tempo

## Visao Geral

Uma pagina completa de gestao de tempo no estilo Apple/minimalista, posicionada abaixo de "Processos" na secao **Operacao** do sidebar. A pagina combina 3 ferramentas em abas elegantes: **Cronometro**, **Temporizador** e **Pomodoro**.

## Layout Visual

```text
+------------------------------------------------------------------+
|  Gestao de Tempo                                                  |
|  Controle e otimize o tempo da sua equipe                         |
|                                                                   |
|  [ Cronometro ]  [ Temporizador ]  [ Pomodoro ]                   |
|                                                                   |
|  +--------------------------------------------+  +-----------+   |
|  |                                            |  | Historico  |   |
|  |              00:12:34.56                   |  |            |   |
|  |                                            |  | #1 00:05   |   |
|  |         [  Lap  ]   [ Start ]              |  | #2 00:03   |   |
|  |                                            |  | #3 00:04   |   |
|  +--------------------------------------------+  +-----------+   |
|                                                                   |
|  +--------------------------------------------+                  |
|  |  Sessoes de Hoje          Total: 2h 15m    |                  |
|  |  09:00 - Marketing Sprint      45min       |                  |
|  |  10:30 - Dev Review             30min       |                  |
|  +--------------------------------------------+                  |
+------------------------------------------------------------------+
```

## Funcionalidades por Aba

### 1. Cronometro (Stopwatch)
- Display digital grande com milissegundos (00:00:00.00)
- Botoes: Iniciar, Pausar, Retomar, Resetar, Lap (volta)
- Lista de laps com delta entre cada lap
- Animacao sutil no display (pulse quando rodando)
- Possibilidade de nomear a sessao (ex: "Sprint de Design")

### 2. Temporizador (Countdown Timer)
- Seletor circular ou numerico para definir tempo (hh:mm:ss)
- Presets rapidos: 5min, 10min, 15min, 30min, 1h
- Barra de progresso circular animada (SVG)
- Alerta sonoro + visual ao terminar (badge pulsante)
- Possibilidade de criar presets personalizados

### 3. Pomodoro
- Ciclo padrao: 25min foco + 5min pausa (configuravel)
- Pausa longa a cada 4 ciclos (15min, configuravel)
- Indicador visual de ciclos completos (4 circulos)
- Estatisticas da sessao: ciclos completos, tempo total de foco
- Modo "foco" que escurece levemente a UI

## Cards de Estatisticas (rodape da pagina)

- **Tempo Total Hoje**: soma de todas as sessoes do dia
- **Sessoes Hoje**: quantidade de sessoes cronometradas
- **Media por Sessao**: tempo medio
- **Pomodoros Completos**: ciclos finalizados no dia

## Persistencia de Dados

- Salvar sessoes na tabela `time_sessions` (Supabase):
  - `id`, `user_id`, `type` (stopwatch/timer/pomodoro), `label`, `duration_seconds`, `started_at`, `ended_at`, `laps` (jsonb), `created_at`
- Historico dos ultimos 7 dias visivel em um painel lateral colapsavel

## Arquivos a Criar/Modificar

### Novos arquivos:
1. **`src/pages/admin/gestao-tempo/GestaoTempoPage.tsx`** - Pagina principal com tabs
2. **`src/pages/admin/gestao-tempo/components/StopwatchTab.tsx`** - Cronometro com laps
3. **`src/pages/admin/gestao-tempo/components/TimerTab.tsx`** - Temporizador com presets
4. **`src/pages/admin/gestao-tempo/components/PomodoroTab.tsx`** - Pomodoro com ciclos
5. **`src/pages/admin/gestao-tempo/components/TimeDisplay.tsx`** - Display digital reutilizavel
6. **`src/pages/admin/gestao-tempo/components/CircularProgress.tsx`** - Progresso circular SVG
7. **`src/pages/admin/gestao-tempo/components/SessionHistory.tsx`** - Historico de sessoes
8. **`src/pages/admin/gestao-tempo/components/DayStats.tsx`** - Cards de estatisticas do dia
9. **`src/hooks/useTimeSessions.ts`** - Hook para CRUD de sessoes no Supabase

### Arquivos a modificar:
10. **`src/components/admin/layout/ModernAdminSidebar.tsx`** - Adicionar item "Gestao de Tempo" abaixo de Processos na secao Operacao
11. **`src/routes/AdminRoutes.tsx`** - Adicionar rota `gestao-tempo`

## Detalhes Tecnicos

### Design System
- Usa `PageLayout` existente para header padronizado
- Cards com `bg-card`, `shadow-sm`, `rounded-xl` (padrao Apple)
- Tipografia do display: `font-mono text-6xl font-light tracking-wider` (estilo relogio Apple)
- Botoes: variante `outline` para acoes secundarias, `default` para acao principal
- Cores: primario para ativo, `muted` para pausado, `destructive` para resetar

### Cronometro (logica)
- `useRef` para `requestAnimationFrame` (precisao de milissegundos)
- Estado: `running`, `paused`, `stopped`
- Laps armazenados em array local, salvos no Supabase ao finalizar

### Pomodoro (logica)
- Maquina de estados: `focus` -> `short_break` -> `focus` -> ... -> `long_break`
- Contador de ciclos (1-4)
- Configuracoes persistidas no `localStorage`
- Audio notification via `new Audio()` com som sutil

### Sidebar
- Icone: `Timer` do lucide-react
- Posicao: logo abaixo de "Processos" no grupo Operacao
- moduleKey: `MODULE_KEYS.gestao_tempo` (a ser adicionado)

