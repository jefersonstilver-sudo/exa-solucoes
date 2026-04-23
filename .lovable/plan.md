

## Correção: PDF, e-mail e prevenção de spam

### 1. Logo do PDF (oficial e maior)

**Arquivo:** `supabase/functions/gerar-pdf-aceite-sindico/index.ts`

- Remover o `LOGO_B64` placeholder de ~415 bytes (gera o "quadradinho" vermelho minúsculo).
- Buscar a logo oficial **na hora de gerar** (cacheada em memória), via `fetch` da URL pública já usada em todo o site:
  `https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png`
- Se o fetch falhar (offline), cair num fallback texto "EXA MÍDIA" em branco bold — sem quebrar o PDF.
- Ajustar `drawHeader`: aumentar `targetH` de **22 → 36px** e re-centralizar verticalmente. O header continua com 56px de altura, mas a logo ocupará proporção visualmente reconhecível (~64% da faixa).
- Manter o divisor + texto "INDEXA MÍDIA LTDA" do lado.

### 2. Logo do e-mail (corrompida → URL pública)

**Arquivo:** `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts`

- Remover o `data:image/png;base64,iVBORw0...` enorme (está corrompido e por isso o Gmail mostra "imagem quebrada").
- Substituir por `<img src="https://aakenoljsycyrcrchgxj.supabase.co/storage/v1/object/public/arquivos/logo%20e%20icones/Publicidade%20Inteligente%20(800%20x%20800%20px).png" width="44" height="44" alt="EXA Mídia" style="display:block; border:0;" />` (a URL é **pública**, sem token, ideal para e-mail).
- Adicionar ao lado do logo o texto "EXA MÍDIA" em branco/bold como reforço caso o cliente bloqueie imagens (Outlook por padrão bloqueia).

### 3. Aviso de spam + táticas anti-spam (corporativo sério)

**3a. Aviso visível no corpo do e-mail** (`sindico-confirmacao.ts`):
- Inserir antes do bloco "O que acontece agora" um card amarelo-claro discreto:
  > 📬 **Não está vendo nossos próximos contatos?** Verifique sua caixa de **Spam / Lixo Eletrônico** e marque `contato@examidia.com.br` como **remetente confiável** ou adicione aos seus contatos. Isso garante que aprovação, contratos e comunicações cheguem sem atraso.

**3b. Aviso na página de sucesso** (`src/pages/InteresseSindicoSucesso.tsx`):
- Adicionar abaixo do parágrafo de "48 horas úteis" um bloco discreto:
  > "Já enviamos um e-mail de confirmação. **Não esqueça de verificar sua caixa de spam** e marcar `contato@examidia.com.br` como remetente confiável."

**3c. Melhorias técnicas anti-spam na edge function `send-sindico-confirmation/index.ts`:**
- Adicionar headers Resend que melhoram pontuação:
  - `reply_to: 'contato@examidia.com.br'` (resposta humana, não no-reply)
  - `headers: { 'List-Unsubscribe': '<mailto:contato@examidia.com.br?subject=Unsubscribe>', 'X-Entity-Ref-ID': protocolo }`
  - `tags: [{ name: 'category', value: 'sindico-confirmation' }]`
- Garantir que o **From** seja `EXA Mídia <contato@examidia.com.br>` (nome amigável + e-mail corporativo verificado, não `onboarding@resend.dev`).
- Adicionar **versão texto plano** (`text:`) no payload — e-mails só-HTML têm pontuação maior de spam. Texto curto resumindo o protocolo + próximos passos.
- Manter o anexo PDF (já temos), pois aumenta legitimidade.
- Subject com protocolo: `"Registro recebido • Protocolo {{PROTOCOLO}} • EXA Mídia"` (palavra-chave clara, sem CAPS, sem !!! ou $).

### 4. Reenvio dos e-mails afetados

Após deploy:
- Reenviar e-mail para o protocolo `EXA-2026-000002` (último teste da tela) usando o botão "Reenviar e-mail" da aba Gestão Interna ou via `force_regenerate` no edge function.
- O PDF dos protocolos antigos **não será regenerado automaticamente** (idempotência protege). Se quiser atualizar a logo nos PDFs já existentes, preciso disparar `gerar-pdf-aceite-sindico` com `force_regenerate: true` para cada um (posso fazer isso pós-deploy se aprovar).

### Arquivos afetados

- **Editar:** `supabase/functions/gerar-pdf-aceite-sindico/index.ts` (logo oficial + tamanho)
- **Editar:** `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts` (logo via URL + bloco de aviso de spam)
- **Editar:** `supabase/functions/send-sindico-confirmation/index.ts` (reply_to, List-Unsubscribe, text plain, subject com protocolo)
- **Editar:** `src/pages/InteresseSindicoSucesso.tsx` (aviso "verifique spam")
- **Deploy:** `gerar-pdf-aceite-sindico`, `send-sindico-confirmation`
- **Pós-deploy:** reenviar e-mail do protocolo EXA-2026-000002 e (opcionalmente) regenerar PDFs antigos

### O que NÃO será alterado

- Layout geral do PDF (texto, seções, rodapé) — só a logo do header.
- Estrutura do template de e-mail — só a logo, o aviso de spam e melhorias de header SMTP.
- Domínio remetente, fluxo do formulário, página de sucesso (estrutura).
- Tabela `sindicos_interessados`.

Aprova para eu executar?

