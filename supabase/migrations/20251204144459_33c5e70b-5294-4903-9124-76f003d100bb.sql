-- Primeiro, listar e dropar TODAS as variantes da função
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT 
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'super_admin_delete_pedido_complete'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.super_admin_delete_pedido_complete(%s) CASCADE', func_record.args);
        RAISE NOTICE 'Dropped: super_admin_delete_pedido_complete(%)', func_record.args;
    END LOOP;
END $$;