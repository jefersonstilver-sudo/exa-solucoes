

# Plano: Corrigir logo_scale resetando após salvar

## Problema
Em `handleSave` (linha 196-198), após `updateUser({ data: { logo_scale } })`, `loadCompanyData()` é chamado imediatamente. Dentro de `loadCompanyData`, `getUser()` pode retornar dados desatualizados (cache ou propagação do auth server), fazendo o `setLogoScale` na linha 91 sobrescrever o valor recém-salvo com o valor antigo.

## Solução
Preservar o valor atual de `logoScale` após o save, evitando que `loadCompanyData` o sobrescreva.

### Arquivo: `src/components/settings/CompanyBrandSection.tsx`

1. **Linha 90-91**: Mudar `loadCompanyData` para aceitar um parâmetro opcional `skipScaleReload` e, quando `true`, não sobrescrever o `logoScale`:

```tsx
const loadCompanyData = async (skipScaleReload = false) => {
  // ... existing code ...
  // Load logo scale from user_metadata
  if (!skipScaleReload) {
    const scale = user.user_metadata?.logo_scale;
    if (typeof scale === 'number') setLogoScale(scale);
  }
};
```

2. **Linha 198**: Passar `true` ao chamar após o save:
```tsx
await loadCompanyData(true);
```

Isso garante que o valor do slider é preservado após salvar, sem afetar o carregamento inicial.

