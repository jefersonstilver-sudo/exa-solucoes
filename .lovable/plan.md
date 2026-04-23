

## Problema identificado

Os logs da edge function mostram o erro real:

```
NotFound: path not found: /var/tmp/sb-compile-edge-runtime/_shared/email-templates-html/sindico-confirmacao.html
```

A função quebra na linha 20, **antes** de chamar o Resend. Por isso:
- Nenhum email chega à sua caixa
- Nenhum log aparece no painel do Resend (a chamada nunca é feita)
- As colunas `email_confirmacao_enviado_em` / `_erro` ficam todas `null` no banco (a função foi disparada como "fire-and-forget" e a falha não foi persistida)

**Causa raiz:** o Supabase Edge Runtime empacota apenas arquivos de código (`.ts`/`.js`). Arquivos `.html` em `_shared/` **não são incluídos** no deploy, então `Deno.readTextFile()` falha em produção.

## Correção

**1. Inlinar o template HTML em um módulo TypeScript**
- Criar `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts` exportando o HTML como string template literal (mesmo conteúdo do `.html` atual)
- Remover a leitura de arquivo da edge function e passar a importar a constante diretamente

**2. Atualizar `supabase/functions/send-sindico-confirmation/index.ts`**
- Trocar `await Deno.readTextFile(...)` por `import { SINDICO_CONFIRMACAO_HTML } from '../_shared/email-templates-html/sindico-confirmacao.ts'`
- Manter toda a lógica de placeholders, anexo PDF (base64), Resend, idempotência e auditoria como está

**3. Tornar o disparo no frontend mais resiliente (sem mudar UX)**
- Em `src/utils/submitFormulario.ts`, manter o "fire-and-forget" para não bloquear a navegação, mas garantir que erros sejam ao menos logados no console do navegador (já está)

**4. Redeploy obrigatório**
- Deploy da função `send-sindico-confirmation` (sem isso, a correção não tem efeito)

**5. Reenviar os 5 emails que ficaram pendentes**
- Após o deploy, disparar manualmente a função para os protocolos EXA-2026-000003 a 000007 (todos têm `aceite_pdf_url` válido e nunca tiveram email enviado)
- Pode ser feito via botão "Reenviar e-mail" já existente na aba Gestão Interna do admin, ou via uma chamada em lote

## O que NÃO será alterado

- Template visual do email (mesmo HTML que você enviou)
- Fluxo do formulário, geração de PDF, página de sucesso
- Domínio remetente (`contato@examidia.com.br` via Resend)
- Estrutura da tabela `sindicos_interessados`

## Arquivos afetados

- **Criar:** `supabase/functions/_shared/email-templates-html/sindico-confirmacao.ts` (HTML como string exportada)
- **Editar:** `supabase/functions/send-sindico-confirmation/index.ts` (trocar leitura de arquivo por import)
- **Deletar:** `supabase/functions/_shared/email-templates-html/sindico-confirmacao.html` (não funciona em runtime, fica como referência morta)
- **Deploy:** `send-sindico-confirmation`
- **Ação pós-deploy:** reenvio dos 5 protocolos pendentes

Aprova para eu executar?

