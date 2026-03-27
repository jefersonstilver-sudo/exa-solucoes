

# Plano: Atualizar Texto do Resumo + Botão de Vídeo Demonstrativo

## Problema
O texto atual diz "até 4 vídeos" mas o correto é **10**. Além disso, falta destacar o grande diferencial: a flexibilidade de agendamento (dias, horários, promoções específicas). O cliente precisa entender que isso é um **novo canal de comunicação** — a nova revista digital.

## Mudanças

### 1. Corrigir `maxVideosPorPedido` de 4 para 10

**Arquivos:**
- `src/pages/public/PropostaPublicaPage.tsx` — linha 2002: `maxVideosPorPedido={10}`
- `src/components/public/proposal/ProposalSummaryText.tsx` — default de 4 para 10
- `src/components/admin/proposals/ProposalPDFExporter.tsx` — fallback de 4 para 10

### 2. Reescrever bloco Horizontal no `ProposalSummaryText.tsx`

Substituir o parágrafo genérico (linhas 72-78) por um bloco mais rico com 3 pontos de destaque:

- **Parágrafo principal**: "Faça upload de até **10 vídeos** e distribua sua comunicação como quiser — programe vídeos diferentes para segunda, terça, quarta, ou vários no mesmo dia em horários distintos."
- **Diferencial estratégico**: "É a nova revista digital do seu negócio: promoção no sábado, lançamento na segunda, QR Code com link direto na quarta. O cérebro do consumidor recebe sempre uma novidade, aumentando atenção e engajamento."
- **Mesma lógica para múltiplas posições**: atualizar com 10 vídeos × N posições

### 3. Adicionar botão "Ver como funciona" com vídeo demonstrativo

No `ProposalSummaryText.tsx`:

- Adicionar estado `useState` para controlar o player
- Copiar o vídeo `AMOSTRA_SITE.mp4` para o Supabase Storage (usar URL pública)
- Botão minimalista com ícone Play pulsando suavemente (`animate-pulse` com opacidade reduzida), texto "Veja como funciona o agendamento"
- Ao clicar, abre o `FullscreenVideoPlayer` (já existente no projeto) com fundo escuro e player quase tela cheia
- Estilo: borda slate, fundo branco, texto discreto, pulso sutil no ícone Play (CSS `animate-[pulse_2s_ease-in-out_infinite]` com escala mínima)

### 4. Atualizar PDF Exporter

Replicar o texto atualizado no `ProposalPDFExporter.tsx` para manter consistência entre proposta web e PDF exportado.

---

## Detalhes Técnicos

### Estrutura do novo bloco horizontal (sem múltiplas posições):

```text
→ Faça upload de até 10 vídeos e distribua como quiser...
→ É a nova revista digital: promoção no sábado, lançamento na segunda...
  [▶ Veja como funciona o agendamento]  ← botão com pulso sutil
```

### Vídeo:
O arquivo `AMOSTRA_SITE.mp4` será copiado para `public/videos/amostra-agendamento.mp4` e referenciado via path estático, pois é uma página pública que não requer autenticação Supabase.

### Componente do botão:
```tsx
<button onClick={() => setShowVideo(true)} className="...">
  <Play className="w-4 h-4 animate-[pulse_2s_ease-in-out_infinite]" />
  Veja como funciona o agendamento
</button>
```

### Arquivos editados:
1. `src/components/public/proposal/ProposalSummaryText.tsx` — texto + botão + player
2. `src/pages/public/PropostaPublicaPage.tsx` — `maxVideosPorPedido={10}`
3. `src/components/admin/proposals/ProposalPDFExporter.tsx` — texto atualizado
4. `public/videos/amostra-agendamento.mp4` — arquivo de vídeo copiado

