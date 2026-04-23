

# Correção do 404 em `/interessesindico/formulario`

## Confirmações solicitadas

1. **Landing `/interessesindico` está em `src/App.tsx` linha 233–237** (lazy + Suspense + `GlobalLoadingPage`).
2. **A nova rota `/interessesindico/formulario` será adicionada imediatamente abaixo (linha 238)**, na mesma região, seguindo o mesmo padrão de lazy + Suspense.

## Alterações

### 1. `src/App.tsx` (linhas 232–240)
Inserir a rota do formulário logo abaixo da landing:

```tsx
{/* FORMULÁRIO PÚBLICO - Interesse do Síndico (sem auth) */}
<Route path="/interessesindico/formulario" element={
  <Suspense fallback={<GlobalLoadingPage message="Carregando formulário..." />}>
    {React.createElement(lazy(() => import('./pages/InteresseSindicoFormulario')))}
  </Suspense>
} />
```

### 2. `src/routes/index.tsx`
Defesa em profundidade — adicionar antes do fallback `/*`:

```tsx
const InteresseSindicoFormulario = React.lazy(() => import('@/pages/InteresseSindicoFormulario'));
// ...
<Route path="/interessesindico/formulario" element={<InteresseSindicoFormulario />} />
```

### 3. `src/routes/PublicRoutes.tsx`
Manter a rota como está (sem efeito colateral, mesmo órfão).

## Verificações pós-execução

1. Acessar `/interessesindico/formulario` direto pela URL → deve carregar o formulário.
2. Clicar em "Registrar interesse" na landing → deve navegar para o formulário.
3. Confirmar que `/interessesindico` continua funcionando.
4. Reportar qualquer erro/warning de console.

## Garantias

- Sem alteração da landing, do formulário ou de qualquer outra rota.
- Sem alteração de UI, estilos, banco ou lógica.
- Apenas 2 linhas de registro de rota adicionadas.

