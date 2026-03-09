-- 1. Tabela de categorias de incidentes (CRUD completo)
CREATE TABLE IF NOT EXISTS incident_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '❓',
  color TEXT NOT NULL DEFAULT '#6B7280',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE incident_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read incident_categories"
  ON incident_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert incident_categories"
  ON incident_categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update incident_categories"
  ON incident_categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete incident_categories"
  ON incident_categories FOR DELETE TO authenticated USING (is_default = false);

-- Seed categorias padrão
INSERT INTO incident_categories (name, label, icon, color, is_default, sort_order) VALUES
  ('energia', 'Queda de Energia', '⚡', '#EF4444', true, 1),
  ('internet', 'Falha de Internet', '🌐', '#3B82F6', true, 2),
  ('hardware', 'Problema de Hardware', '🔧', '#F59E0B', true, 3),
  ('elevador', 'Manutenção Elevador', '🛗', '#8B5CF6', true, 4),
  ('manutencao', 'Manutenção Programada', '📅', '#10B981', true, 5),
  ('desconhecido', 'Causa Desconhecida', '❓', '#6B7280', true, 6);

-- 2. Tabela de incidentes offline
CREATE TABLE IF NOT EXISTS device_offline_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  category_id UUID REFERENCES incident_categories(id) ON DELETE SET NULL,
  causa TEXT,
  resolucao TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  registrado_por_nome TEXT,
  registrado_em TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  auto_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_offline_incidents_device ON device_offline_incidents(device_id);
CREATE INDEX idx_device_offline_incidents_status ON device_offline_incidents(status);
CREATE INDEX idx_device_offline_incidents_started ON device_offline_incidents(started_at DESC);

ALTER TABLE device_offline_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read device_offline_incidents"
  ON device_offline_incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert device_offline_incidents"
  ON device_offline_incidents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update device_offline_incidents"
  ON device_offline_incidents FOR UPDATE TO authenticated USING (true);

-- 3. Trigger: criar incidente quando device fica offline, auto-resolver quando volta online
CREATE OR REPLACE FUNCTION handle_device_offline_incident()
RETURNS TRIGGER AS $$
BEGIN
  -- Device ficou offline
  IF (OLD.status IS DISTINCT FROM 'offline') AND NEW.status = 'offline' THEN
    INSERT INTO device_offline_incidents (device_id, started_at, status)
    VALUES (NEW.id, now(), 'pendente');
  END IF;

  -- Device voltou online: auto-resolver incidentes abertos
  IF OLD.status = 'offline' AND (NEW.status IS DISTINCT FROM 'offline') THEN
    UPDATE device_offline_incidents
    SET resolved_at = now(),
        auto_resolved = true,
        status = 'resolvido',
        updated_at = now()
    WHERE device_id = NEW.id
      AND status IN ('pendente', 'causa_registrada')
      AND resolved_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_device_offline_incident
  AFTER UPDATE OF status ON devices
  FOR EACH ROW
  EXECUTE FUNCTION handle_device_offline_incident();