-- Adicionar tipos de contato faltantes
INSERT INTO public.contact_types (name, label, color, icon, is_default) VALUES
  ('sindico_lead', 'Síndico Lead', '#f59e0b', 'user-check', true),
  ('lead', 'Lead', '#8b5cf6', 'target', true),
  ('eletricista', 'Eletricista', '#06b6d4', 'zap', true),
  ('tecnico_elevador', 'Técnico Elevador', '#ec4899', 'wrench', true),
  ('outros_prestadores', 'Outros Prestadores', '#64748b', 'briefcase', true)
ON CONFLICT (name) DO UPDATE SET
  label = EXCLUDED.label,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = NOW();