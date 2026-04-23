## Objetivo
Corrigir o pós-envio do formulário em `/interessesindico/formulario` para que a página `/interessesindico/sucesso` apareça imediatamente, e o formulário NUNCA seja apagado antes da navegação concluir.

## Diagnóstico confirmado
- O envio funciona: protocolo `EXA-2026-000005` foi salvo no banco.
- A Edge Function `gerar-pdf-aceite-sindico` rodou com sucesso (PDF gerado).
- O problema é puramente no frontend, em três pontos combinados:

1. `src/components/interesse-sindico-form/StepTermos.tsx` chama `reset()` ANTES de `navigate(...)`. Isso apaga toda a store (predio + sindico) na hora, então o usuário vê o formulário zerar antes da nova rota montar.
2. `src/App.tsx` declara as rotas de Interesse Síndico usando `React.createElement(lazy(() => import(...)))` inline dentro do `element`. Isso recria um novo componente lazy a cada render do `AppContent`, anula o cache do chunk e força Suspense repetido — o que torna a transição para a tela de sucesso intermitente/lenta.
3. O `PageTransitionLoader` do `AppContent` ativa a cada mudança de rota um overlay com mínimo de 300 ms, inclusive nas rotas `/interessesindico/*`. Isso atrasa a aparição da tela de sucesso.

## Arquivos a alterar (apenas 3)
1. `src/components/interesse-sindico-form/StepTermos.tsx`
2. `src/pages/InteresseSindicoSucesso.tsx`
3. `src/App.tsx`

## Plano de correção

### 1) Não apagar o formulário antes de navegar
Em `StepTermos.tsx`, dentro de `handleEnviar`:
- Remover a chamada `reset()` antes do `navigate(...)`.
- Manter `navigate(`/interessesindico/sucesso?protocolo=...`)` imediatamente após o submit OK.
- Manter watchdog, toasts e tratamento de erro intactos.

### 2) Resetar a store somente quando a tela de sucesso montar
Em `InteresseSindicoSucesso.tsx`:
- Importar `useSindicoFormStore`.
- Adicionar `useEffect(() => { useSindicoFormStore.getState().reset(); }, [])`.
- Resto da página intacto.

### 3) Estabilizar as rotas lazy do fluxo público
Em `src/App.tsx`:
- Adicionar 3 imports lazy estáveis no topo:
  - `const InteresseSindicoLanding = lazy(() => import('./pages/InteresseSindicoLanding'))`
  - `const InteresseSindicoFormulario = lazy(() => import('./pages/InteresseSindicoFormulario'))`
  - `const InteresseSindicoSucesso = lazy(() => import('./pages/InteresseSindicoSucesso'))`
- Trocar os `element` das 3 rotas para usarem esses componentes estáveis dentro do `Suspense` já existente.

### 4) Pular `PageTransitionLoader` nas rotas `/interessesindico/*`
Em `src/App.tsx`, na linha onde já existe `isInteresseSindicoRoute`:
- Renderizar `PageTransitionLoader` apenas quando `!isInteresseSindicoRoute`.
- Quando for rota de Interesse Síndico, renderizar o conteúdo direto, sem overlay de transição.

## O que NÃO será alterado
- Banco de dados, RLS, triggers
- Edge Functions (PDF já está OK)
- UI da landing, do formulário ou da tela de sucesso
- Qualquer outra rota, admin ou fluxo

## Diagrama
```text
Antes: submit OK -> reset() -> form vazio na tela -> navigate -> Suspense/transição atrasam -> usuário vê branco/formulário zerado

Depois: submit OK -> navigate -> Suspense direto (chunk em cache) -> sucesso monta -> reset() ali
```

## Validação
Após aplicar:
1. Preencher e enviar o formulário.
2. Confirmar:
   - `/interessesindico/sucesso?protocolo=...` aparece imediatamente.
   - O protocolo é exibido.
   - Em nenhum momento o formulário aparece zerado na tela anterior.
   - Nenhum overlay branco/intermediário pisca entre o submit e a tela de sucesso.

Aguardo aprovação para executar.