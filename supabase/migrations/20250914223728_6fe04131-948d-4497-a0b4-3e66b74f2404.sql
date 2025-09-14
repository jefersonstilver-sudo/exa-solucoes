-- Create audit table for lead data access
CREATE TABLE public.lead_data_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_count INTEGER NOT NULL DEFAULT 0,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.lead_data_access_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can access audit logs
CREATE POLICY "Super admins can access lead audit logs" 
ON public.lead_data_access_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role = 'super_admin'
));

-- Secure function to get sindicos interessados with logging
CREATE OR REPLACE FUNCTION public.get_sindicos_interessados_secure()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  nome_predio text,
  endereco text,
  email text,
  celular text,
  numero_andares integer,
  numero_unidades integer,
  observacoes text,
  status text,
  data_contato date,
  responsavel_contato uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_record_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'sindicos_interessados', 'UNAUTHORIZED_ACCESS_ATTEMPT', 0
    );
    
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Count records for logging
  SELECT COUNT(*) INTO v_record_count
  FROM public.sindicos_interessados;
  
  -- Log access
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'sindicos_interessados', 'SELECT_ALL', v_record_count
  );
  
  -- Return data
  RETURN QUERY
  SELECT 
    s.id,
    s.nome_completo,
    s.nome_predio,
    s.endereco,
    s.email,
    s.celular,
    s.numero_andares,
    s.numero_unidades,
    s.observacoes,
    s.status,
    s.data_contato,
    s.responsavel_contato,
    s.created_at,
    s.updated_at
  FROM public.sindicos_interessados s
  ORDER BY s.created_at DESC;
END;
$$;

-- Secure function to update sindico status
CREATE OR REPLACE FUNCTION public.update_sindico_status_secure(
  p_sindico_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_old_status TEXT;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'sindicos_interessados', 'UNAUTHORIZED_UPDATE_ATTEMPT', 0
    );
    
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get old status
  SELECT status INTO v_old_status
  FROM public.sindicos_interessados
  WHERE id = p_sindico_id;
  
  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Record not found');
  END IF;
  
  -- Update status
  UPDATE public.sindicos_interessados
  SET 
    status = p_new_status,
    data_contato = CASE WHEN p_new_status = 'contatado' THEN CURRENT_DATE ELSE data_contato END,
    responsavel_contato = v_user_id,
    updated_at = now()
  WHERE id = p_sindico_id;
  
  -- Log update
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'sindicos_interessados', 'UPDATE_STATUS', 1
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'old_status', v_old_status,
    'new_status', p_new_status
  );
  
  RETURN v_result;
END;
$$;

-- Secure function for leads_exa
CREATE OR REPLACE FUNCTION public.get_leads_exa_secure()
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  whatsapp text,
  empresa text,
  objetivo text,
  contato_realizado boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_record_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_exa', 'UNAUTHORIZED_ACCESS_ATTEMPT', 0
    );
    
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Count records for logging
  SELECT COUNT(*) INTO v_record_count
  FROM public.leads_exa;
  
  -- Log access
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_exa', 'SELECT_ALL', v_record_count
  );
  
  -- Return data
  RETURN QUERY
  SELECT 
    l.id,
    l.nome,
    l.email,
    l.whatsapp,
    l.empresa,
    l.objetivo,
    l.contato_realizado,
    l.created_at,
    l.updated_at
  FROM public.leads_exa l
  ORDER BY l.created_at DESC;
END;
$$;

-- Secure function to mark EXA lead as contacted
CREATE OR REPLACE FUNCTION public.mark_exa_lead_contacted_secure(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_exa', 'UNAUTHORIZED_UPDATE_ATTEMPT', 0
    );
    
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Update lead
  UPDATE public.leads_exa
  SET 
    contato_realizado = true,
    updated_at = now()
  WHERE id = p_lead_id;
  
  -- Log update
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_exa', 'MARK_CONTACTED', 1
  );
  
  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

-- Secure function for leads_linkae
CREATE OR REPLACE FUNCTION public.get_leads_linkae_secure()
RETURNS TABLE(
  id uuid,
  nome_completo text,
  nome_empresa text,
  cargo text,
  whatsapp text,
  objetivo text,
  status text,
  contato_realizado boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_record_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_linkae', 'UNAUTHORIZED_ACCESS_ATTEMPT', 0
    );
    
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Count records for logging
  SELECT COUNT(*) INTO v_record_count
  FROM public.leads_linkae;
  
  -- Log access
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_linkae', 'SELECT_ALL', v_record_count
  );
  
  -- Return data
  RETURN QUERY
  SELECT 
    l.id,
    l.nome_completo,
    l.nome_empresa,
    l.cargo,
    l.whatsapp,
    l.objetivo,
    l.status,
    l.contato_realizado,
    l.created_at,
    l.updated_at
  FROM public.leads_linkae l
  ORDER BY l.created_at DESC;
END;
$$;

