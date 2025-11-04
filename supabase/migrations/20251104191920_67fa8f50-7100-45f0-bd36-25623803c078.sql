-- Atualizar função de validação para rejeitar tokens cancelados
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
  
  IF v_benefit.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'TOKEN_CANCELLED'
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

-- Atualizar função de registro de escolha para rejeitar tokens cancelados
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
  v_status TEXT;
BEGIN
  SELECT id, token_used, status INTO v_benefit_id, v_already_used, v_status
  FROM provider_benefits
  WHERE access_token = p_token;
  
  IF v_benefit_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOKEN_NOT_FOUND');
  END IF;
  
  IF v_status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'TOKEN_CANCELLED');
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