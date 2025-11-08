-- Create RPC function to get provider benefits statistics by month
CREATE OR REPLACE FUNCTION get_provider_benefits_stats_by_month(
  p_year INT,
  p_month INT
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_benefits', COUNT(*)::INT,
    'pending_count', COUNT(CASE WHEN status = 'pending' THEN 1 END)::INT,
    'choice_made_count', COUNT(CASE WHEN status = 'choice_made' THEN 1 END)::INT,
    'code_sent_count', COUNT(CASE WHEN status = 'code_sent' THEN 1 END)::INT,
    'cancelled_count', COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::INT,
    'requires_action_count', COUNT(CASE WHEN status = 'choice_made' THEN 1 END)::INT,
    'month_year', p_year || '-' || LPAD(p_month::TEXT, 2, '0')
  ) INTO result
  FROM provider_benefits
  WHERE EXTRACT(YEAR FROM created_at) = p_year
    AND EXTRACT(MONTH FROM created_at) = p_month;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;