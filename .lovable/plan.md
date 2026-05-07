## Objetivo

Transformar a tela `/anunciante/qr-codes` numa visão organizada e minimalista, onde os scans de QR Code são agrupados em **3 níveis hierárquicos**:

```
PEDIDO (campanha contratada)
 └─ VÍDEO (cada vídeo do pedido)
     └─ PRÉDIOS (ranking de onde foi escaneado, incluindo os com 0 scans)
```

## O que é dado real (e só isso entra na tela)

**Da API de QR Code (`qrcode-logs-proxy`):** apenas `nome_cliente` (prédio), `titulo` (vídeo), `link`, `data_hora`. Nada de demografia ou dispositivo.

**Do Supabase:**
- `pedidos` → `id`, `data_inicio`, `data_fim`, `status`, `lista_predios`, `plano_meses`
- `pedido_videos` → liga pedido ↔ vídeos
- `videos` → `nome`, `url`, `created_at` (idade real), `duracao`, `orientacao`
- `buildings` → `nome`, `bairro`, foto

## Estrutura visual de cada Card de Pedido

```text
┌──────────────────────────────────────────────────────────────────┐
│  Pedido #a3f2c1 · 15/03/2026 → 15/06/2026         ● ATIVO        │
│  3 meses · 10 prédios contratados                                 │
│                                                                    │
│  ┌────────────┬────────────┬─────────────┬──────────────┐         │
│  │  20 scans  │ há 2h      │  4 / 10     │  40% alcance │         │
│  │  no pedido │ último     │ prédios c/  │ dos prédios  │         │
│  │            │ scan       │ scan        │ contratados  │         │
│  └────────────┴────────────┴─────────────┴──────────────┘         │
│                                                                    │
│  ── Vídeos deste pedido ──                                         │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ [thumb] Teste Qr                                          │     │
│  │         ⏱ 47 dias no sistema · subido 21/03               │     │
│  │                                                            │     │
│  │         12 scans · último há 2h                           │     │
│  │                                                            │     │
│  │         Onde foi escaneado:                                │     │
│  │           Residencial Miró ........ 8  ████████░░  67%   │     │
│  │           SALA REUNIÃO ............ 4  ████░░░░░░  33%   │     │
│  │           ─── sem scans ainda (8) ───                      │     │
│  │           Edifício Centro, Park, Vista, ... ▾              │     │
│  │                                                            │     │
│  │         ▸ Linha do tempo dos 12 scans                     │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │ [thumb] WIZARD                                            │     │
│  │         ⏱ 12 dias no sistema                              │     │
│  │         8 scans · último há 1d                            │     │
│  │         ... (mesma estrutura)                             │     │
│  └──────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
```

## Regras de agrupamento

1. **Buscar pedidos do cliente logado** (`pedidos.client_id = userId`), com seus vídeos (`pedido_videos` + `videos`) e seus prédios (`lista_predios` + `buildings`).
2. **Buscar logs da API QR** dos `cliente_ids` derivados de todos os prédios do cliente.
3. **Casar scan ↔ vídeo ↔ pedido** com 2 condições:
   - `log.titulo` (normalizado) bate com `video.nome` do pedido
   - `log.data_hora` está entre `pedido.data_inicio` e `pedido.data_fim` (evita misturar pedido novo com pedido antigo do mesmo vídeo)
4. **Casar scan ↔ prédio** pelo `nome_cliente` (que é derivado do `building.id`).
5. **Ranking de prédios**: para cada vídeo, listar **todos os prédios do pedido**, ordenados por nº de scans (desc). Mostrar inclusive os com 0 scans (separador visual "sem scans ainda" + collapse se forem muitos).

## Indicador de idade do vídeo (semáforo)

Calculado a partir de `videos.created_at`:
- 0–30 dias → slate neutro · "Recente"
- 31–60 dias → âmbar · "Considere renovar"
- 60+ dias → vermelho suave · "Vídeo antigo — performance pode cair"

## Filtros (topo da página)

- Busca por título (já existe — manter)
- Filtro por prédio (já existe — manter)
- Adicionar: filtro por **status do pedido** (Ativo / Encerrado / Todos)
- Ordenação: Mais scans / Mais recente / Mais antigo

## Linha do tempo de scans (drawer/accordion)

Quando o usuário clica em "Ver linha do tempo", abre lista agrupada por dia:
```
Hoje
  14:49  → Residencial Miró
  10:22  → Residencial Miró
Ontem
  17:12  → SALA REUNIÃO
```

## Detalhes técnicos

- Arquivo único editado: `src/pages/advertiser/QrCodesRastreaveis.tsx`
- Buscar `pedidos`, `pedido_videos`, `videos`, `buildings` já filtrados por `client_id` do usuário
- Construir uma estrutura em memória `Pedido[] → videos[] → prediosRanking[]` antes do render
- Reaproveitar a chamada existente ao `qrcode-logs-proxy` (sem mudar o edge function)
- Componentes shadcn já existentes: `Card`, `Badge`, `Collapsible`, `Progress` (para barras do ranking)
- Estilo: glassmorphism EXA, sem verde, EXA Red para destaques, slate para neutros
- Mobile: card vira coluna única, métricas em grid 2x2, ranking ocupa largura total

## O que NÃO entra (dado inexistente)

- CTR, taxa de conversão, dispositivo, geolocalização do scanner, demografia — a API não devolve.

## Resultado esperado

O anunciante abre a tela e enxerga, em segundos:
1. Quais pedidos (campanhas) estão rodando
2. Quais vídeos performam dentro de cada pedido
3. **Em quais prédios o público está realmente engajando** vs. quais foram contratados mas estão "mortos"
4. Quanto tempo o vídeo já está no ar (sinal de cansaço criativo)