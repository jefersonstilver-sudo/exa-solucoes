-- ============================================================
-- CONTACT HUB ENTERPRISE - FASE 1: CORREÇÕES DE BANCO DE DADOS
-- ============================================================

-- 1. Adicionar campos faltantes na tabela contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ticket_estimado DECIMAL(10,2);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS satisfacao INTEGER CHECK (satisfacao >= 1 AND satisfacao <= 5);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS total_investido DECIMAL(12,2) DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS dias_sem_contato INTEGER DEFAULT 0;

-- 2. Corrigir configuração de pontuação - Anunciante NÃO deve ter pontuação
UPDATE contact_scoring_config 
SET pontuacao_ativa = false 
WHERE categoria = 'anunciante';

-- 3. Criar tabela de auditoria de contatos
CREATE TABLE IF NOT EXISTS contact_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'merged', 'blocked', 'unblocked')),
  changed_fields JSONB,
  old_values JSONB,
  new_values JSONB,
  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_audit_contact_id ON contact_audit_logs(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_audit_created_at ON contact_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_conversation_id ON contacts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contacts_telefone ON contacts(telefone);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_cnpj ON contacts(cnpj);

-- 5. Habilitar RLS na tabela de auditoria
ALTER TABLE contact_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. Política de leitura - apenas usuários autenticados podem ver
CREATE POLICY "Authenticated users can view audit logs"
ON contact_audit_logs
FOR SELECT
TO authenticated
USING (true);

-- 7. Política de inserção - apenas usuários autenticados podem criar logs
CREATE POLICY "Authenticated users can insert audit logs"
ON contact_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. Função para registrar auditoria automaticamente
CREATE OR REPLACE FUNCTION log_contact_changes()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields_json JSONB := '[]'::JSONB;
  old_vals JSONB := '{}'::JSONB;
  new_vals JSONB := '{}'::JSONB;
  col_name TEXT;
  action_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := 'created';
    new_vals := to_jsonb(NEW);
    
    INSERT INTO contact_audit_logs (contact_id, action, new_values, user_id)
    VALUES (NEW.id, action_type, new_vals, auth.uid());
    
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'updated';
    
    -- Comparar cada campo
    FOR col_name IN SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'contacts' AND table_schema = 'public'
    LOOP
      IF to_jsonb(OLD) ->> col_name IS DISTINCT FROM to_jsonb(NEW) ->> col_name THEN
        changed_fields_json := changed_fields_json || to_jsonb(col_name);
        old_vals := old_vals || jsonb_build_object(col_name, to_jsonb(OLD) ->> col_name);
        new_vals := new_vals || jsonb_build_object(col_name, to_jsonb(NEW) ->> col_name);
      END IF;
    END LOOP;
    
    -- Só registra se houve mudanças
    IF jsonb_array_length(changed_fields_json) > 0 THEN
      INSERT INTO contact_audit_logs (contact_id, action, changed_fields, old_values, new_values, user_id)
      VALUES (NEW.id, action_type, changed_fields_json, old_vals, new_vals, auth.uid());
    END IF;
    
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'deleted';
    old_vals := to_jsonb(OLD);
    
    INSERT INTO contact_audit_logs (contact_id, action, old_values, user_id)
    VALUES (OLD.id, action_type, old_vals, auth.uid());
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Trigger para auditoria automática
DROP TRIGGER IF EXISTS trigger_contact_audit ON contacts;
CREATE TRIGGER trigger_contact_audit
AFTER INSERT OR UPDATE OR DELETE ON contacts
FOR EACH ROW EXECUTE FUNCTION log_contact_changes();

-- 10. Criar tabela de arquivos do contato
CREATE TABLE IF NOT EXISTS contact_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'outros' CHECK (category IN ('proposta', 'contrato', 'documento', 'imagem', 'outros')),
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contact files"
ON contact_files
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 11. Criar tabela de notas do contato
CREATE TABLE IF NOT EXISTS contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  created_by UUID,
  created_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contact notes"
ON contact_notes
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);