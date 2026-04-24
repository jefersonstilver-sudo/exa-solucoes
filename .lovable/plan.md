## Implementação: Scroll-to-top + Logos clicáveis + Exit Guard

### 1. Scroll-to-top automático
- **`InteresseSindicoFormulario.tsx`**: `useEffect([step])` com `window.scrollTo({ top: 0, behavior: 'smooth' })` a cada mudança de etapa (0→1→2).
- **`InteresseSindicoSucesso.tsx`**: `useEffect` no mount → scroll ao topo.
- **`InteresseSindicoLanding.tsx`**: `useEffect` no mount → garante topo ao voltar.

### 2. Logos clicáveis (link para `/`)
- **`InteresseSindicoFormulario.tsx`**: Logo agora aponta para `/`, interceptada pelo Exit Guard se houver dados.
- **`InteresseSindicoSucesso.tsx`**: Logo envolvida em `<a href="/">` (sem guard, fluxo terminou).
- **`HeroSection.tsx`** (landing): Garantir logo da hero como link para `/`.

### 3. Exit Guard (botão flutuante glass + intercepts)
- **🆕 `useExitGuard.ts`**: Hook retorna `formStarted` (boolean memoizado verificando campos preenchidos em `predio` + `sindico`) + `requestExit(targetUrl)` que abre o `AlertDialog`.
- **🆕 `ExitGuardFloating.tsx`**: 
  - Botão flutuante glass (`backdrop-blur-xl bg-white/10 border-white/20`) canto inferior direito.
  - Visível só quando `formStarted === true`.
  - Clique → `AlertDialog`: "Sair do formulário? Você perderá os dados preenchidos."
  - **Cancelar** (fica) / **Sair mesmo assim** (navega para `/` + `reset()` da store).
- **Integração em `InteresseSindicoFormulario.tsx`**: 
  - Renderizar `<ExitGuardFloating />`.
  - `beforeunload` listener → alerta ao fechar aba quando `formStarted`.
  - Logo do header: interceptar clique e abrir dialog se `formStarted`.

### Arquivos
- ✏️ `src/pages/InteresseSindicoFormulario.tsx`
- ✏️ `src/pages/InteresseSindicoSucesso.tsx`
- ✏️ `src/pages/InteresseSindicoLanding.tsx`
- ✏️ `src/components/interesse-sindico/HeroSection.tsx`
- 🆕 `src/components/interesse-sindico-form/useExitGuard.ts`
- 🆕 `src/components/interesse-sindico-form/ExitGuardFloating.tsx`

### Não será alterado
- Layout, estilos, validação, envio, OTP WhatsApp, PDF, e-mail, store de dados.
- Rotas fora de `/interessesindico`.