-- Secure function to mark Linkae lead as contacted
CREATE OR REPLACE FUNCTION public.mark_linkae_lead_contacted_secure(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_linkae', 'UNAUTHORIZED_UPDATE_ATTEMPT', 0
    );
    
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Update lead
  UPDATE public.leads_linkae
  SET 
    contato_realizado = true,
    updated_at = now()
  WHERE id = p_lead_id;
  
  -- Log update
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_linkae', 'MARK_CONTACTED', 1
  );
  
  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

-- Secure function for leads_produtora
CREATE OR REPLACE FUNCTION public.get_leads_produtora_secure()
RETURNS TABLE(
  id uuid,
  nome text,
  email text,
  whatsapp text,
  empresa text,
  tipo_video text,
  objetivo text,
  agendar_cafe boolean,
  contato_realizado boolean,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_record_count INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_produtora', 'UNAUTHORIZED_ACCESS_ATTEMPT', 0
    );
    
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;
  
  -- Count records for logging
  SELECT COUNT(*) INTO v_record_count
  FROM public.leads_produtora;
  
  -- Log access
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_produtora', 'SELECT_ALL', v_record_count
  );
  
  -- Return data
  RETURN QUERY
  SELECT 
    l.id,
    l.nome,
    l.email,
    l.whatsapp,
    l.empresa,
    l.tipo_video,
    l.objetivo,
    l.agendar_cafe,
    l.contato_realizado,
    l.created_at
  FROM public.leads_produtora l
  ORDER BY l.created_at DESC;
END;
$$;

-- Secure function to mark Produtora lead as contacted
CREATE OR REPLACE FUNCTION public.mark_produtora_lead_contacted_secure(p_lead_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_user_role TEXT;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
  END IF;
  
  -- Verify admin privileges
  SELECT role INTO v_user_role
  FROM public.users
  WHERE users.id = v_user_id;
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    -- Log unauthorized attempt
    INSERT INTO public.lead_data_access_logs (
      user_id, table_name, operation, record_count
    ) VALUES (
      v_user_id, 'leads_produtora', 'UNAUTHORIZED_UPDATE_ATTEMPT', 0
    );
    
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Update lead
  UPDATE public.leads_produtora
  SET 
    contato_realizado = true
  WHERE id = p_lead_id;
  
  -- Log update
  INSERT INTO public.lead_data_access_logs (
    user_id, table_name, operation, record_count
  ) VALUES (
    v_user_id, 'leads_produtora', 'MARK_CONTACTED', 1
  );
  
  v_result := jsonb_build_object('success', true);
  RETURN v_result;
END;
$$;

-- Now remove existing RLS policies and create restrictive ones
-- Drop existing policies for sindicos_interessados
DROP POLICY IF EXISTS "Admins can update sindicos interessados" ON public.sindicos_interessados;
DROP POLICY IF EXISTS "Admins can view all sindicos interessados" ON public.sindicos_interessados;
DROP POLICY IF EXISTS "Only admins can insert sindicos interessados" ON public.sindicos_interessados;

-- Create restrictive policies - deny all direct access
CREATE POLICY "Deny all direct access to sindicos interessados" 
ON public.sindicos_interessados 
FOR ALL 
USING (false) 
WITH CHECK (false);

-- Allow public inserts for form submissions (edge functions)
CREATE POLICY "Allow public form submissions to sindicos interessados" 
ON public.sindicos_interessados 
FOR INSERT 
WITH CHECK (true);

-- Apply same pattern to other lead tables
-- Note: These tables might not exist yet, so we'll handle errors gracefully
DO $$
BEGIN
  -- leads_exa
  BEGIN
    DROP POLICY IF EXISTS "Super admins can view all leads campanhas" ON public.leads_exa;
    CREATE POLICY "Deny all direct access to leads exa" ON public.leads_exa FOR ALL USING (false) WITH CHECK (false);
    CREATE POLICY "Allow public form submissions to leads exa" ON public.leads_exa FOR INSERT WITH CHECK (true);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist, skip
  END;
  
  -- leads_linkae  
  BEGIN
    DROP POLICY IF EXISTS "Super admins can view all leads campanhas" ON public.leads_linkae;
    CREATE POLICY "Deny all direct access to leads linkae" ON public.leads_linkae FOR ALL USING (false) WITH CHECK (false);
    CREATE POLICY "Allow public form submissions to leads linkae" ON public.leads_linkae FOR INSERT WITH CHECK (true);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist, skip
  END;
  
  -- leads_produtora
  BEGIN
    -- Drop existing policies if any
    CREATE POLICY "Deny all direct access to leads produtora" ON public.leads_produtora FOR ALL USING (false) WITH CHECK (false);
    CREATE POLICY "Allow public form submissions to leads produtora" ON public.leads_produtora FOR INSERT WITH CHECK (true);
  EXCEPTION WHEN undefined_table THEN
    NULL; -- Table doesn't exist, skip
  END;
END $$;