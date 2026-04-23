# Plano — E-mail de confirmação ao síndico (com PDF jurídico anexo)

## Diagnóstico

Hoje, ao concluir o aceite, o sistema **grava no banco e gera o PDF jurídico** no storage `termos-sindicos`, mas **não envia nenhum e-mail ao síndico**. Não há "template atual" para substituir — vamos criar o envio pela primeira vez, usando o HTML que você anexou (`04-email-template-sindico-FINAL.html`) como template oficial.

## Escopo

1. **Salvar o template HTML no projeto** em `supabase/functions/_shared/email-templates-html/sindico-confirmacao.html` (com placeholders `{{PROTOCOLO}}`, `{{PRIMEIRO_NOME}}`, `{{NOME_PREDIO}}`, `{{DATA_REGISTRO}}`).

2. **Criar nova edge function** `send-sindico-confirmation` que:
   - Recebe `{ sindico_interessado_id }`.
   - Carrega o registro de `sindicos_interessados` (e-mail, nome, prédio, protocolo, data, `aceite_pdf_url`).
   - Carrega o HTML do template, faz replace dos placeholders.
   - Baixa o PDF de `termos-sindicos/<aceite_pdf_url>` (Supabase Storage admin), converte para base64.
   - Envia via **Resend** (padrão já usado pelo projeto em `send-confirmation-email`, `send-welcome-email`, etc.) com:
     - `from`: remetente padrão da EXA já usado nas outras funções
     - `to`: e-mail do síndico
     - `subject`: `EXA-XXXX-XXXXXX · Registro de interesse recebido`
     - `html`: template renderizado
     - `attachments`: `[{ filename: 'termo-<protocolo>.pdf', content: <base64> }]`
   - Marca `email_confirmacao_enviado_em = now()` na tabela (idempotência: se já enviado, retorna sem reenviar — exceto se `force=true`).
   - Retorna `{ success, message_id }`.

3. **Adicionar coluna de auditoria** em `sindicos_interessados`:
   - `email_confirmacao_enviado_em timestamptz NULL`
   - `email_confirmacao_message_id text NULL`
   (migração simples, sem afetar nada existente).

4. **Disparar a função após o PDF ser gerado** em `src/utils/submitFormulario.ts`:
   - Logo após o bloco de PDF (linha ~156, quando `pdfPath` é definido), invocar `supabase.functions.invoke('send-sindico-confirmation', { body: { sindico_interessado_id: recordId } })` em **fire-and-forget** (sem `await` bloqueante e com timeout curto, mesmo padrão do PDF) para não atrasar a tela de sucesso.
   - Se o PDF não saiu no tempo (timeout), a função ainda assim será tentada — ela própria valida se `aceite_pdf_url` existe e, se não, agenda retry leve (ou retorna erro silencioso).

5. **Botão de reenvio manual no admin** (`TabGestaoInterna.tsx`): adicionar botão "Reenviar e-mail de confirmação" ao lado de "Regenerar PDF", chamando a função com `force: true`. **Mudança mínima, isolada — não altera nada do que já existe na aba.**

## O que NÃO toco

- Fluxo do formulário, validação, store, navegação, página de sucesso.
- `gerar-pdf-aceite-sindico` (continua igual).
- `submit-sindico-lead` (função antiga do `/contato` e `/sou-sindico`, fluxo paralelo).
- Outras edge functions de e-mail.
- UI do formulário, design, layout.

## Detalhe técnico

- **Provider**: Resend, via `RESEND_API_KEY` já existente no projeto (mesmo segredo usado em `send-welcome-email` etc.). Sem novo segredo.
- **Anexo PDF**: tamanho típico < 200 KB → base64 inline no payload Resend está OK (limite 40 MB).
- **CORS**: padrão das funções existentes.
- **Pinning Supabase**: `@supabase/supabase-js@2.49.4` (memória do projeto).
- **Idempotência**: `email_confirmacao_enviado_em IS NOT NULL` → não reenvia salvo `force=true`.
- **Falhas**: erro de envio é logado, mas **não derruba** a experiência do usuário (a tela de sucesso já apareceu). Admin vê no `TabGestaoInterna` se foi enviado ou não, e pode reenviar.

## Arquivos tocados

| Arquivo | Ação |
|---|---|
| `supabase/functions/_shared/email-templates-html/sindico-confirmacao.html` | CRIAR (cópia exata do HTML enviado) |
| `supabase/functions/send-sindico-confirmation/index.ts` | CRIAR |
| `src/utils/submitFormulario.ts` | EDITAR (adicionar invoke fire-and-forget após PDF) |
| `src/components/admin/sindicos-interessados/tabs/TabGestaoInterna.tsx` | EDITAR (botão "Reenviar e-mail") |
| Migração SQL | CRIAR (2 colunas em `sindicos_interessados`) |

## Validação após executar

1. Submeter um aceite de teste no formulário.
2. Verificar que a tela de sucesso aparece imediatamente (sem regressão).
3. Em segundos, o e-mail chega no inbox do síndico com o PDF anexo, design idêntico ao HTML enviado, placeholders substituídos.
4. No admin, na aba "Gestão Interna" do registro, ver "E-mail enviado em: <data>" e botão de reenvio funcional.

Aprova para eu executar?
