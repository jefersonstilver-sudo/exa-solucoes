-- Add blocking fields to pedidos table
ALTER TABLE public.pedidos 
ADD COLUMN blocked_reason TEXT,
ADD COLUMN blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN blocked_at TIMESTAMP WITH TIME ZONE;

-- Update status enum to include 'bloqueado'
-- Note: We're not using ALTER TYPE because it can cause issues, 
-- instead we'll handle this in the application logic

-- Create audit table for blocking actions
CREATE TABLE public.pedido_blocking_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'blocked', 'unblocked'
  reason TEXT,
  performed_by UUID NOT NULL REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the new table
ALTER TABLE public.pedido_blocking_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blocking logs (super admin only)
CREATE POLICY "Super admins can manage blocking logs" 
ON public.pedido_blocking_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Create function to handle order blocking with audit
CREATE OR REPLACE FUNCTION public.block_order_secure(
  p_pedido_id UUID,
  p_reason TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_old_status TEXT;
  v_result JSONB;
BEGIN
  -- Get admin ID and verify permissions
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;
  
  -- Get current status
  SELECT status INTO v_old_status
  FROM public.pedidos
  WHERE id = p_pedido_id;
  
  IF v_old_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found'
    );
  END IF;
  
  -- Block the order
  UPDATE public.pedidos
  SET 
    status = 'bloqueado',
    blocked_reason = p_reason,
    blocked_by = v_admin_id,
    blocked_at = now()
  WHERE id = p_pedido_id;
  
  -- Deactivate all videos for this order
  UPDATE public.pedido_videos
  SET 
    is_active = false,
    selected_for_display = false,
    updated_at = now()
  WHERE pedido_id = p_pedido_id;
  
  -- Log the blocking action
  INSERT INTO public.pedido_blocking_logs (
    pedido_id,
    action_type,
    reason,
    performed_by,
    ip_address,
    user_agent,
    details
  ) VALUES (
    p_pedido_id,
    'blocked',
    p_reason,
    v_admin_id,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'previous_status', v_old_status,
      'timestamp', now()
    )
  );
  
  -- Log system event
  INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
  ) VALUES (
    'ORDER_BLOCKED_SECURITY',
    format('Order %s blocked by admin %s. Reason: %s', 
           p_pedido_id, v_admin_id, p_reason)
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Order blocked successfully',
    'previous_status', v_old_status,
    'blocked_at', now()
  );
  
  RETURN v_result;
END;
$$;

-- Create function to unblock orders (super admin only)
CREATE OR REPLACE FUNCTION public.unblock_order_secure(
  p_pedido_id UUID,
  p_reason TEXT DEFAULT 'Order unblocked by admin'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_previous_status TEXT;
  v_result JSONB;
BEGIN
  -- Get admin ID and verify super admin permissions
  v_admin_id := auth.uid();
  
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = v_admin_id 
    AND role = 'super_admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only super admins can unblock orders'
    );
  END IF;
  
  -- Get order info
  SELECT 
    CASE 
      WHEN blocked_at IS NOT NULL THEN 'video_aprovado'
      ELSE 'ativo'
    END
  INTO v_previous_status
  FROM public.pedidos
  WHERE id = p_pedido_id AND status = 'bloqueado';
  
  IF v_previous_status IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order not found or not blocked'
    );
  END IF;
  
  -- Unblock the order
  UPDATE public.pedidos
  SET 
    status = v_previous_status,
    blocked_reason = NULL,
    blocked_by = NULL,
    blocked_at = NULL
  WHERE id = p_pedido_id;
  
  -- Log the unblocking action
  INSERT INTO public.pedido_blocking_logs (
    pedido_id,
    action_type,
    reason,
    performed_by,
    details
  ) VALUES (
    p_pedido_id,
    'unblocked',
    p_reason,
    v_admin_id,
    jsonb_build_object(
      'restored_status', v_previous_status,
      'timestamp', now()
    )
  );
  
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Order unblocked successfully',
    'restored_status', v_previous_status
  );
  
  RETURN v_result;
END;
$$;