-- Adicionar admin_departamental ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin_departamental';