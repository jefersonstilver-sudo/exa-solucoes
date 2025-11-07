-- Migration: Fix role_change_audit foreign keys to allow user deletion
-- Issue: Foreign keys with NO ACTION were blocking user deletion

-- First, ensure role_change_audit table exists with correct structure
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  changed_by UUID,
  old_role app_role,
  new_role app_role NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.role_change_audit 
  DROP CONSTRAINT IF EXISTS role_change_audit_user_id_fkey;

ALTER TABLE public.role_change_audit 
  DROP CONSTRAINT IF EXISTS role_change_audit_changed_by_fkey;

-- Create new foreign keys with ON DELETE SET NULL
-- This allows user deletion while preserving audit history
ALTER TABLE public.role_change_audit
  ADD CONSTRAINT role_change_audit_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

ALTER TABLE public.role_change_audit
  ADD CONSTRAINT role_change_audit_changed_by_fkey
  FOREIGN KEY (changed_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_role_change_audit_user_id 
  ON public.role_change_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_changed_by 
  ON public.role_change_audit(changed_by);

-- Enable RLS on role_change_audit
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and super_admins can view all audit logs
CREATE POLICY "Admins can view audit logs" 
  ON public.role_change_audit 
  FOR SELECT 
  USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
  );

-- Policy: Only super_admins can insert audit logs (via functions)
CREATE POLICY "Super admins can insert audit logs" 
  ON public.role_change_audit 
  FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

COMMENT ON TABLE public.role_change_audit IS 'Audit trail for user role changes. Foreign keys use SET NULL to preserve history when users are deleted.';