-- Adicionar políticas de INSERT, UPDATE e DELETE para categorias_despesas
-- Permitir que usuários autenticados gerenciem categorias

-- Política de INSERT para usuários autenticados
CREATE POLICY "Usuários autenticados podem inserir categorias"
ON public.categorias_despesas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política de UPDATE para usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar categorias"
ON public.categorias_despesas
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política de DELETE para usuários autenticados (exceto categorias fixas)
CREATE POLICY "Usuários autenticados podem deletar categorias não-fixas"
ON public.categorias_despesas
FOR DELETE
TO authenticated
USING (
  id NOT IN (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000003'::uuid
  )
);