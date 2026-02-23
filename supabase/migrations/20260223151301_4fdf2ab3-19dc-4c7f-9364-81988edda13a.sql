
-- 1. Regra de pontuação para logo (10 pontos)
INSERT INTO public.contact_scoring_rules (campo, label, pontos, ordem, ativo)
VALUES ('logo_url', 'Logo da empresa', 10, 10, true)
ON CONFLICT DO NOTHING;

-- 2. Atualizar trigger calculate_contact_score para incluir logo_url
CREATE OR REPLACE FUNCTION public.calculate_contact_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_score INTEGER := 0;
  v_min_score INTEGER;
  v_has_scoring BOOLEAN;
BEGIN
  -- Verificar se categoria tem pontuação
  SELECT pontuacao_ativa, pontuacao_minima INTO v_has_scoring, v_min_score
  FROM public.contact_scoring_config 
  WHERE categoria = NEW.categoria;

  IF NOT FOUND OR NOT v_has_scoring THEN
    NEW.pontuacao_atual := NULL;
    NEW.bloqueado := false;
    NEW.motivo_bloqueio := NULL;
    RETURN NEW;
  END IF;

  -- Calcular pontuação baseado nas regras
  IF NEW.telefone IS NOT NULL AND NEW.telefone != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'telefone' AND ativo = true), 0);
  END IF;
  
  IF NEW.email IS NOT NULL AND NEW.email LIKE '%@%.%' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'email' AND ativo = true), 0);
  END IF;
  
  IF NEW.cnpj IS NOT NULL AND length(regexp_replace(NEW.cnpj, '[^0-9]', '', 'g')) >= 11 THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'cnpj' AND ativo = true), 0);
  END IF;
  
  IF NEW.endereco IS NOT NULL AND NEW.endereco != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'endereco' AND ativo = true), 0);
  END IF;
  
  IF NEW.tomador_decisao IS NOT NULL AND NEW.tomador_decisao != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'tomador_decisao' AND ativo = true), 0);
  END IF;
  
  IF NEW.empresa IS NOT NULL AND NEW.empresa != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'empresa' AND ativo = true), 0);
  END IF;
  
  IF NEW.bairro IS NOT NULL AND NEW.bairro != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'bairro' AND ativo = true), 0);
  END IF;
  
  IF NEW.publico_alvo IS NOT NULL AND NEW.publico_alvo != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'publico_alvo' AND ativo = true), 0);
  END IF;
  
  IF NEW.dores_identificadas IS NOT NULL AND NEW.dores_identificadas != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'dores_identificadas' AND ativo = true), 0);
  END IF;

  -- NOVO: Logo da empresa vale pontos
  IF NEW.logo_url IS NOT NULL AND NEW.logo_url != '' THEN
    v_score := v_score + COALESCE((SELECT pontos FROM public.contact_scoring_rules WHERE campo = 'logo_url' AND ativo = true), 0);
  END IF;

  -- Atualizar pontuação
  NEW.pontuacao_atual := v_score;
  NEW.pontuacao_calculada_em := now();

  -- Verificar bloqueio
  IF v_score < v_min_score THEN
    NEW.bloqueado := true;
    NEW.motivo_bloqueio := 'Pontuação insuficiente: ' || v_score || '/' || v_min_score;
  ELSE
    NEW.bloqueado := false;
    NEW.motivo_bloqueio := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger de sync proposta -> contato (logo)
CREATE OR REPLACE FUNCTION public.sync_proposal_logo_to_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Quando uma proposta tem client_logo_url, sincronizar para o contato
  IF NEW.client_logo_url IS NOT NULL AND NEW.client_logo_url != '' AND NEW.client_phone IS NOT NULL THEN
    -- Buscar contato pelo telefone e atualizar logo_url se ainda não tem
    UPDATE public.contacts
    SET logo_url = NEW.client_logo_url,
        updated_at = now()
    WHERE telefone = NEW.client_phone
      AND (logo_url IS NULL OR logo_url = '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger na tabela proposals
DROP TRIGGER IF EXISTS trg_sync_proposal_logo ON public.proposals;
CREATE TRIGGER trg_sync_proposal_logo
  AFTER INSERT OR UPDATE OF client_logo_url ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_proposal_logo_to_contact();
