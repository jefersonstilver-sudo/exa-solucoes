-- Create RPC function to get user statistics by role
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', COUNT(*)::INT,
    'admins_count', COUNT(CASE WHEN role IN ('admin', 'admin_marketing', 'admin_financeiro') THEN 1 END)::INT,
    'super_admins_count', COUNT(CASE WHEN role = 'super_admin' THEN 1 END)::INT,
    'clients_count', COUNT(CASE WHEN role = 'client' THEN 1 END)::INT,
    'other_count', COUNT(CASE WHEN role NOT IN ('admin', 'admin_marketing', 'admin_financeiro', 'super_admin', 'client') THEN 1 END)::INT,
    'users_this_month', COUNT(CASE WHEN data_criacao >= date_trunc('month', CURRENT_DATE) THEN 1 END)::INT,
    'verified_users', COUNT(CASE WHEN email_verified_at IS NOT NULL THEN 1 END)::INT
  ) INTO result
  FROM public.users;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';