-- Remover policy antiga por id
DROP POLICY IF EXISTS "public_access_painels_by_id" ON painels;

-- Criar nova policy por token_acesso
-- Permite acesso público aos painéis usando o token_acesso (necessário para painel-kiosk)
CREATE POLICY "public_access_painels_by_token" ON painels
  FOR SELECT
  USING (token_acesso IS NOT NULL);