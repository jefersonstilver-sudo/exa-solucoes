

# Plano: Destaque visual no slot quando vídeo está carregado e pronto para envio

## Problema
Quando o vídeo é cortado e carregado no slot, a aparência permanece neutra (borda cinza, fundo branco). O usuário não percebe que o vídeo está pronto e que falta apenas preencher o título e clicar "Enviar".

## Mudança

### `src/components/video-management/VideoSlotUpload.tsx`

Quando `selectedFile` existe, alterar o container principal (linha 256) para ter destaque visual:

- **Borda**: de `border-gray-200` para `border-2 border-green-400`
- **Fundo**: de `bg-white/50` para `bg-green-50/60`
- **Info do arquivo** (linha 280): de `bg-white border` para `bg-green-100 border-green-300` com texto verde escuro
- Adicionar um badge/label pequeno "✓ Vídeo pronto" em verde acima do botão Enviar para reforçar que falta só o título + clique

A lógica é condicional: `selectedFile ? 'border-2 border-green-400 bg-green-50/60' : 'border border-gray-200 bg-white/50'`

### Arquivo editado
1. `src/components/video-management/VideoSlotUpload.tsx` — Classes condicionais no container e na área de info do arquivo

