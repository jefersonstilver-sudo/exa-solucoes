

# Plano: Botao de download do video original

## Mudanca

Adicionar um botao minimalista (icone Download) no canto superior direito da area de preview do video (ao lado oposto do badge de Slot) em `ProfessionalOrderReport.tsx`.

### `src/components/admin/orders/ProfessionalOrderReport.tsx`

1. Adicionar `Download` ao import do lucide-react (linha 2)
2. Na area de preview do video (linha 898-905), apos o badge de Slot, adicionar um botao no `top-2 right-2`:
   - Icone `Download` pequeno (h-4 w-4) com fundo semi-transparente (`bg-black/60 hover:bg-black/80 text-white`)
   - `onClick`: cria um `<a>` temporario com `href=video.video_data.url`, `download=video.video_data.nome + '.mp4'`, e dispara `.click()` para forcar o download com o nome original do arquivo
   - Visivel apenas quando `video.video_data?.url` existe

### Arquivo editado
1. `src/components/admin/orders/ProfessionalOrderReport.tsx`

