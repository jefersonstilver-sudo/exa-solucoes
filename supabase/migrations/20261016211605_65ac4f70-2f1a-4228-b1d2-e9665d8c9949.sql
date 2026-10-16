ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS max_video_duration_override integer NULL;
CREATE OR REPLACE FUNCTION public.validate_max_video_duration_override() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.max_video_duration_override IS NOT NULL AND (NEW.max_video_duration_override < 5 OR NEW.max_video_duration_override > 120) THEN
    RAISE EXCEPTION 'max_video_duration_override deve estar entre 5 e 120 segundos';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_validate_max_video_duration_override ON public.pedidos;
CREATE TRIGGER trg_validate_max_video_duration_override BEFORE INSERT OR UPDATE OF max_video_duration_override ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.validate_max_video_duration_override();
UPDATE public.pedidos SET max_video_duration_override = 35 WHERE id = 'c08f3154-e0dc-4c39-b8a2-721d8acdde7f';