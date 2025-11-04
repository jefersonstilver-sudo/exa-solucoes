-- Criar tabela de benefícios para prestadores
CREATE TABLE IF NOT EXISTS provider_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  activation_point TEXT,
  observation TEXT,
  
  -- Token e segurança
  access_token TEXT UNIQUE NOT NULL,
  token_used BOOLEAN DEFAULT false,
  token_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Escolha do presente
  benefit_choice TEXT,
  benefit_chosen_at TIMESTAMP WITH TIME ZONE,
  
  -- Código do vale-presente
  gift_code TEXT,
  gift_code_inserted_at TIMESTAMP WITH TIME ZONE,
  gift_code_inserted_by UUID REFERENCES auth.users(id),
  
  -- Status do envio
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'choice_made', 'code_sent')),
  
  -- Emails enviados
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  final_email_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Auditoria
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_provider_benefits_token ON provider_benefits(access_token);
CREATE INDEX IF NOT EXISTS idx_provider_benefits_status ON provider_benefits(status);
CREATE INDEX IF NOT EXISTS idx_provider_benefits_email ON provider_benefits(provider_email);

-- RLS Policies
ALTER TABLE provider_benefits ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all benefits" ON provider_benefits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins podem inserir
CREATE POLICY "Admins can insert benefits" ON provider_benefits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admins podem atualizar
CREATE POLICY "Admins can update benefits" ON provider_benefits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_provider_benefits_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER provider_benefits_updated_at
  BEFORE UPDATE ON provider_benefits
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_benefits_updated_at();

-- Função para validar token
CREATE OR REPLACE FUNCTION validate_benefit_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_benefit RECORD;
BEGIN
  SELECT * INTO v_benefit
  FROM provider_benefits
  WHERE access_token = p_token;
  
  IF v_benefit IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'TOKEN_NOT_FOUND'
    );
  END IF;
  
  IF v_benefit.token_used = true THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'TOKEN_ALREADY_USED',
      'benefit_choice', v_benefit.benefit_choice
    );
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'provider_name', v_benefit.provider_name,
    'activation_point', v_benefit.activation_point,
    'benefit_id', v_benefit.id
  );
END;
$$;

-- Função para registrar escolha
CREATE OR REPLACE FUNCTION register_benefit_choice(
  p_token TEXT,
  p_choice TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_benefit_id UUID;
  v_already_used BOOLEAN;
BEGIN
  SELECT id, token_used INTO v_benefit_id, v_already_used
  FROM provider_benefits
  WHERE access_token = p_token;
  
  IF v_benefit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOKEN_NOT_FOUND');
  END IF;
  
  IF v_already_used = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOKEN_ALREADY_USED');
  END IF;
  
  UPDATE provider_benefits
  SET 
    benefit_choice = p_choice,
    benefit_chosen_at = NOW(),
    token_used = true,
    token_used_at = NOW(),
    status = 'choice_made'
  WHERE id = v_benefit_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'benefit_id', v_benefit_id,
    'choice', p_choice
  );
END;
$$;