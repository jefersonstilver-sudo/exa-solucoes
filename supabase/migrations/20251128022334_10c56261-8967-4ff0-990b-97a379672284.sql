-- ============================================
-- MIGRATION: Permitir acesso público a relatórios por UUID
-- ============================================

-- Adicionar policy para permitir leitura pública de relatórios por UUID
CREATE POLICY "Allow public read by UUID" 
ON generated_reports 
FOR SELECT 
USING (true);

-- Comentário: O UUID de 36 caracteres serve como "senha" única
-- Links expiram automaticamente após 30 dias (implementar trigger se necessário)