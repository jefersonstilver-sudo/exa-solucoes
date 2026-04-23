ALTER TABLE public.sindicos_interessados
  ADD COLUMN IF NOT EXISTS protocolo text UNIQUE,
  ADD COLUMN IF NOT EXISTS aceite_hash text;

CREATE SEQUENCE IF NOT EXISTS public.sindicos_protocolo_seq START 1;

CREATE OR REPLACE FUNCTION public.gerar_protocolo_sindico()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.protocolo IS NULL THEN
    NEW.protocolo := 'EXA-' || EXTRACT(YEAR FROM NOW())::text || '-' ||
                     LPAD(nextval('public.sindicos_protocolo_seq')::text, 6, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gerar_protocolo_sindico ON public.sindicos_interessados;

CREATE TRIGGER trg_gerar_protocolo_sindico
BEFORE INSERT ON public.sindicos_interessados
FOR EACH ROW
WHEN (NEW.protocolo IS NULL)
EXECUTE FUNCTION public.gerar_protocolo_sindico();