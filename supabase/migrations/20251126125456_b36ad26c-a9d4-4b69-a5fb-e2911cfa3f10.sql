-- Política RLS para permitir usuários autenticados lerem dispositivos
CREATE POLICY "Authenticated users can read devices"
ON public.devices
FOR SELECT
TO authenticated
USING (true);

-- Comentário explicativo
COMMENT ON POLICY "Authenticated users can read devices" ON public.devices IS 
'Permite que usuários autenticados visualizem todos os dispositivos no dashboard de monitoramento';