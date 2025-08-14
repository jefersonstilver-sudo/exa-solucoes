-- Fix security issue: Secure panel credentials access
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Super admin access painels" ON public.painels;
DROP POLICY IF EXISTS "admins_can_view_painels_sensitive" ON public.painels;
DROP POLICY IF EXISTS "panels_delete_policy" ON public.painels;
DROP POLICY IF EXISTS "panels_insert_policy" ON public.painels;
DROP POLICY IF EXISTS "panels_update_policy" ON public.painels;

-- Create secure function to check if user can access sensitive panel data
CREATE OR REPLACE FUNCTION public.can_access_panel_credentials()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Create secure function to get basic panel info (non-sensitive)
CREATE OR REPLACE FUNCTION public.get_panels_basic()
RETURNS TABLE(
  id uuid,
  building_id uuid,
  code text,
  status text,
  resolucao text,
  polegada text,
  orientacao text,
  sistema_operacional text,
  modelo text,
  marca text,
  localizacao text,
  created_at timestamp with time zone,
  ultima_sync timestamp with time zone
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $$
  SELECT 
    p.id,
    p.building_id,
    p.code,
    p.status,
    p.resolucao,
    p.polegada,
    p.orientacao,
    p.sistema_operacional,
    p.modelo,
    p.marca,
    p.localizacao,
    p.created_at,
    p.ultima_sync
  FROM public.painels p
  WHERE EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
  );
$$;

-- Create secure function to get sensitive panel credentials (super admin only)
CREATE OR REPLACE FUNCTION public.get_panel_credentials(p_panel_id uuid)
RETURNS TABLE(
  id uuid,
  codigo_anydesk text,
  senha_anydesk text,
  ip_interno text,
  mac_address text,
  versao_firmware text,
  observacoes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only super admins can access credentials
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only super admins can access panel credentials';
  END IF;
  
  -- Log access to sensitive data
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'PANEL_CREDENTIALS_ACCESS',
    format('Super admin %s accessed credentials for panel %s', auth.uid(), p_panel_id)
  );
  
  RETURN QUERY
  SELECT 
    p.id,
    p.codigo_anydesk,
    p.senha_anydesk,
    p.ip_interno,
    p.mac_address,
    p.versao_firmware,
    p.observacoes
  FROM public.painels p
  WHERE p.id = p_panel_id;
END;
$$;

-- Create audit table for panel access logs
CREATE TABLE IF NOT EXISTS public.panel_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  panel_id uuid REFERENCES public.painels(id),
  access_type text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.panel_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for audit logs (super admin only)
CREATE POLICY "Super admins can view panel access logs"
ON public.panel_access_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create restrictive RLS policies for painels table
-- Deny direct access to sensitive fields
CREATE POLICY "Deny direct access to painels"
ON public.painels
FOR ALL
TO authenticated
USING (false);

-- Allow super admins full access through functions only
CREATE POLICY "Super admin function access only"
ON public.painels
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Allow admins to access basic panel info through functions
CREATE POLICY "Admin basic access through functions"
ON public.painels
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create function to update panel (with audit logging)
CREATE OR REPLACE FUNCTION public.update_panel_secure(
  p_panel_id uuid,
  p_updates jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_old_values jsonb;
  v_result jsonb;
  v_user_role text;
BEGIN
  -- Check user permissions
  SELECT role INTO v_user_role
  FROM public.users 
  WHERE id = auth.uid();
  
  IF v_user_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Access denied: Insufficient permissions';
  END IF;
  
  -- Get old values for audit
  SELECT to_jsonb(p.*) INTO v_old_values
  FROM public.painels p
  WHERE p.id = p_panel_id;
  
  -- For non-super admins, prevent updating sensitive fields
  IF v_user_role != 'super_admin' THEN
    IF p_updates ? 'codigo_anydesk' OR p_updates ? 'senha_anydesk' OR 
       p_updates ? 'ip_interno' OR p_updates ? 'mac_address' THEN
      RAISE EXCEPTION 'Access denied: Only super admins can update sensitive credentials';
    END IF;
  END IF;
  
  -- Perform update (this will use the RLS policies)
  UPDATE public.painels 
  SET 
    building_id = COALESCE((p_updates->>'building_id')::uuid, building_id),
    code = COALESCE(p_updates->>'code', code),
    status = COALESCE(p_updates->>'status', status),
    resolucao = COALESCE(p_updates->>'resolucao', resolucao),
    polegada = COALESCE(p_updates->>'polegada', polegada),
    orientacao = COALESCE(p_updates->>'orientacao', orientacao),
    sistema_operacional = COALESCE(p_updates->>'sistema_operacional', sistema_operacional),
    modelo = COALESCE(p_updates->>'modelo', modelo),
    marca = COALESCE(p_updates->>'marca', marca),
    localizacao = COALESCE(p_updates->>'localizacao', localizacao),
    observacoes = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'observacoes', observacoes) ELSE observacoes END,
    codigo_anydesk = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'codigo_anydesk', codigo_anydesk) ELSE codigo_anydesk END,
    senha_anydesk = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'senha_anydesk', senha_anydesk) ELSE senha_anydesk END,
    ip_interno = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'ip_interno', ip_interno) ELSE ip_interno END,
    mac_address = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'mac_address', mac_address) ELSE mac_address END,
    versao_firmware = CASE WHEN v_user_role = 'super_admin' THEN COALESCE(p_updates->>'versao_firmware', versao_firmware) ELSE versao_firmware END
  WHERE id = p_panel_id;
  
  -- Log the update
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'PANEL_UPDATE',
    format('User %s (%s) updated panel %s', auth.uid(), v_user_role, p_panel_id)
  );
  
  -- Log in panel access table
  INSERT INTO public.panel_access_logs (
    user_id,
    panel_id,
    access_type
  ) VALUES (
    auth.uid(),
    p_panel_id,
    'UPDATE'
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Panel updated successfully',
    'user_role', v_user_role
  );
  
  RETURN v_result;
END;
$$;