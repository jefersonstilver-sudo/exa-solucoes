
Diagnóstico confirmado: as mudanças não estão implementadas no código atual. O print que você enviou bate exatamente com o estado do repositório.

O que verifiquei:
- `src/components/public/proposal/ProposalSummaryText.tsx` ainda está com:
  - fallback `maxVideosPorPedido = 4`
  - texto antigo “até 4 vídeos diferentes”
  - sem botão de play
  - sem `FullscreenVideoPlayer`
- `src/pages/public/PropostaPublicaPage.tsx` ainda passa `maxVideosPorPedido={4}`
- `src/components/admin/proposals/ProposalPDFExporter.tsx` ainda usa `proposal.max_videos_por_pedido || 4` e mantém o texto antigo
- não existe referência a `amostra-agendamento.mp4` no projeto atual
- o componente `FullscreenVideoPlayer` existe e pode ser reutilizado sem alterar o fluxo atual

Como resolver com segurança, sem mexer em nada fora do escopo:

1. Corrigir a origem do número de vídeos
- Trocar o valor passado em `PropostaPublicaPage.tsx` de `4` para `10`
- Trocar os fallbacks locais de `4` para `10` em:
  - `ProposalSummaryText.tsx`
  - `ProposalPDFExporter.tsx`
- Assim a proposta pública e o PDF ficam coerentes mesmo se o campo não vier preenchido

2. Reescrever apenas o bloco horizontal do resumo
- Manter intacto:
  - layout do card
  - métricas
  - bloco vertical premium
  - venda futura
  - fluxo geral da página
- Substituir só o texto horizontal por uma versão mais forte e clara:
  - até 10 vídeos por pedido
  - liberdade para distribuir por dias e horários
  - exemplos práticos: segunda, terça, quarta; promoções de sábado/domingo
  - conceito “nova revista digital”
  - QR Codes e campanhas segmentadas

3. Adicionar o botão de demonstração dentro do resumo
- Inserir no próprio `ProposalSummaryText.tsx`
- Botão discreto, minimalista, com leve pulsação
- Texto sugerido: “Veja como funciona o agendamento”
- Ao clicar, abrir o `FullscreenVideoPlayer` já existente
- Isso resolve sem criar fluxo novo nem alterar outras áreas da proposta

4. Conectar o vídeo corretamente
- Como o arquivo hoje não existe no projeto, ele precisa ser adicionado em:
  - `public/videos/amostra-agendamento.mp4`
- O player abrirá esse caminho público:
  - `/videos/amostra-agendamento.mp4`
- Isso evita dependência de storage, autenticação ou URL assinada

5. Atualizar o PDF para refletir o mesmo discurso comercial
- Ajustar somente o trecho equivalente do resumo executivo em `ProposalPDFExporter.tsx`
- Garantir consistência entre:
  - proposta pública
  - PDF exportado
- Sem alterar paginação, layout ou demais seções do PDF

6. Verificação final após implementar
- Conferir na rota pública atual que:
  - não aparece mais “4 vídeos”
  - aparece “até 10 vídeos”
  - o botão de play está visível
  - o modal escuro abre corretamente
  - o vídeo reproduz
- Conferir que o PDF exportado também usa o novo texto

Arquivos que precisam ser alterados:
- `src/components/public/proposal/ProposalSummaryText.tsx`
- `src/pages/public/PropostaPublicaPage.tsx`
- `src/components/admin/proposals/ProposalPDFExporter.tsx`

Arquivo que precisa ser adicionado:
- `public/videos/amostra-agendamento.mp4`

Causa mais provável do erro anterior:
- as respostas anteriores afirmaram implementação, mas o estado real do repositório não contém essas mudanças; ou elas não foram persistidas, ou foram sobrescritas depois. O caminho correto agora é reaplicar diretamente nesses 3 arquivos e no asset do vídeo, depois validar na mesma página pública que você está usando.
