-- Add telefone column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telefone text;

-- Backfill telefone and cpf from auth.users metadata for existing users
DO $$
DECLARE
    user_record RECORD;
    auth_data jsonb;
BEGIN
    FOR user_record IN SELECT id, email FROM public.users LOOP
        -- Get auth user metadata
        SELECT raw_user_meta_data INTO auth_data 
        FROM auth.users 
        WHERE id = user_record.id;
        
        IF auth_data IS NOT NULL THEN
            -- Update telefone if available in metadata
            UPDATE public.users 
            SET telefone = COALESCE(
                auth_data->>'telefone', 
                auth_data->>'phone'
            )
            WHERE id = user_record.id 
            AND telefone IS NULL
            AND (auth_data->>'telefone' IS NOT NULL OR auth_data->>'phone' IS NOT NULL);
            
            -- Update cpf if available and not already set
            UPDATE public.users 
            SET cpf = auth_data->>'cpf'
            WHERE id = user_record.id 
            AND cpf IS NULL
            AND auth_data->>'cpf' IS NOT NULL;
        END IF;
    END LOOP;
END $$;

-- Create RLS policy for admins to access all users data
CREATE POLICY "admins_can_select_all_users" 
ON public.users 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
));