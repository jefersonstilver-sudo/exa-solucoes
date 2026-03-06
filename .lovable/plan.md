

# Plano: Corrigir botão "Salvar Alterações" transparente

## Problema
O botão "Salvar Alterações" na página de configurações está aparecendo transparente/invisível. A classe `bg-exa-red` usa `hsl(var(--exa-red))` que é definida corretamente, mas pode estar sendo sobrescrita pelo estilo base do componente `Button`.

## Solução
Forçar a cor de fundo e texto do botão com `!important` ou usar classes inline mais específicas para garantir visibilidade, independente do tema.

### Mudança em `src/pages/advertiser/AdvertiserSettings.tsx` (linha 239)

De:
```tsx
className="bg-exa-red hover:bg-exa-red/90 text-white min-h-[44px]"
```

Para:
```tsx
className="!bg-[#9C1E1E] hover:!bg-[#7a1818] !text-white min-h-[44px]"
```

Usar valores hex diretos com `!important` elimina qualquer conflito de especificidade com variáveis HSL ou estilos do componente Button.

## Arquivo alterado
- `src/pages/advertiser/AdvertiserSettings.tsx` — linha 239

