## Ajuste: Mostrar apenas vídeos com QR Code Rastreável habilitado

O campo que indica se o vídeo foi marcado como QR rastreável no upload é **`pedido_videos.qr_config.enabled`** (jsonb). Exemplo real do banco:

```json
{ "enabled": true, "redirect_url": "https://...", "position": {...} }
```

## Mudança em `src/pages/advertiser/QrCodesRastreaveis.tsx`

No `useEffect` que carrega os pedidos:

1. Adicionar `qr_config` à query de `pedido_videos`:
   ```ts
   .select('pedido_id, qr_config, videos(id, nome, url, created_at)')
   ```

2. Ao montar `videosByPedido`, **filtrar** vídeos cujo `qr_config.enabled !== true` — eles não entram na lista.

3. Ao montar a lista final de `Pedido[]`, **descartar pedidos sem nenhum vídeo com QR rastreável** (`videos.length === 0`).

## Resultado

- Vídeos sem QR rastreável marcado simplesmente não aparecem.
- Pedidos cujos vídeos não têm QR rastreável também somem da lista (não polui).
- Métricas globais (Total Scans / Pedidos Ativos / Prédios Engajados) já são calculadas em cima desse dataset filtrado, então ficam coerentes automaticamente.