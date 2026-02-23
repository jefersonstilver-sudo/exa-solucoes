
# Adicionar Botao Play de Amostra no ProductShowcaseCard

## O que sera feito

Abaixo da imagem do mockup (telinha) no card de produto, adicionar um botao minimalista "Ver amostra" com icone de play. Ao clicar, a pagina escurece/desfoca e abre um player fullscreen com o video de amostra.

## Implementacao

### Arquivo: `src/components/public/proposal/ProductShowcaseCard.tsx`

1. Adicionar estado `showSampleVideo` (boolean)
2. Importar `Play` do lucide-react e o `FullscreenVideoPlayer` existente
3. Abaixo da `<img>` do mockup (linha 70), inserir um botao minimalista:
   - Estilo: borda fina cinza, texto pequeno, icone Play, rounded-full
   - Texto: "Ver amostra"
   - Visual premium: bg-white, border border-gray-200, hover com shadow sutil
4. Ao clicar, seta `showSampleVideo = true`
5. Renderizar o `FullscreenVideoPlayer` (ja existente em `src/components/paineis-landing/FullscreenVideoPlayer.tsx`) com a URL do video de amostra
6. URL do video de amostra sera uma constante fixa no componente

### Layout visual

```text
+------------------------------------------+
|  [Mockup Image]     VERTICAL PREMIUM     |
|                     Seu produto...       |
|  [ > Ver amostra]   15 segundos          |
|                     Ate 3 empresas...    |
+------------------------------------------+
```

O botao fica centralizado abaixo do mockup, dentro do mesmo container da imagem.

### Detalhes tecnicos

- Reutiliza o componente `FullscreenVideoPlayer` que ja faz: overlay escuro (bg-black/95), controles play/pause/mute, fechar com ESC e botao X
- A URL do video de amostra sera hardcoded como constante (signed URL com expiracao longa)
- Nenhuma alteracao em outros arquivos necessaria - apenas `ProductShowcaseCard.tsx`
