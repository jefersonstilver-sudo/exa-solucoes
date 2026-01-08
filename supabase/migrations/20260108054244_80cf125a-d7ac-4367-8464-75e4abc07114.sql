-- =============================================
-- SISTEMA DE E-MAIL ZOHO - FASE 3 (CORRIGIDO)
-- =============================================

-- Tabela de threads de e-mail
CREATE TABLE IF NOT EXISTS public.email_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_thread_id TEXT UNIQUE,
  subject TEXT NOT NULL,
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  participants TEXT[] DEFAULT '{}',
  last_message_at TIMESTAMPTZ DEFAULT now(),
  message_count INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela principal de e-mails
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_message_id TEXT UNIQUE,
  thread_id UUID REFERENCES public.email_threads(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT NOT NULL,
  to_name TEXT,
  cc TEXT[],
  bcc TEXT[],
  subject TEXT NOT NULL,
  body_preview TEXT,
  body_html TEXT,
  body_text TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  client_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  venda_id UUID REFERENCES public.vendas(id) ON DELETE SET NULL,
  campanha_id UUID,
  usuario_origem_id UUID,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]',
  labels TEXT[] DEFAULT '{}',
  categoria TEXT CHECK (categoria IN ('comercial', 'financeiro', 'marketing', 'suporte', 'geral')),
  received_at TIMESTAMPTZ DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de sincronização de e-mail
CREATE TABLE IF NOT EXISTS public.email_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_message_id TEXT,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  messages_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_emails_client_id ON public.emails(client_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread_id ON public.emails(thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_direction ON public.emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON public.emails(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_from_email ON public.emails(from_email);
CREATE INDEX IF NOT EXISTS idx_emails_to_email ON public.emails(to_email);
CREATE INDEX IF NOT EXISTS idx_emails_categoria ON public.emails(categoria);
CREATE INDEX IF NOT EXISTS idx_emails_usuario_origem ON public.emails(usuario_origem_id);
CREATE INDEX IF NOT EXISTS idx_emails_is_read ON public.emails(is_read);
CREATE INDEX IF NOT EXISTS idx_email_threads_client ON public.email_threads(client_id);
CREATE INDEX IF NOT EXISTS idx_email_threads_last_message ON public.email_threads(last_message_at DESC);

-- RLS Policies
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sync_status ENABLE ROW LEVEL SECURITY;

-- Políticas para emails
CREATE POLICY "Admins podem ver todos os emails"
  ON public.emails FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Usuários podem ver emails onde são origem"
  ON public.emails FOR SELECT
  TO authenticated
  USING (usuario_origem_id = auth.uid());

CREATE POLICY "Admins podem inserir emails"
  ON public.emails FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin', 'gerente', 'vendedor')
    )
  );

CREATE POLICY "Admins podem atualizar emails"
  ON public.emails FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
    OR usuario_origem_id = auth.uid()
  );

-- Políticas para threads
CREATE POLICY "Admins podem ver todas as threads"
  ON public.email_threads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins podem gerenciar threads"
  ON public.email_threads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Políticas para sync status
CREATE POLICY "Admins podem ver sync status"
  ON public.email_sync_status FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_emails_updated_at
  BEFORE UPDATE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at
  BEFORE UPDATE ON public.email_threads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_sync_status_updated_at
  BEFORE UPDATE ON public.email_sync_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para atualizar contagem de mensagens na thread (apenas INSERT)
CREATE OR REPLACE FUNCTION public.update_thread_message_count_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.thread_id IS NOT NULL THEN
    UPDATE public.email_threads
    SET 
      message_count = message_count + 1,
      last_message_at = NEW.received_at
    WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar contagem de mensagens na thread (apenas DELETE)
CREATE OR REPLACE FUNCTION public.update_thread_message_count_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.thread_id IS NOT NULL THEN
    UPDATE public.email_threads
    SET message_count = message_count - 1
    WHERE id = OLD.thread_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_thread_count_insert
  AFTER INSERT ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_message_count_insert();

CREATE TRIGGER trg_update_thread_count_delete
  AFTER DELETE ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.update_thread_message_count_delete();

-- Função para gerar tarefa quando e-mail importante chega
CREATE OR REPLACE FUNCTION public.gerar_tarefa_email_importante()
RETURNS TRIGGER AS $$
BEGIN
  -- Gerar tarefa para e-mails inbound não lidos
  IF NEW.direction = 'inbound' AND NEW.is_read = false THEN
    INSERT INTO public.notion_tasks (
      title,
      description,
      priority,
      status,
      due_date
    ) VALUES (
      'Responder e-mail: ' || LEFT(NEW.subject, 50),
      'E-mail de ' || COALESCE(NEW.from_name, NEW.from_email) || ' recebido em ' || to_char(NEW.received_at, 'DD/MM/YYYY HH24:MI'),
      'medium',
      'pending',
      (now() + interval '1 day')::date
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_email_gera_tarefa
  AFTER INSERT ON public.emails
  FOR EACH ROW
  EXECUTE FUNCTION public.gerar_tarefa_email_importante();