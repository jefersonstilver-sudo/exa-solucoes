CREATE OR REPLACE FUNCTION public.sync_sindico_legado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sindico_nome IS NOT NULL AND (NEW.nome_completo IS NULL OR NEW.nome_completo = '') THEN
    NEW.nome_completo := NEW.sindico_nome;
  END IF;

  IF NEW.endereco_logradouro IS NOT NULL AND (NEW.endereco IS NULL OR NEW.endereco = '') THEN
    NEW.endereco := NEW.endereco_logradouro
      || COALESCE(', ' || NEW.endereco_numero, '')
      || COALESCE(' - ' || NEW.endereco_bairro, '')
      || COALESCE(', ' || NEW.endereco_cidade, '')
      || COALESCE('/' || NEW.endereco_uf, '');
  END IF;

  IF NEW.quantidade_andares IS NOT NULL AND NEW.numero_andares IS NULL THEN
    NEW.numero_andares := NEW.quantidade_andares;
  END IF;

  IF NEW.quantidade_unidades_total IS NOT NULL AND NEW.numero_unidades IS NULL THEN
    NEW.numero_unidades := NEW.quantidade_unidades_total;
  END IF;

  IF NEW.sindico_email IS NOT NULL AND (NEW.email IS NULL OR NEW.email = '') THEN
    NEW.email := NEW.sindico_email;
  END IF;

  IF NEW.sindico_whatsapp IS NOT NULL AND (NEW.celular IS NULL OR NEW.celular = '') THEN
    NEW.celular := NEW.sindico_whatsapp;
  END IF;

  IF NEW.responsavel_id IS NOT NULL AND NEW.responsavel_contato IS NULL THEN
    NEW.responsavel_contato := NEW.responsavel_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_sindico_legado ON public.sindicos_interessados;

CREATE TRIGGER trg_sync_sindico_legado
BEFORE INSERT OR UPDATE ON public.sindicos_interessados
FOR EACH ROW
EXECUTE FUNCTION public.sync_sindico_legado();

COMMENT ON FUNCTION public.sync_sindico_legado() IS 'Sincroniza colunas legadas NOT NULL a partir das colunas novas para permitir INSERT do formulário público /interessesindico sem quebrar componentes admin existentes.';