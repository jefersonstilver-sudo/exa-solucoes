-- Fix RLS policies for pedidos table to prevent unauthorized access
-- Remove potentially problematic overlapping policies and create secure consolidated ones

-- First, drop all existing SELECT policies on pedidos table
DROP POLICY IF EXISTS "Admin can view all orders" ON public.pedidos;
DROP POLICY IF EXISTS "Users can view accessible orders only" ON public.pedidos;
DROP POLICY IF EXISTS "users_view_own_pedidos" ON public.pedidos;

-- Create a single, comprehensive SELECT policy that properly restricts access
CREATE POLICY "pedidos_secure_select_policy" ON public.pedidos
    FOR SELECT
    USING (
        -- Users can only see their own orders
        (auth.uid() = client_id)
        OR
        -- OR admins/super_admins can see all orders
        (
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() 
                AND users.role IN ('admin', 'super_admin')
            )
        )
    );

-- Ensure UPDATE policy is secure (only admins and super_admins can update)
DROP POLICY IF EXISTS "admin_update_pedidos" ON public.pedidos;
CREATE POLICY "pedidos_secure_update_policy" ON public.pedidos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Ensure DELETE policy is secure (only super_admins can delete)
DROP POLICY IF EXISTS "admin_delete_pedidos" ON public.pedidos;
CREATE POLICY "pedidos_secure_delete_policy" ON public.pedidos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'super_admin'
        )
    );

-- Create a security definer function to safely check pedido access for specific use cases
CREATE OR REPLACE FUNCTION public.can_access_pedido_secure(p_pedido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_pedido_client_id uuid;
    v_user_id uuid;
    v_user_role text;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    -- If no user is authenticated, deny access
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Get user role
    SELECT role INTO v_user_role
    FROM public.users
    WHERE id = v_user_id;
    
    -- Admins and super_admins can access all pedidos
    IF v_user_role IN ('admin', 'super_admin') THEN
        RETURN true;
    END IF;
    
    -- Get pedido client_id
    SELECT client_id INTO v_pedido_client_id
    FROM public.pedidos
    WHERE id = p_pedido_id;
    
    -- If pedido doesn't exist, deny access
    IF v_pedido_client_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Users can only access their own pedidos
    RETURN (v_user_id = v_pedido_client_id);
END;
$$;

-- Add comment explaining the security model
COMMENT ON TABLE public.pedidos IS 'Orders table with RLS: Users can only see their own orders, admins can see all orders. Contains sensitive financial data including payment logs and transaction IDs.';

-- Log the security fix
INSERT INTO public.log_eventos_sistema (
    tipo_evento,
    descricao
) VALUES (
    'SECURITY_FIX_PEDIDOS_RLS',
    'Applied comprehensive security fix to pedidos table RLS policies to prevent unauthorized access to customer purchase data'
);