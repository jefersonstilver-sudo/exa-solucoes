-- Add admin access to transaction_sessions table
-- Current policies only allow users to access their own sessions
-- Adding admin and super_admin access for proper oversight

-- Drop existing policies to recreate them with admin access
DROP POLICY IF EXISTS "Users can create their own transaction sessions" ON public.transaction_sessions;
DROP POLICY IF EXISTS "Users can update their own transaction sessions" ON public.transaction_sessions;
DROP POLICY IF EXISTS "Users can view their own transaction sessions" ON public.transaction_sessions;

-- Recreate policies with admin access included

-- Allow users to create their own sessions, admins can create any
CREATE POLICY "Users and admins can create transaction sessions" 
ON public.transaction_sessions 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow users to update their own sessions, admins can update any
CREATE POLICY "Users and admins can update transaction sessions" 
ON public.transaction_sessions 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow users to view their own sessions, admins can view all
CREATE POLICY "Users and admins can view transaction sessions" 
ON public.transaction_sessions 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Allow admins to delete transaction sessions if needed (for cleanup)
CREATE POLICY "Admins can delete transaction sessions" 
ON public.transaction_sessions 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Ensure RLS is enabled on the table
ALTER TABLE public.transaction_sessions ENABLE ROW LEVEL SECURITY;