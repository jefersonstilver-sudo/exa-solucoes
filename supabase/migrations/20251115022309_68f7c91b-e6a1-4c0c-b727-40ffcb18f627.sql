-- =====================================================
-- SECURITY FIX: Enable RLS and fix pedidos public access
-- =====================================================

-- 1. CRITICAL: Remove public access policy from pedidos table
DROP POLICY IF EXISTS "public_read_active_pedidos" ON pedidos;

-- 2. Enable RLS on all tables that don't have it enabled
-- (The linter detected tables without RLS in public schema)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename NOT IN (
      SELECT tablename 
      FROM pg_tables t
      WHERE schemaname = 'public'
      AND rowsecurity = true
    )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'Enabled RLS on table: %', tbl;
  END LOOP;
END $$;

-- 3. Create secure authenticated-only policy for pedidos
-- Users can only see their own orders, admins see all
CREATE POLICY "authenticated_users_read_own_pedidos"
ON pedidos
FOR SELECT
TO authenticated
USING (
  -- Users see their own orders
  (auth.uid() = client_id)
  OR
  -- Admins and super_admins see all orders
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'admin_marketing')
    )
  )
);

-- 4. Ensure proper policies for other operations on pedidos
CREATE POLICY "authenticated_users_insert_own_pedidos"
ON pedidos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "authenticated_users_update_own_pedidos"
ON pedidos
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = client_id)
  OR
  (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin', 'admin_marketing')
    )
  )
);

-- 5. Add comment for documentation
COMMENT ON POLICY "authenticated_users_read_own_pedidos" ON pedidos IS 
'Security Fix: Removed public access. Users can only view their own orders or all if admin/super_admin.';