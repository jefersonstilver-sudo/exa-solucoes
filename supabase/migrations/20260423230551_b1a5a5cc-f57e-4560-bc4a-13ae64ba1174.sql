-- Audit columns for sindico confirmation email
ALTER TABLE public.sindicos_interessados
  ADD COLUMN IF NOT EXISTS email_confirmacao_enviado_em timestamptz NULL,
  ADD COLUMN IF NOT EXISTS email_confirmacao_message_id text NULL,
  ADD COLUMN IF NOT EXISTS email_confirmacao_erro text NULL;

COMMENT ON COLUMN public.sindicos_interessados.email_confirmacao_enviado_em IS
  'Quando o e-mail de confirmação com PDF foi enviado ao síndico via send-sindico-confirmation';
COMMENT ON COLUMN public.sindicos_interessados.email_confirmacao_message_id IS
  'ID retornado pelo Resend para o e-mail de confirmação';
COMMENT ON COLUMN public.sindicos_interessados.email_confirmacao_erro IS
  'Última mensagem de erro ao tentar enviar o e-mail de confirmação (NULL quando OK)';