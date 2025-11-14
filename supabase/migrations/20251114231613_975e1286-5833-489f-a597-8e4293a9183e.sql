-- Adicionar RLS policy pública para painels pelo ID
-- Permite que qualquer um acesse um painel pelo seu ID (necessário para painel-kiosk)
CREATE POLICY "public_access_painels_by_id" ON painels
  FOR SELECT
  USING (true);