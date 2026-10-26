DO $$
DECLARE r record; def text; newdef text;
BEGIN
  FOR r IN
    SELECT c.oid, c.conrelid::regclass AS t, c.conname, a.attnotnull
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid=c.conrelid AND a.attnum=c.conkey[1]
    WHERE c.contype='f' AND array_length(c.conkey,1)=1
      AND c.confrelid IN ('auth.users'::regclass,'public.users'::regclass)
      AND c.confdeltype NOT IN ('c','n')
      AND c.connamespace='public'::regnamespace
  LOOP
    def := pg_get_constraintdef(r.oid);
    IF NOT r.attnotnull THEN
      newdef := regexp_replace(def, '\s+ON DELETE \w+( \w+)?', '', 'i') || ' ON DELETE SET NULL';
    ELSIF r.t::text IN ('client_activity_events','client_platform_activity','ai_debug_analysis_history','public.client_activity_events','public.client_platform_activity','public.ai_debug_analysis_history') THEN
      newdef := regexp_replace(def, '\s+ON DELETE \w+( \w+)?', '', 'i') || ' ON DELETE CASCADE';
    ELSE
      CONTINUE;
    END IF;
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.t, r.conname);
    EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s', r.t, r.conname, newdef);
  END LOOP;
END $$;