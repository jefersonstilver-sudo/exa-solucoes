

# Página Pública de Monitor em Tempo Real (`/monitor`)

## O que será criado

Uma página pública premium em `/monitor` que exibe o status de todos os painéis em tempo real (igual ao modo tela cheia atual), protegida por uma tela de login com senha fixa. Inclui um botão "Copiar link do monitor" na página de Painéis admin.

## Arquitetura

```text
/monitor (rota pública)
  └── MonitorPublicPage.tsx
       ├── Tela de Login (senha: Exa3029@#)
       │    - Design premium dark com logo EXA
       │    - Input de senha + botão entrar
       │    - Senha salva em sessionStorage (sessão atual)
       └── Monitor em Tela Cheia (após autenticação)
            - Busca devices diretamente do Supabase (tabela devices)
            - Polling a cada 15s (igual ao admin)
            - Cards com LED de status, nome, provedor, tempo offline
            - Relógio em tempo real, contadores online/offline
            - Grid responsivo auto-adaptável
```

## Arquivos a criar/modificar

### 1. `src/pages/public/MonitorPublicPage.tsx` (NOVO)
- **Tela de login**: Fundo dark gradient (preto/cinza-950), logo EXA centralizada, campo de senha com PasswordInput, botão vermelho EXA (`bg-[#9C1E1E]`), animações suaves com framer-motion
- **Monitor**: Reutiliza a lógica visual do `FullscreenMonitor` mas como componente standalone (sem createPortal, sem dependência de props externas). Busca devices diretamente via `fetchDevices()` do utils/devices.ts
- Senha verificada contra `Exa3029@#` no client-side, estado salvo em `sessionStorage` para persistir durante a sessão
- Auto-refresh dos devices a cada 15s
- Realtime subscription na tabela `devices` para atualizações instantâneas

### 2. `src/App.tsx` (MODIFICAR)
- Adicionar rota pública: `<Route path="/monitor" element={<MonitorPublicPage />} />`
- Lazy load do componente

### 3. `src/modules/monitoramento-ia/pages/Paineis.tsx` (MODIFICAR)
- Adicionar botão "Copiar link do Monitor" no header (ao lado do botão de tela cheia existente)
- Usa `generatePublicUrl('/monitor')` do `src/config/domain.ts` para gerar o link `examidia.com.br/monitor`
- Ícone de Link/Copy com toast de confirmação

## Design da Tela de Login
- Fundo: gradient radial escuro com efeito de glow vermelho sutil
- Card central glassmorphism (`backdrop-blur-xl bg-white/5 border border-white/10`)
- Logo EXA no topo
- Título: "Monitor de Painéis" em branco, subtítulo em cinza
- Campo de senha com ícone de cadeado
- Botão "Acessar Monitor" em vermelho EXA
- Erro de senha com shake animation

## Design do Monitor (após login)
- Idêntico ao FullscreenMonitor existente: fundo preto, header com relógio grande, contadores online/offline, grid de cards com LED de status
- Cards verdes (online) e vermelhos (offline) com glow effects
- Sem botão de fechar (é página standalone)
- Header mostra "EXA Monitor" + relógio + contadores
- Responsivo para TV, desktop, tablet e mobile

## Impacto
- Nenhuma alteração nas funcionalidades existentes
- Página 100% pública (sem auth Supabase necessário)
- Dados lidos da tabela `devices` (mesma fonte do admin)

