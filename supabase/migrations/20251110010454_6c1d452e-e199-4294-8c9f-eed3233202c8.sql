-- =====================================================
-- FIX: Adicionar coluna updated_at na tabela pedidos
-- que está sendo referenciada em várias funções
-- =====================================================

-- Adicionar coluna updated_at se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pedidos' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.pedidos 
    ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    
    RAISE NOTICE 'Coluna updated_at adicionada à tabela pedidos';
  ELSE
    RAISE NOTICE 'Coluna updated_at já existe na tabela pedidos';
  END IF;
END $$;

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_pedidos_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_pedidos_updated_at ON public.pedidos;

CREATE TRIGGER trigger_update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pedidos_updated_at();

-- Atualizar todos os registros existentes com timestamp atual
UPDATE public.pedidos
SET updated_at = created_at
WHERE updated_at IS NULL;