## QR Rastreável por Vídeo — Captação de Dados

Adicionar, em cada slot de vídeo da tela de Gestão de Vídeos do anunciante (`/anunciante/pedido/:id`), os controles para o cliente solicitar um QR Code rastreável. Esta etapa apenas **capta as informações** — o backend externo gera/renderiza o QR posteriormente.

### Comportamento da UI (em cada VideoSlotCard com vídeo enviado)

1. Checkbox "Adicionar QR rastreável".
2. Quando marcado, expande:
   - Input de texto: "Link de redirecionamento" (validação de URL com zod, max 2048 chars).
   - Botão "Selecionar localização do QR no vídeo" — por enquanto abre um modal placeholder informando que o seletor visual (shadow sobre o vídeo, captura do centro em pixels) será disponibilizado em breve. Deixa o ponto `{ x, y }` como `null` até lá.
3. Botão "Salvar QR" persiste; "Remover QR" limpa.
4. Badge discreto no card quando o QR estiver configurado.

### Persistência

Coluna nova `qr_config jsonb` em `pedido_videos` (escolha do usuário). Estrutura:

```json
{
  "enabled": true,
  "redirect_url": "https://...",
  "position": { "x": 320, "y": 480 },   // null enquanto o seletor visual não existe
  "updated_at": "2026-05-05T..."
}
```

- Migração: `ALTER TABLE pedido_videos ADD COLUMN qr_config jsonb;`
- RLS já existente em `pedido_videos` cobre acesso (cliente dono do pedido).
- Sem trigger, sem nova tabela.

### Frontend — arquivos a tocar

- `src/components/video-management/VideoSlotCard.tsx` — renderizar o bloco "QR rastreável" abaixo do bloco do vídeo (apenas quando `slot.video_data` existe e status ≠ `rejected`).
- Novo `src/components/video-management/VideoQRConfig.tsx` — encapsula checkbox + input + botão de localização + persistência via `supabase.from('pedido_videos').update({ qr_config }).eq('id', slot.id)`.
- `src/types/videoManagement.ts` — adicionar tipo `qr_config?: VideoQRConfig` no `VideoSlot`.
- `src/services/videoSlotService.ts` — incluir `qr_config` no SELECT já existente para hidratar o slot.

### O que NÃO está no escopo agora

- Geração do QR (responsabilidade do backend externo).
- Seletor visual de posição em pixels (entra em fase posterior; reservamos o campo `position`).
- Painel admin para visualizar/aprovar (pode vir depois).
- Telemetria de scans (a API externa decide).

### Validação

- `redirect_url` validado com `z.string().url().max(2048)`.
- Toast de sucesso/erro no salvar.
- Sem alterações em fluxos existentes (upload, agendamento, aprovação).
