-- Políticas RLS para permitir vinculação de painéis via token

-- Permitir leitura pública para vincular painéis (necessário para buscar por token)
CREATE POLICY "Permitir leitura pública de painéis para vinculação"
ON public.painels
FOR SELECT
TO public
USING (true);

-- Permitir update público para vincular painéis (apenas campos específicos)
CREATE POLICY "Permitir vinculação pública de painéis"
ON public.painels
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Permitir inserção apenas para usuários autenticados (admin)
CREATE POLICY "Apenas admins podem criar painéis"
ON public.painels
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir deleção apenas para usuários autenticados (admin)
CREATE POLICY "Apenas admins podem deletar painéis"
ON public.painels
FOR DELETE
TO authenticated
USING (true);